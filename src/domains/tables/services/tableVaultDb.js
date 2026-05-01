import Dexie from 'dexie';
import { HOME_FILTER_PREFERENCES_META_KEY } from '../../../shared/constants/tableVault';
import {
  getDefaultTableMetaFields,
  normalizeVault,
  sanitizeFilterPreferences,
  sanitizeTableMetaSchema,
} from '../../../shared/utils/tableVault';

const db = new Dexie('TableVaultDB');
db.version(1).stores({ vaults: '++id,name', entries: '++id,tableId,createdAt' });
db.version(2).stores({ vaults: '++id,name,sourceTrackerId', entries: '++id,tableId,createdAt,sourceRowUid,sourceTrackerId' });
db.version(3).stores({ vaults: '++id,name,sourceTrackerId', entries: '++id,tableId,createdAt,sourceRowUid,sourceTrackerId', appmeta: '&key' });
db.version(4)
  .stores({ vaults: '++id,name,sourceTrackerId', entries: '++id,tableId,createdAt,sourceRowUid,sourceTrackerId', appmeta: '&key' })
  .upgrade(async (tx) => {
    const appMetaTable = tx.table('appmeta');
    const vaultTable = tx.table('vaults');
    const schemaRecord = await appMetaTable.get('tableMetaSchema');
    const schema = sanitizeTableMetaSchema(schemaRecord?.value || getDefaultTableMetaFields());
    const schemaByKey = new Map(schema.map((field) => [field.key, field]));

    await appMetaTable.put({ key: 'tableMetaSchema', value: schema });

    await vaultTable.toCollection().modify((vault) => {
      const nextMeta = typeof vault.meta === 'object' && vault.meta !== null ? { ...vault.meta } : {};

      if (nextMeta.tags === undefined && Array.isArray(vault.tags) && vault.tags.length) {
        nextMeta.tags = [...vault.tags];
      }

      schema.forEach((field) => {
        if (field.key === 'name' || field.key === 'icon' || field.key === 'color') return;
        const value = nextMeta[field.key];

        if (field.type === 'multiselect') {
          if (Array.isArray(value)) nextMeta[field.key] = value.filter(Boolean).map(String);
          else if (value === undefined || value === null || value === '') nextMeta[field.key] = [];
          else nextMeta[field.key] = [String(value)];
          return;
        }

        if (field.type === 'select') {
          if (Array.isArray(value)) nextMeta[field.key] = value.find(Boolean) || '';
          else if (value === undefined || value === null) nextMeta[field.key] = '';
          else nextMeta[field.key] = String(value);
          return;
        }

        if (field.type === 'boolean') {
          nextMeta[field.key] = value === true || value === 'true';
        }
      });

      if (!schemaByKey.has('tags')) {
        delete nextMeta.tags;
      }

      vault.meta = nextMeta;
    });
  });

function toPlainData(value) {
  return JSON.parse(JSON.stringify(value));
}

export async function listVaults() {
  const vaults = (await db.vaults.toArray()).map(normalizeVault);
  const counts = await Promise.all(
    vaults.map(async (vault) => ({
      id: vault.id,
      count: await db.entries.where('tableId').equals(vault.id).count(),
    })),
  );

  return vaults.map((vault) => ({
    ...vault,
    _count: counts.find((count) => count.id === vault.id)?.count || 0,
  }));
}

export async function getAppMeta(key) {
  return db.table('appmeta').get(key);
}

export async function setAppMeta(key, value) {
  await db.table('appmeta').put({ key, value: toPlainData(value) });
}

export async function getHomeFilterPreferences() {
  const record = await getAppMeta(HOME_FILTER_PREFERENCES_META_KEY);
  return sanitizeFilterPreferences(record?.value);
}

export async function setHomeFilterPreferences(preferences) {
  await setAppMeta(HOME_FILTER_PREFERENCES_META_KEY, sanitizeFilterPreferences(preferences));
}

export async function getVault(vaultId) {
  const vault = await db.vaults.get(Number(vaultId));
  return vault ? normalizeVault(vault) : null;
}

export async function createVault(payload) {
  return db.vaults.add(toPlainData(payload));
}

export async function updateVault(vaultId, payload) {
  await db.vaults.update(Number(vaultId), toPlainData(payload));
}

export async function getRecordFilterPreferences(vaultId) {
  const vault = await getVault(vaultId);
  return vault?.recordFilterPreferences || [];
}

export async function setRecordFilterPreferences(vaultId, preferences) {
  await updateVault(vaultId, { recordFilterPreferences: sanitizeFilterPreferences(preferences) });
}

export async function deleteVault(vaultId) {
  await db.entries.where('tableId').equals(Number(vaultId)).delete();
  await db.vaults.delete(Number(vaultId));
}

export async function listEntries(vaultId) {
  const entries = await db.entries.where('tableId').equals(Number(vaultId)).toArray();
  return entries.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getEntry(entryId) {
  return db.entries.get(Number(entryId));
}

export async function createEntry(vaultId, data) {
  return db.entries.add({
    tableId: Number(vaultId),
    data: toPlainData(data),
    createdAt: Date.now(),
  });
}

export async function createEntries(vaultId, items) {
  const rows = (items || []).map((item) => ({
    tableId: Number(vaultId),
    data: toPlainData(item.data || {}),
    createdAt: item.createdAt || Date.now(),
  }));
  if (!rows.length) return 0;
  await db.entries.bulkAdd(rows);
  return rows.length;
}

export async function importEntriesIntoVault(vaultId, fields, items) {
  const rows = (items || []).map((item) => ({
    tableId: Number(vaultId),
    data: toPlainData(item.data || {}),
    createdAt: item.createdAt || Date.now(),
  }));

  await db.transaction('rw', db.vaults, db.entries, async () => {
    await db.vaults.update(Number(vaultId), { fields: toPlainData(fields || []) });
    if (rows.length) await db.entries.bulkAdd(rows);
  });

  return rows.length;
}

export async function updateEntry(entryId, data) {
  await db.entries.update(Number(entryId), { data: toPlainData(data) });
}

export async function deleteEntry(entryId) {
  await db.entries.delete(Number(entryId));
}

export async function exportAll() {
  return {
    type: 'imago-tablevault-backup',
    version: 1,
    timestamp: Date.now(),
    vaults: await db.vaults.toArray(),
    entries: await db.entries.toArray(),
    appmeta: await db.table('appmeta').toArray(),
  };
}

export async function replaceAll(backup) {
  await db.transaction('rw', db.vaults, db.entries, db.table('appmeta'), async () => {
    await db.vaults.clear();
    await db.vaults.clear();
    await db.entries.clear();
    await db.table('appmeta').clear();
    if (backup.vaults) await db.vaults.bulkAdd(backup.vaults);
    if (backup.entries) await db.entries.bulkAdd(backup.entries);
    if (backup.appmeta) await db.table('appmeta').bulkAdd(backup.appmeta);
  });
}

export async function exportTable(vaultId) {
  const vault = await db.vaults.get(Number(vaultId));
  if (!vault) return null;

  return {
    type: 'imago-tablevault-table-backup',
    version: 1,
    timestamp: Date.now(),
    vault,
    entries: await db.entries.where('tableId').equals(Number(vaultId)).toArray(),
  };
}

export async function importTableBackup(backup) {
  const { id, ...vaultRecord } = backup.vault;
  const newId = await db.vaults.add(vaultRecord);
  const entries = (backup.entries || []).map((entry) => {
    const { id: oldId, ...entryRecord } = entry;
    return { ...entryRecord, tableId: newId };
  });

  if (entries.length) {
    await db.entries.bulkAdd(entries);
  }

  return newId;
}

export async function replaceWithSnapshotPayload(payload) {
  await db.transaction('rw', db.vaults, db.entries, db.table('appmeta'), async () => {
    await db.entries.clear();
    await db.vaults.clear();
    await db.table('appmeta').clear();

    for (const vault of payload.vaults) {
      const { _sourceTrackerId, ...vaultRecord } = vault;
      const newId = await db.vaults.add(vaultRecord);
      const entries = (payload.entriesByTracker.get(vault._sourceTrackerId) || []).map((entry) => ({
        ...entry,
        tableId: newId,
      }));

      if (entries.length) {
        await db.entries.bulkAdd(entries);
      }
    }
  });
}
