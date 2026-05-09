import {
  createEntry,
  createVault,
  getAppMeta,
  getVault,
  importEntriesIntoVault,
  listEntries,
  listVaults,
  setAppMeta,
  updateVault,
} from '../../tables/services/tableVaultDb';
import { mergeFieldOptions, normalizeField } from '../../../shared/utils/tableVault';
import { getDayType, getTimeOfDay } from './afterlightAnalytics';

const AFTERLIGHT_VAULT_META_KEY = 'afterlightVaultId';
const AFTERLIGHT_MINUTE_PRESETS_META_KEY = 'afterlightMinutePresets';

const DEFAULT_FIELDS = [
  { key: 'title', label: 'Title', type: 'text', options: [] },
  { key: 'action', label: 'Action', type: 'multiselect', options: ['Instagram', 'TikTok', 'YouTube', 'Facebook', 'Bumble', 'Web'] },
  { key: 'state', label: 'Vulnerability', type: 'multiselect', options: ['Bored', 'Lonely', 'Tired', 'Stressed', 'Seeking', 'Lustful'] },
  { key: 'location', label: 'Location', type: 'select', options: ['Room', 'Home alone', 'Home with family', 'With relatives', 'With friends', 'Commute'] },
  { key: 'time', label: 'Time of day', type: 'select', options: ['Morning', 'Afternoon', 'Evening', 'Night'] },
  { key: 'daytype', label: 'Day type', type: 'select', options: ['WFH', 'Office day', 'Weekend', 'Day off', 'Socials'] },
  { key: 'minutes', label: 'Minutes', type: 'number', options: [] },
  { key: 'notes', label: 'Notes', type: 'textarea', options: [] },
];

const DEFAULT_MINUTE_PRESETS = [15, 25, 30, 45, 60];

function stableStringify(value) {
  return JSON.stringify(value);
}

function buildDefaultVault() {
  return {
    name: 'Afterlight',
    icon: '↳',
    color: 'Amber',
    meta: { domain: 'afterlight' },
    fields: DEFAULT_FIELDS.map((field, index) => normalizeField(field, index)),
    createdAt: Date.now(),
  };
}

function reconcileFields(fields = []) {
  const byKey = new Map((fields || []).map((field, index) => {
    const normalized = normalizeField(field, index);
    return [normalized.key, normalized];
  }));

  const orderedDefaults = DEFAULT_FIELDS.map((field, index) => {
    const existing = byKey.get(field.key);
    if (!existing) return normalizeField(field, index);
    return mergeFieldOptions(
      normalizeField(
        {
          ...existing,
          label: field.label,
          type: field.type,
        },
        index,
      ),
      field.options || [],
    );
  });

  const extras = [...byKey.values()].filter((field) => !DEFAULT_FIELDS.find((base) => base.key === field.key));
  return [...orderedDefaults, ...extras];
}

function formatTitle(data) {
  const action = (data.action || []).join(', ');
  const state = (data.state || []).join(', ');
  return [action, state].filter(Boolean).join(' · ') || 'Afterlight log';
}

function cleanText(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function uniqueList(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeTextList(value) {
  if (Array.isArray(value)) return uniqueList(value.map(cleanText));
  const text = cleanText(value);
  return text ? [text] : [];
}

function normalizeMinutes(value) {
  if (value === '' || value === undefined || value === null) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function resolveLegacyTimestamp(entry, fallbackTimestamp) {
  const rawDate = cleanText(entry?.rawDate);
  if (rawDate) {
    const parsed = new Date(rawDate);
    if (!Number.isNaN(parsed.getTime())) {
      return { createdAt: parsed.getTime(), loggedAtUtc: parsed.toISOString() };
    }
  }

  const dateKey = cleanText(entry?.date);
  if (dateKey) {
    const parsed = new Date(`${dateKey}T12:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      return { createdAt: parsed.getTime(), loggedAtUtc: parsed.toISOString() };
    }
  }

  const fallback = Number.isFinite(fallbackTimestamp) ? fallbackTimestamp : Date.now();
  return { createdAt: fallback, loggedAtUtc: new Date(fallback).toISOString() };
}

function buildLegacyImportRow(entry, fallbackTimestamp) {
  const { createdAt, loggedAtUtc } = resolveLegacyTimestamp(entry, fallbackTimestamp);
  const action = normalizeTextList(entry?.action);
  const state = normalizeTextList(entry?.state);
  const location = cleanText(entry?.location);
  const time = cleanText(entry?.time) || getTimeOfDay(createdAt);
  const daytype = cleanText(entry?.daytype) || getDayType(createdAt);
  const minutes = normalizeMinutes(entry?.minutes);
  const notes = cleanText(entry?.notes);

  return {
    createdAt,
    data: {
      title: formatTitle({ action, state }),
      loggedAtUtc,
      action,
      state,
      location,
      time,
      daytype,
      minutes,
      notes,
    },
  };
}

function normalizeEntry(entry) {
  const data = entry?.data || {};
  return {
    ...entry,
    loggedAtUtc: data.loggedAtUtc || (entry?.createdAt ? new Date(entry.createdAt).toISOString() : ''),
    title: data.title || '',
    action: Array.isArray(data.action) ? data.action : [],
    state: Array.isArray(data.state) ? data.state : [],
    location: data.location || '',
    time: data.time || '',
    daytype: data.daytype || '',
    minutes: data.minutes === '' || data.minutes === undefined || data.minutes === null ? null : Number(data.minutes),
    notes: data.notes || '',
    data,
  };
}

async function ensureMetaDefaults() {
  const minuteMeta = await getAppMeta(AFTERLIGHT_MINUTE_PRESETS_META_KEY);

  if (!Array.isArray(minuteMeta?.value) || !minuteMeta.value.length) {
    await setAppMeta(AFTERLIGHT_MINUTE_PRESETS_META_KEY, DEFAULT_MINUTE_PRESETS);
  }
}

export async function ensureAfterlightVault() {
  await ensureMetaDefaults();

  const stored = await getAppMeta(AFTERLIGHT_VAULT_META_KEY);
  let vault = stored?.value ? await getVault(stored.value) : null;

  if (!vault) {
    const vaults = await listVaults();
    vault = vaults.find((item) => item.meta?.domain === 'afterlight') || null;
  }

  if (!vault) {
    const id = await createVault(buildDefaultVault());
    await setAppMeta(AFTERLIGHT_VAULT_META_KEY, id);
    return getVault(id);
  }

  const nextFields = reconcileFields(vault.fields);
  if (stableStringify(nextFields) !== stableStringify(vault.fields || [])) {
    await updateVault(vault.id, { fields: nextFields, meta: { ...(vault.meta || {}), domain: 'afterlight' } });
    vault = await getVault(vault.id);
  } else if (vault.meta?.domain !== 'afterlight') {
    await updateVault(vault.id, { meta: { ...(vault.meta || {}), domain: 'afterlight' } });
    vault = await getVault(vault.id);
  }

  await setAppMeta(AFTERLIGHT_VAULT_META_KEY, vault.id);
  return vault;
}

export async function getAfterlightWorkspace() {
  const vault = await ensureAfterlightVault();
  const [entries, minuteMeta] = await Promise.all([
    listEntries(vault.id),
    getAppMeta(AFTERLIGHT_MINUTE_PRESETS_META_KEY),
  ]);

  return {
    vault,
    entries: entries.map(normalizeEntry),
    minutePresets: Array.isArray(minuteMeta?.value) ? minuteMeta.value : DEFAULT_MINUTE_PRESETS,
  };
}

export async function createAfterlightEntry(formData) {
  const vault = await ensureAfterlightVault();
  const createdAt = Date.now();
  const loggedAtUtc = new Date(createdAt).toISOString();
  const nextData = {
    uid: crypto.randomUUID(),
    title: formatTitle(formData),
    loggedAtUtc,
    action: Array.isArray(formData.action) ? formData.action.filter(Boolean) : [],
    state: Array.isArray(formData.state) ? formData.state.filter(Boolean) : [],
    location: formData.location || '',
    time: formData.time || getTimeOfDay(createdAt),
    daytype: formData.daytype || getDayType(createdAt),
    minutes: formData.minutes === '' || formData.minutes === null || formData.minutes === undefined ? null : Number(formData.minutes),
    notes: formData.notes || '',
  };

  const nextFields = (vault.fields || []).map((field) => {
    const value = nextData[field.key];
    if (Array.isArray(value)) return mergeFieldOptions(field, value);
    return mergeFieldOptions(field, value ? [value] : []);
  });

  if (stableStringify(nextFields) !== stableStringify(vault.fields || [])) {
    await updateVault(vault.id, { fields: nextFields });
  }

  await createEntry(vault.id, nextData);
  return getAfterlightWorkspace();
}

export function prepareAfterlightLegacyImport(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Import file is empty or invalid.');
  }

  if (!Array.isArray(payload.entries)) {
    throw new Error('Legacy import needs an entries array.');
  }

  const exportedAtText = cleanText(payload.exportedAt);
  const exportedAtTimestamp = exportedAtText ? new Date(exportedAtText).getTime() : Date.now();
  const rows = payload.entries
    .map((entry) => buildLegacyImportRow(entry, exportedAtTimestamp))
    .filter((entry) => entry.data.action.length || entry.data.state.length || entry.data.notes || entry.data.minutes !== null);

  if (!rows.length) {
    throw new Error('No importable Afterlight entries were found in that file.');
  }

  return {
    exportedAt: exportedAtText,
    totalEntries: Number.isFinite(Number(payload.totalEntries)) ? Number(payload.totalEntries) : payload.entries.length,
    entries: rows,
    stateValues: uniqueList(rows.flatMap((entry) => entry.data.state)).sort((a, b) => a.localeCompare(b)),
  };
}

export async function importAfterlightLegacyEntries(plan, stateUpdates = {}) {
  const vault = await ensureAfterlightVault();
  const existingEntries = await listEntries(vault.id);
  const existingTimestamps = new Set(existingEntries.map((e) => e.createdAt));

  const stateMap = new Map(
    Object.entries(stateUpdates || {}).map(([source, target]) => [cleanText(source), cleanText(target) || cleanText(source)]),
  );

  const importedEntries = (plan?.entries || [])
    .filter((entry) => !existingTimestamps.has(entry.createdAt))
    .map((entry) => {
      const state = uniqueList(entry.data.state.map((value) => stateMap.get(cleanText(value)) || cleanText(value)));
      return {
        createdAt: entry.createdAt,
        data: {
          ...entry.data,
          uid: crypto.randomUUID(),
          state,
          title: formatTitle({ action: entry.data.action, state }),
        },
      };
    });

  if (!importedEntries.length) {
    return {
      imported: 0,
      workspace: await getAfterlightWorkspace(),
    };
  }

  const nextFields = (vault.fields || []).map((field) => {
    const values = importedEntries.flatMap((entry) => {
      const value = entry.data[field.key];
      if (Array.isArray(value)) return value;
      return value ? [value] : [];
    });

    return mergeFieldOptions(field, values);
  });

  await importEntriesIntoVault(vault.id, nextFields, importedEntries);
  return {
    imported: importedEntries.length,
    workspace: await getAfterlightWorkspace(),
  };
}

export async function exportAfterlightData() {
  const vault = await ensureAfterlightVault();
  const entries = await listEntries(vault.id);

  const payload = {
    type: 'imago-afterlight-export',
    version: 1,
    exportedAt: new Date().toISOString(),
    entries,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.style.display = 'none';
  anchor.href = url;
  anchor.download = `afterlight-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 100);
}

export async function importAfterlightData(payload) {
  if (!payload || payload.type !== 'imago-afterlight-export') {
    throw new Error('Invalid Afterlight export file.');
  }

  const vault = await ensureAfterlightVault();
  const existingEntries = await listEntries(vault.id);
  const existingUids = new Set(existingEntries.map((e) => e.data.uid).filter(Boolean));
  const existingTimestamps = new Set(existingEntries.map((e) => e.createdAt));

  const entries = (payload.entries || [])
    .filter((entry) => {
      if (entry.data.uid && existingUids.has(entry.data.uid)) return false;
      if (existingTimestamps.has(entry.createdAt)) return false;
      return true;
    })
    .map((entry) => ({
      createdAt: entry.createdAt,
      data: {
        ...entry.data,
        uid: entry.data.uid || crypto.randomUUID(),
      },
    }));

  if (!entries.length) {
    return {
      imported: 0,
      workspace: await getAfterlightWorkspace(),
    };
  }

  const nextFields = (vault.fields || []).map((field) => {
    const values = entries.flatMap((entry) => {
      const value = entry.data[field.key];
      if (Array.isArray(value)) return value;
      return value ? [value] : [];
    });

    return mergeFieldOptions(field, values);
  });

  await importEntriesIntoVault(vault.id, nextFields, entries);
  return {
    imported: entries.length,
    workspace: await getAfterlightWorkspace(),
  };
}
