<script setup>
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import AppTopbar from '../../../shared/components/AppTopbar.vue';
import ContextMenu from '../../../shared/components/ContextMenu.vue';
import EmptyState from '../../../shared/components/EmptyState.vue';
import TagGroups from '../../../shared/components/TagGroups.vue';
import RecordCard from '../components/RecordCard.vue';
import RecordFormModal from '../components/RecordFormModal.vue';
import ImportRecordsModal from '../components/ImportRecordsModal.vue';
import TableEditorModal from '../../tables/components/TableEditorModal.vue';
import { features } from '../../../shared/constants/features';
import { getColor } from '../../../shared/utils/color';
import {
  coerceValueForField,
  createImportedField,
  getDefaultTableMetaFields,
  getGroupValue,
  getRecordFilterGroups,
  getRecordMetaGroups,
  mergeFieldOptions,
  matchesActiveGroupFilters,
  normalizeField,
  sanitizeTableMetaSchema,
  splitTableFormData,
  IMPORT_TARGET_CREATE,
  IMPORT_TARGET_SKIP,
} from '../../../shared/utils/tableVault';
import {
  createEntry,
  deleteEntry,
  getAppMeta,
  getEntry,
  getVault,
  importEntriesIntoVault,
  listEntries,
  setAppMeta,
  updateEntry,
  updateVault,
} from '../../tables/services/tableVaultDb';
import { pickTableBackupData } from '../../tables/services/fileTransfers';

const props = defineProps({
  tableId: {
    type: [String, Number],
    required: true,
  },
});

const router = useRouter();
const { toggleTheme, isLight, showToast } = inject('appShell');

const vault = ref(null);
const entries = ref([]);
const recordSearch = ref('');
const topSearchOpen = ref(false);
const recordTagFilters = ref({});
const groupField = ref('');
const collapsedGroups = ref({});
const recordModal = ref({ open: false, mode: 'add', entryId: null, data: {} });
const importModal = ref({ open: false, backup: null });
const settingsOpen = ref(false);
const contextMenu = ref({ open: false, position: { x: 0, y: 0 }, items: [] });
const showGroupingSelect = features.recordsGrouping;
const tableMetaSchema = ref(getDefaultTableMetaFields());

const vaultColor = computed(() => getColor(vault.value?.color || 'Lime', isLight.value));
const fields = computed(() => vault.value?.fields || []);

const tagGroups = computed(() => getRecordFilterGroups(fields.value, entries.value));

const filteredEntries = computed(() =>
  entries.value.filter((record) => {
    if (!matchesActiveGroupFilters(recordTagFilters.value, getRecordMetaGroups(fields.value, record))) {
      return false;
    }
    if (recordSearch.value) {
      const searchable = Object.values(record.data || {}).join(' ').toLowerCase();
      if (!searchable.includes(recordSearch.value.toLowerCase())) return false;
    }
    return true;
  }),
);

const groupedEntries = computed(() => {
  if (!showGroupingSelect || !groupField.value) return [];
  const groups = new Map();

  filteredEntries.value.forEach((record) => {
    const key = getGroupValue(fields.value, record, groupField.value) || 'Ungrouped';
    const list = groups.get(key) || [];
    list.push(record);
    groups.set(key, list);
  });

  return [...groups.entries()]
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
    .map(([name, rows]) => ({ name, rows }));
});

const groupingOptions = computed(() => [
  { key: '', label: 'No grouping' },
  ...fields.value.filter((field) => field.type === 'select').map((field) => ({ key: field.key, label: `Group: ${field.label}` })),
]);

async function loadRecords() {
  const [nextVault, schemaMeta] = await Promise.all([getVault(props.tableId), getAppMeta('tableMetaSchema')]);
  vault.value = nextVault;
  tableMetaSchema.value = sanitizeTableMetaSchema(schemaMeta?.value || getDefaultTableMetaFields());
  if (!vault.value) {
    router.replace({ name: 'home' });
    return;
  }
  entries.value = await listEntries(props.tableId);
}

function goHome() {
  router.push({ name: 'home' });
}

function toggleTag({ groupKey, tag, type }) {
  const current = [...(recordTagFilters.value[groupKey] || [])];
  const index = current.indexOf(tag);

  if (type === 'select') {
    recordTagFilters.value = {
      ...recordTagFilters.value,
      [groupKey]: index >= 0 ? [] : [tag],
    };
  } else if (index >= 0) {
    current.splice(index, 1);
    recordTagFilters.value = { ...recordTagFilters.value, [groupKey]: current };
  } else {
    recordTagFilters.value = { ...recordTagFilters.value, [groupKey]: [...current, tag] };
  }

  if (!recordTagFilters.value[groupKey]?.length) {
    const { [groupKey]: _removed, ...rest } = recordTagFilters.value;
    recordTagFilters.value = rest;
  }
}

function openRecordModal(mode, entry = null) {
  recordModal.value = {
    open: true,
    mode,
    entryId: entry?.id || null,
    data: entry?.data || {},
  };
}

async function saveRecord({ data, fields: nextFields }) {
  if (!nextFields[0]?.label) {
    showToast('Title field needs a name', 'error');
    return;
  }

  await updateVault(props.tableId, { fields: nextFields });

  if (recordModal.value.mode === 'edit' && recordModal.value.entryId) {
    await updateEntry(recordModal.value.entryId, data);
    showToast('Updated!', 'success');
  } else {
    await createEntry(props.tableId, data);
    showToast('Record added!', 'success');
  }

  recordModal.value.open = false;
  await loadRecords();
}

async function saveSettings({ data, formFields }) {
  if (!data.name) {
    showToast('Enter a name', 'error');
    return;
  }

  const { name, icon, color, meta } = splitTableFormData(data);
  const schema = sanitizeTableMetaSchema(formFields);
  await setAppMeta('tableMetaSchema', schema);
  tableMetaSchema.value = schema;

  await updateVault(props.tableId, {
    name,
    icon: icon || '📋',
    color,
    meta,
  });
  settingsOpen.value = false;
  await loadRecords();
  showToast('Saved!', 'success');
}

async function openImportRecords() {
  try {
    const result = await pickTableBackupData();
    if (!result?.imported || !result.backup) return;
    importModal.value = { open: true, backup: result.backup };
  } catch (error) {
    showToast(error.message || 'Import failed', 'error');
  }
}

function closeImportModal() {
  importModal.value = { open: false, backup: null };
}

async function handleImportRecords({ backup, mappings }) {
  if (!vault.value) return;

  const sourceFields = (backup?.vault?.fields || []).map((field, index) => normalizeField(field, index));
  const mappingBySource = new Map(mappings.map((item) => [item.sourceKey, item.targetKey]));
  let nextFields = [...fields.value];
  const resolvedTargetBySource = new Map();

  sourceFields.forEach((sourceField, index) => {
    const targetKey = mappingBySource.get(sourceField.key) || IMPORT_TARGET_SKIP;
    if (targetKey === IMPORT_TARGET_SKIP) return;
    if (targetKey === IMPORT_TARGET_CREATE) {
      const createdField = createImportedField(sourceField, nextFields);
      nextFields = [...nextFields, createdField];
      resolvedTargetBySource.set(sourceField.key, createdField.key);
      return;
    }
    resolvedTargetBySource.set(sourceField.key, targetKey);
  });

  const titleKey = nextFields[0]?.key;
  if (!titleKey || ![...resolvedTargetBySource.values()].includes(titleKey)) {
    showToast('Map at least one source field to the title field', 'error');
    return;
  }

  const importedEntries = (backup?.entries || []).map((entry) => {
    const data = {};

    sourceFields.forEach((sourceField) => {
      const targetKey = resolvedTargetBySource.get(sourceField.key);
      if (!targetKey) return;
      const targetField = nextFields.find((field) => field.key === targetKey);
      if (!targetField) return;

      const value = coerceValueForField(entry?.data?.[sourceField.key], targetField);
      if (targetField.type === 'multiselect') {
        if (value?.length) data[targetKey] = value;
      } else if (value !== undefined && value !== null && value !== '') {
        data[targetKey] = value;
      } else if (targetField.type === 'boolean' && value === false) {
        data[targetKey] = false;
      }
    });

    return {
      data,
      createdAt: entry?.createdAt || Date.now(),
    };
  });

  const optionValuesByTarget = new Map();
  importedEntries.forEach((entry) => {
    Object.entries(entry.data || {}).forEach(([key, value]) => {
      const field = nextFields.find((item) => item.key === key);
      if (!field || !['select', 'multiselect'].includes(field.type)) return;
      const list = optionValuesByTarget.get(key) || [];
      if (Array.isArray(value)) list.push(...value);
      else if (value) list.push(value);
      optionValuesByTarget.set(key, list);
    });
  });

  nextFields = nextFields.map((field) => mergeFieldOptions(field, optionValuesByTarget.get(field.key) || []));

  const created = await importEntriesIntoVault(props.tableId, nextFields, importedEntries);
  closeImportModal();
  await loadRecords();
  showToast(`Imported ${created} record${created === 1 ? '' : 's'}`, 'success');
}

function toggleGroup(name) {
  collapsedGroups.value = {
    ...collapsedGroups.value,
    [name]: !collapsedGroups.value[name],
  };
}

function openEntryContext(event, record) {
  contextMenu.value = {
    open: true,
    position: { x: event.clientX, y: event.clientY },
    items: [
      {
        label: '✏️  Edit',
        action: async () => {
          const fresh = await getEntry(record.id);
          if (fresh) openRecordModal('edit', fresh);
        },
      },
      {
        label: '📋  Copy',
        action: async () => {
          const yamlItems = fields.value
            .map((field) => {
              const val = record.data?.[field.key];
              if (val === undefined || val === null || val === '') return null;

              let displayVal;
              if (field.type === 'boolean') {
                displayVal = val ? 'true' : 'false';
              } else if (Array.isArray(val)) {
                if (val.length === 0) return null;
                displayVal = '\n' + val.map((v) => `  - ${v}`).join('\n');
              } else if (typeof val === 'string' && val.includes('\n')) {
                displayVal = '|\n' + val.split('\n').map((line) => `  ${line}`).join('\n');
              } else {
                displayVal = val;
              }

              return `${field.label}: ${displayVal}`;
            })
            .filter(Boolean);

          const text = yamlItems.join('\n');

          try {
            await navigator.clipboard.writeText(text);
            showToast('Copied as YAML!', 'success');
          } catch (err) {
            showToast('Failed to copy', 'error');
          }
        },
      },
      { sep: true },
      {
        label: '🗑  Delete',
        danger: true,
        action: async () => {
          if (!window.confirm('Delete this record?')) return;
          await deleteEntry(record.id);
          entries.value = entries.value.filter((entry) => entry.id !== record.id);
          showToast('Deleted', 'error');
        },
      },
    ],
  };
}

function closeContextMenu() {
  contextMenu.value.open = false;
}

async function handleContextSelect(item) {
  closeContextMenu();
  await item.action?.();
}

function buildPreview(record) {
  return fields.value
    .slice(1, 4)
    .flatMap((field) => {
      let value = record.data?.[field.key];
      if (value === undefined || value === null || value === '') return [];
      if (field.type === 'select') return [];
      if (field.type === 'boolean') value = value ? '✓ Yes' : '✗ No';
      if (field.type === 'url') value = `🔗 ${value}`;
      if (field.type === 'progress') value = Number.parseInt(value, 10) || 0;
      return [{ label: field.label, value, type: field.type }];
    });
}

function formatRecordDate(record) {
  return new Date(record.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function onWindowClick() {
  closeContextMenu();
}

watch(
  () => props.tableId,
  async () => {
    recordSearch.value = '';
    recordTagFilters.value = {};
    groupField.value = '';
    collapsedGroups.value = {};
    await loadRecords();
  },
  { immediate: true },
);

onMounted(() => {
  if (!showGroupingSelect) {
    groupField.value = '';
  }
  window.addEventListener('click', onWindowClick);
});

onUnmounted(() => {
  window.removeEventListener('click', onWindowClick);
});
</script>

<template>
  <div class="screen active">
    <AppTopbar
      show-back
      :title="`${vault?.icon || ''} ${vault?.name || '—'}`"
      :search-open="topSearchOpen"
      :search-value="recordSearch"
      search-placeholder="Search records…"
      @back="goHome"
      @toggle-search="topSearchOpen = !topSearchOpen"
      @update:search-value="recordSearch = $event"
    >
      <template #actions>
        <button class="btn btn-ghost btn-icon" title="Search records" @click="topSearchOpen = !topSearchOpen">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="5.5" cy="5.5" r="4" stroke="currentColor" stroke-width="1.3"/><path d="M9 9l2.5 2.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        </button>
        <button class="btn btn-ghost btn-icon" title="Table settings" @click="settingsOpen = true">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="2" stroke="currentColor" stroke-width="1.2"/><path d="M6.5 1v1.2M6.5 10.8V12M12 6.5h-1.2M2.2 6.5H1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
        </button>
        <button class="btn btn-ghost btn-icon" title="Import records into this table" @click="openImportRecords">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5v6.2M4 5.4l2.5 2.5 2.5-2.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 10.5h9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M1.5 11.5h10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" opacity=".45"/></svg>
        </button>
        <button class="btn btn-ghost btn-icon" title="Toggle theme" @click="toggleTheme">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="2.4" stroke="currentColor" stroke-width="1.2"/><path d="M6.5 1v1.4M6.5 10.6V12M12 6.5h-1.4M2.4 6.5H1M10.4 2.6l-1 1M3.6 9.4l-1 1M10.4 10.4l-1-1M3.6 3.6l-1-1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
        </button>
      </template>
    </AppTopbar>

    <div class="filter-bar">
      <div v-if="showGroupingSelect" class="filter-controls">
        <select v-model="groupField" class="fselect grouping-select">
          <option v-for="option in groupingOptions" :key="option.key" :value="option.key">
            {{ option.label }}
          </option>
        </select>
      </div>
      <TagGroups :groups="tagGroups" :active-filters="recordTagFilters" :color="vaultColor" @toggle="toggleTag" />
    </div>

    <div class="mosaic">
      <EmptyState
        v-if="!filteredEntries.length"
        :icon="vault?.icon || '🗂️'"
        :title="entries.length ? 'No results' : 'No records yet'"
        :message="entries.length ? 'Try different filters.' : 'Tap + to add your first record.'"
      />

      <template v-else-if="groupField">
        <div class="group-list">
          <div v-for="group in groupedEntries" :key="group.name" class="group-block">
            <div class="group-head" @click="toggleGroup(group.name)">
              <span class="group-toggle">{{ collapsedGroups[group.name] ? '▸' : '▾' }}</span>
              <span class="group-title">{{ group.name }}</span>
              <span class="group-count">{{ group.rows.length }}</span>
            </div>
            <div v-if="!collapsedGroups[group.name]" class="group-cards">
              <RecordCard
                v-for="record in group.rows"
                :key="record.id"
                :record="record"
                :title="String(record.data?.[fields[0]?.key] || '—')"
                :preview-fields="buildPreview(record)"
                :meta-groups="getRecordMetaGroups(fields, record)"
                :color="vaultColor"
                :date-label="formatRecordDate(record)"
                @open="openRecordModal('edit', record)"
                @menu="openEntryContext"
              />
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <RecordCard
          v-for="record in filteredEntries"
          :key="record.id"
          :record="record"
          :title="String(record.data?.[fields[0]?.key] || '—')"
          :preview-fields="buildPreview(record)"
          :meta-groups="getRecordMetaGroups(fields, record)"
          :color="vaultColor"
          :date-label="formatRecordDate(record)"
          @open="openRecordModal('edit', record)"
          @menu="openEntryContext"
        />
      </template>
    </div>

    <button class="fab" @click="openRecordModal('add')">+</button>

    <RecordFormModal
      :open="recordModal.open"
      :mode="recordModal.mode"
      :fields="fields"
      :color="vaultColor"
      :initial-data="recordModal.data"
      @close="recordModal.open = false"
      @save="saveRecord"
    />

    <ImportRecordsModal
      :open="importModal.open"
      :backup="importModal.backup"
      :target-fields="fields"
      @close="closeImportModal"
      @import="handleImportRecords"
    />

    <TableEditorModal
      :open="settingsOpen"
      :table="vault"
      mode="edit"
      :is-light="isLight"
      :schema="tableMetaSchema"
      @close="settingsOpen = false"
      @save="saveSettings"
    />

    <ContextMenu
      :open="contextMenu.open"
      :position="contextMenu.position"
      :items="contextMenu.items"
      @select="handleContextSelect"
      @close="closeContextMenu"
    />
  </div>
</template>
