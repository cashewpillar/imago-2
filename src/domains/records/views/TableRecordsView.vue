<script setup>
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppTopbar from '../../../shared/components/AppTopbar.vue';
import ContextMenu from '../../../shared/components/ContextMenu.vue';
import EmptyState from '../../../shared/components/EmptyState.vue';
import TagGroups from '../../../shared/components/TagGroups.vue';
import RecordCard from '../components/RecordCard.vue';
import RecordFormModal from '../components/RecordFormModal.vue';
import TableSettingsModal from '../../tables/components/TableSettingsModal.vue';
import { getColor } from '../../../shared/utils/color';
import { getGroupValue, getRecordMetaGroups } from '../../../shared/utils/tableVault';
import {
  createEntry,
  deleteEntry,
  deleteVault,
  getEntry,
  getVault,
  listEntries,
  updateEntry,
  updateVault,
} from '../../tables/services/tableVaultDb';
import { exportTableData } from '../../tables/services/fileTransfers';

const props = defineProps({
  tableId: {
    type: [String, Number],
    required: true,
  },
});

const route = useRoute();
const router = useRouter();
const { toggleTheme, isLight, showToast } = inject('appShell');

const vault = ref(null);
const entries = ref([]);
const recordSearch = ref('');
const topSearchOpen = ref(false);
const recordTagFilters = ref([]);
const groupField = ref('');
const collapsedGroups = ref({});
const recordModal = ref({ open: false, mode: 'add', entryId: null, data: {} });
const settingsOpen = ref(false);
const contextMenu = ref({ open: false, position: { x: 0, y: 0 }, items: [] });

const vaultColor = computed(() => getColor(vault.value?.color || 'Lime', isLight.value));
const fields = computed(() => vault.value?.fields || []);

const tagGroups = computed(() => {
  const groups = new Map();

  entries.value.forEach((record) => {
    getRecordMetaGroups(fields.value, record).forEach((group) => {
      const next = groups.get(group.key) || { label: group.label, tags: new Set() };
      group.values.forEach((value) => next.tags.add(value));
      groups.set(group.key, next);
    });
  });

  return [...groups.values()].map((group) => ({ label: group.label, tags: [...group.tags] }));
});

const filteredEntries = computed(() =>
  entries.value.filter((record) => {
    const recordTags = getRecordMetaGroups(fields.value, record).flatMap((group) => group.values);
    if (recordTagFilters.value.length && !recordTagFilters.value.every((tag) => recordTags.includes(tag))) {
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
  if (!groupField.value) return [];
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
  vault.value = await getVault(props.tableId);
  if (!vault.value) {
    router.replace({ name: 'home' });
    return;
  }
  entries.value = await listEntries(props.tableId);
}

function goHome() {
  router.push({ name: 'home' });
}

function toggleTag(tag) {
  const index = recordTagFilters.value.indexOf(tag);
  if (index >= 0) recordTagFilters.value.splice(index, 1);
  else recordTagFilters.value.push(tag);
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

async function saveSettings(payload) {
  if (!payload.name) {
    showToast('Enter a name', 'error');
    return;
  }

  await updateVault(props.tableId, {
    name: payload.name,
    icon: payload.icon || '📋',
    color: payload.color,
    tags: payload.tags,
  });
  settingsOpen.value = false;
  await loadRecords();
  showToast('Saved!', 'success');
}
async function handleDeleteTable() {
  if (!window.confirm('Delete this table and all its records?')) return;
  await deleteVault(props.tableId);
  showToast('Table deleted', 'error');
  router.push({ name: 'home' });
}

async function handleExportTable() {
  try {
    await exportTableData(vault.value);
    showToast('Table exported!', 'success');
  } catch (error) {
    showToast(error.message || 'Export failed', 'error');
  }
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
  () => route.query.settings,
  (value) => {
    settingsOpen.value = value === '1';
  },
  { immediate: true },
);

watch(
  () => props.tableId,
  async () => {
    recordSearch.value = '';
    recordTagFilters.value = [];
    groupField.value = '';
    collapsedGroups.value = {};
    await loadRecords();
  },
  { immediate: true },
);

onMounted(() => {
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
        <button class="btn btn-ghost btn-icon" title="Toggle theme" @click="toggleTheme">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="2.4" stroke="currentColor" stroke-width="1.2"/><path d="M6.5 1v1.4M6.5 10.6V12M12 6.5h-1.4M2.4 6.5H1M10.4 2.6l-1 1M3.6 9.4l-1 1M10.4 10.4l-1-1M3.6 3.6l-1-1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
        </button>
      </template>
    </AppTopbar>

    <div class="filter-bar">
      <div class="filter-controls">
        <select v-model="groupField" class="fselect grouping-select">
          <option v-for="option in groupingOptions" :key="option.key" :value="option.key">
            {{ option.label }}
          </option>
        </select>
      </div>
      <TagGroups :groups="tagGroups" :active-tags="recordTagFilters" :color="vaultColor" @toggle="toggleTag" />
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

    <TableSettingsModal
      :open="settingsOpen"
      :table="vault"
      :is-light="isLight"
      @close="settingsOpen = false"
      @save="saveSettings"
      @export="handleExportTable"
      @delete="handleDeleteTable"
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
