<script setup>
import { computed, inject, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import AppTopbar from '../../../shared/components/AppTopbar.vue';
import ContextMenu from '../../../shared/components/ContextMenu.vue';
import EmptyState from '../../../shared/components/EmptyState.vue';
import FilterPreferencesModal from '../../../shared/components/FilterPreferencesModal.vue';
import TagGroups from '../../../shared/components/TagGroups.vue';
import TableCard from '../components/TableCard.vue';
import TableEditorModal from '../components/TableEditorModal.vue';
import { HOME_TAG_FILTERS_KEY } from '../../../shared/constants/tableVault';
import { getColor } from '../../../shared/utils/color';
import {
  getAppMeta,
  getHomeFilterPreferences,
  listVaults,
  createVault,
  deleteVault,
  setAppMeta,
  setHomeFilterPreferences,
  updateVault,
} from '../services/tableVaultDb';
import { exportAllData, exportTableData, importAllData, importTableData } from '../services/fileTransfers';
import {
  buildDataFromActiveFilters,
  getDefaultTableMetaFields,
  sanitizeGroupFilters,
  getTableFilterGroups,
  getTableMetaGroups,
  matchesActiveGroupFilters,
  sanitizeTableMetaSchema,
  splitTableFormData,
} from '../../../shared/utils/tableVault';

const router = useRouter();
const { toggleTheme, isLight, showToast } = inject('appShell');

const vaults = ref([]);
const homeSearch = ref('');
const topSearchOpen = ref(false);
const homeTagFilters = ref({});
const createModalOpen = ref(false);
const settingsOpen = ref(false);
const selectedTable = ref(null);
const menuOpen = ref(false);
const menuPosition = ref({ x: 0, y: 0 });
const tableMetaSchema = ref(getDefaultTableMetaFields());
const fabOpen = ref(false);
const filterPreferencesOpen = ref(false);
const homeFilterPreferences = ref([]);

const menuItems = [
  { label: 'Open', action: 'open' },
  { label: 'Settings', action: 'settings' },
  { label: 'Export', action: 'export' },
  { sep: true },
  { label: 'Delete', action: 'delete', danger: true },
];

const topbarMenuItems = [
  { label: 'Import Table', action: handleImportTable },
  { label: 'Backup All Data', action: handleExportAll },
  { label: 'Restore All Data', action: handleImportAll },
  { label: 'Toggle Theme', action: toggleTheme },
];

function handleTableMenu({ table, x, y }) {
  selectedTable.value = table;
  menuPosition.value = { x, y };
  menuOpen.value = true;
}

function onMenuSelect(item) {
  menuOpen.value = false;
  if (item.action === 'open') {
    openTable(selectedTable.value);
  } else if (item.action === 'settings') {
    settingsOpen.value = true;
  } else if (item.action === 'export') {
    handleExportTable(selectedTable.value);
  } else if (item.action === 'delete') {
    handleDeleteTable(selectedTable.value);
  }
}

const allTagGroups = computed(() => {
  return getTableFilterGroups(tableMetaSchema.value, vaults.value);
});

const createTableInitialData = computed(() => buildDataFromActiveFilters(homeTagFilters.value, tableMetaSchema.value));
const hasHomePresets = computed(() => homeFilterPreferences.value.length > 0);

function getFilterSignature(filters) {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(filters || {})
        .map(([key, values]) => [key, [...values].sort()])
        .sort(([a], [b]) => a.localeCompare(b)),
    ),
  );
}

const activeHomePresetId = computed(() => {
  const current = getFilterSignature(sanitizeGroupFilters(homeTagFilters.value, allTagGroups.value));
  return homeFilterPreferences.value.find((item) => getFilterSignature(sanitizeGroupFilters(item.filters, allTagGroups.value)) === current)?.id || '';
});

const hasCustomHomeFilters = computed(() => {
  return !!Object.keys(homeTagFilters.value).length && !activeHomePresetId.value;
});

function loadSavedHomeTagFilters() {
  try {
    return JSON.parse(localStorage.getItem(HOME_TAG_FILTERS_KEY) || '{}');
  } catch {
    return {};
  }
}

const filteredVaults = computed(() =>
  vaults.value.filter((vault) => {
    if (!matchesActiveGroupFilters(homeTagFilters.value, getTableMetaGroups(tableMetaSchema.value, vault))) {
      return false;
    }
    if (homeSearch.value && !vault.name.toLowerCase().includes(homeSearch.value.toLowerCase())) {
      return false;
    }
    return true;
  }),
);

async function loadHome() {
  const [nextVaults, schemaMeta, nextPreferences] = await Promise.all([
    listVaults(),
    getAppMeta('tableMetaSchema'),
    getHomeFilterPreferences(),
  ]);
  vaults.value = nextVaults;
  tableMetaSchema.value = sanitizeTableMetaSchema(schemaMeta?.value || getDefaultTableMetaFields());
  homeFilterPreferences.value = nextPreferences;
}

function toggleTag({ groupKey, tag, type, nextValue }) {
  if (nextValue !== undefined) {
    homeTagFilters.value = {
      ...homeTagFilters.value,
      [groupKey]: nextValue,
    };
    if (!homeTagFilters.value[groupKey]?.length) {
      const { [groupKey]: _removed, ...rest } = homeTagFilters.value;
      homeTagFilters.value = rest;
    }
    return;
  }
  const current = [...(homeTagFilters.value[groupKey] || [])];
  const index = current.indexOf(tag);

  if (type === 'select') {
    homeTagFilters.value = {
      ...homeTagFilters.value,
      [groupKey]: index >= 0 ? [] : [tag],
    };
  } else if (index >= 0) {
    current.splice(index, 1);
    homeTagFilters.value = { ...homeTagFilters.value, [groupKey]: current };
  } else {
    homeTagFilters.value = { ...homeTagFilters.value, [groupKey]: [...current, tag] };
  }

  if (!homeTagFilters.value[groupKey]?.length) {
    const { [groupKey]: _removed, ...rest } = homeTagFilters.value;
    homeTagFilters.value = rest;
  }
}

function openTable(table) {
  router.push({ name: 'table-records', params: { tableId: table.id } });
}

async function handleExportTable(table) {
  await exportTableData(table);
  showToast('Table exported!', 'success');
}

async function handleDeleteTable(table) {
  if (!window.confirm('Delete this table and all its records?')) return;
  await deleteVault(table.id);
  await loadHome();
  showToast('Deleted', 'error');
}

async function handleCreateTable({ data, formFields }) {
  if (!data.name) {
    showToast('Enter a table name', 'error');
    return;
  }

  const { name, icon, color, meta } = splitTableFormData(data);
  const schema = sanitizeTableMetaSchema(formFields);
  await setAppMeta('tableMetaSchema', schema);
  tableMetaSchema.value = schema;

  const id = await createVault({
    name,
    icon: icon || '📋',
    color,
    meta,
    fields: [
      { key: 'title', label: 'Title', type: 'text', options: [] },
      { key: 'notes', label: 'Notes', type: 'textarea', options: [] },
    ],
    recordFilterPreferences: [],
    createdAt: Date.now(),
  });

  createModalOpen.value = false;
  fabOpen.value = false;
  await loadHome();
  showToast('Table created!', 'success');
  router.push({ name: 'table-records', params: { tableId: id } });
}

async function handleSaveSettings({ data, formFields }) {
  if (!selectedTable.value || !data.name) {
    showToast('Enter a name', 'error');
    return;
  }

  const { name, icon, color, meta } = splitTableFormData(data);
  const schema = sanitizeTableMetaSchema(formFields);
  await setAppMeta('tableMetaSchema', schema);
  tableMetaSchema.value = schema;

  await updateVault(selectedTable.value.id, {
    name,
    icon: icon || '📋',
    color,
    meta,
  });

  settingsOpen.value = false;
  selectedTable.value = null;
  await loadHome();
  showToast('Saved!', 'success');
}

async function handleImportAll() {
  try {
    if (!window.confirm('Replace ALL existing tables and records with the data from this backup? This cannot be undone.')) {
      return;
    }
    await importAllData();
    await loadHome();
    showToast('Import successful!', 'success');
  } catch (error) {
    showToast(error.message || 'Import failed', 'error');
  }
}

async function handleImportTable() {
  try {
    const result = await importTableData();
    if (!result?.imported) return;
    await loadHome();
    showToast(`Imported table "${result.tableName}"`, 'success');
  } catch (error) {
    showToast(error.message || 'Import failed', 'error');
  }
}

async function handleExportAll() {
  try {
    await exportAllData();
    showToast('Backup exported!', 'success');
  } catch (error) {
    showToast(error.message || 'Export failed', 'error');
  }
}

function onWindowClick() {
  menuOpen.value = false;
  fabOpen.value = false;
}

async function handleSaveHomeFilterPreference({ name, filters }) {
  const nextPreferences = [
    ...homeFilterPreferences.value,
    { id: `home_${Date.now()}`, name, filters },
  ];
  homeFilterPreferences.value = nextPreferences;
  await setHomeFilterPreferences(nextPreferences);
  showToast('Preset saved!', 'success');
}

async function handleDeleteHomeFilterPreference(id) {
  const nextPreferences = homeFilterPreferences.value.filter((item) => item.id !== id);
  homeFilterPreferences.value = nextPreferences;
  await setHomeFilterPreferences(nextPreferences);
  showToast('Preset deleted', 'success');
}

function applyHomeFilters(filters) {
  homeTagFilters.value = sanitizeGroupFilters(filters, allTagGroups.value);
  filterPreferencesOpen.value = false;
  fabOpen.value = false;
}

function clearHomeFilters() {
  homeTagFilters.value = {};
}

function applyHomePreset(preference) {
  homeTagFilters.value = sanitizeGroupFilters(preference.filters, allTagGroups.value);
}

onMounted(async () => {
  window.addEventListener('click', onWindowClick);
  homeTagFilters.value = loadSavedHomeTagFilters();
  await loadHome();
});

onUnmounted(() => {
  window.removeEventListener('click', onWindowClick);
});

watch(
  allTagGroups,
  (groups) => {
    homeTagFilters.value = sanitizeGroupFilters(homeTagFilters.value, groups);
  },
  { immediate: true, deep: true },
);

watch(
  homeTagFilters,
  (filters) => {
    localStorage.setItem(HOME_TAG_FILTERS_KEY, JSON.stringify(filters));
  },
  { deep: true },
);
</script>

<template>
  <div class="screen active">
    <AppTopbar
      show-logo
      :search-open="topSearchOpen"
      :search-value="homeSearch"
      :menu-items="topbarMenuItems"
      search-placeholder="Search tables…"
      @toggle-search="topSearchOpen = !topSearchOpen"
      @update:search-value="homeSearch = $event"
    >
      <template #actions>
        <button class="btn btn-ghost btn-icon" title="Search tables" @click="topSearchOpen = !topSearchOpen">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="5.5" cy="5.5" r="4" stroke="currentColor" stroke-width="1.3"/><path d="M9 9l2.5 2.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        </button>
      </template>
    </AppTopbar>

    <div class="filter-bar">
      <div v-if="hasHomePresets" class="preset-chip-row">
        <button
          class="tag-chip"
          :class="{ active: !Object.keys(homeTagFilters).length }"
          :style="!Object.keys(homeTagFilters).length ? { background: getColor('Lime', isLight).dim, color: getColor('Lime', isLight).val, borderColor: 'transparent' } : undefined"
          @click="clearHomeFilters"
        >
          All
        </button>
        <button
          v-for="preference in homeFilterPreferences"
          :key="preference.id"
          class="tag-chip"
          :class="{ active: activeHomePresetId === preference.id }"
          :style="activeHomePresetId === preference.id ? { background: getColor('Lime', isLight).dim, color: getColor('Lime', isLight).val, borderColor: 'transparent' } : undefined"
          @click="applyHomePreset(preference)"
        >
          {{ preference.name }}
        </button>
        <button
          v-if="hasCustomHomeFilters"
          class="tag-chip active"
          :style="{ background: getColor('Lime', isLight).dim, color: getColor('Lime', isLight).val, borderColor: 'transparent' }"
          @click="filterPreferencesOpen = true"
        >
          Custom
        </button>
      </div>
      <TagGroups
        v-else
        :groups="allTagGroups"
        :active-filters="homeTagFilters"
        :color="getColor('Lime', isLight)"
        @toggle="toggleTag"
      />
    </div>

    <div class="mosaic">
      <EmptyState
        v-if="!filteredVaults.length"
        icon="🗂️"
        :title="vaults.length ? 'No results' : 'No tables yet'"
        :message="vaults.length ? 'Try different filters.' : 'Tap + to create your first table.'"
      />
      <template v-else>
        <TableCard
          v-for="table in filteredVaults"
          :key="table.id"
          :table="table"
          :color="getColor(table.color, isLight)"
          :meta-schema="tableMetaSchema"
          @open="openTable"
          @menu="handleTableMenu"
        />
      </template>
    </div>

    <div class="fab-stack" :class="{ open: fabOpen }">
      <button
        class="fab-secondary"
        title="Filter presets"
        aria-label="Open filter preferences"
        @click.stop="filterPreferencesOpen = true; fabOpen = false"
        :style="{ '--i': 0, '--total': 2 }"
      >
        F
      </button>
      <button
        class="fab-secondary"
        aria-label="Create table"
        @click.stop="createModalOpen = true; fabOpen = false"
        :style="{ '--i': 1, '--total': 2 }"
      >
        +
      </button>
      <button class="fab" :class="{ open: fabOpen }" @click.stop="fabOpen = !fabOpen">+</button>
    </div>

    <ContextMenu
      :open="menuOpen"
      :position="menuPosition"
      :items="menuItems"
      @close="menuOpen = false"
      @select="onMenuSelect"
    />

    <TableEditorModal
      :open="createModalOpen"
      mode="create"
      :is-light="isLight"
      :schema="tableMetaSchema"
      :initial-data="createTableInitialData"
      @close="createModalOpen = false"
      @save="handleCreateTable"
    />

    <FilterPreferencesModal
      :open="filterPreferencesOpen"
      title="Home Filter Presets"
      :groups="allTagGroups"
      :active-filters="homeTagFilters"
      :preferences="homeFilterPreferences"
      :color="getColor('Lime', isLight)"
      @close="filterPreferencesOpen = false"
      @apply="applyHomeFilters"
      @save-preference="handleSaveHomeFilterPreference"
      @delete-preference="handleDeleteHomeFilterPreference"
    />

    <TableEditorModal
      :open="settingsOpen"
      :table="selectedTable"
      mode="edit"
      :is-light="isLight"
      :schema="tableMetaSchema"
      @close="
        settingsOpen = false;
        selectedTable = null
      "
      @save="handleSaveSettings"
      @export="handleExportTable(selectedTable)"
      @delete="handleDeleteTable(selectedTable).then(() => { settingsOpen = false; selectedTable = null; })"
    />
  </div>
</template>
