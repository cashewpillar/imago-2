<script setup>
import { computed, inject, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppTopbar from '../../../shared/components/AppTopbar.vue';
import ContextMenu from '../../../shared/components/ContextMenu.vue';
import EmptyState from '../../../shared/components/EmptyState.vue';
import TagGroups from '../../../shared/components/TagGroups.vue';
import TableCard from '../components/TableCard.vue';
import TableFormModal from '../components/TableFormModal.vue';
import { getColor } from '../../../shared/utils/color';
import { listVaults, createVault, deleteVault } from '../services/tableVaultDb';
import { exportAllData, importAllData, importTableData } from '../services/fileTransfers';

const router = useRouter();
const { toggleTheme, isLight, showToast } = inject('appShell');

const vaults = ref([]);
const homeSearch = ref('');
const topSearchOpen = ref(false);
const homeTagFilters = ref([]);
const createModalOpen = ref(false);
const contextMenu = ref({ open: false, position: { x: 0, y: 0 }, items: [] });

const allTagGroups = computed(() => {
  const tags = new Set();
  vaults.value.forEach((vault) => (vault.tags || []).forEach((tag) => tags.add(tag)));
  return tags.size ? [{ label: 'Tags', tags: [...tags] }] : [];
});

const filteredVaults = computed(() =>
  vaults.value.filter((vault) => {
    if (homeTagFilters.value.length && !homeTagFilters.value.every((tag) => (vault.tags || []).includes(tag))) {
      return false;
    }
    if (homeSearch.value && !vault.name.toLowerCase().includes(homeSearch.value.toLowerCase())) {
      return false;
    }
    return true;
  }),
);

async function loadHome() {
  vaults.value = await listVaults();
}

function toggleTag(tag) {
  const index = homeTagFilters.value.indexOf(tag);
  if (index >= 0) homeTagFilters.value.splice(index, 1);
  else homeTagFilters.value.push(tag);
}

function openTable(table) {
  router.push({ name: 'table-records', params: { tableId: table.id } });
}

function openContextMenu(event, table) {
  contextMenu.value = {
    open: true,
    position: { x: event.clientX, y: event.clientY },
    items: [
      {
        label: '⚙️  Settings',
        action: () => router.push({ name: 'table-records', params: { tableId: table.id }, query: { settings: '1' } }),
      },
      { sep: true },
      {
        label: '🗑  Delete',
        danger: true,
        action: async () => {
          if (!window.confirm('Delete this table and all its records?')) return;
          await deleteVault(table.id);
          await loadHome();
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

async function handleCreateTable(payload) {
  if (!payload.name) {
    showToast('Enter a table name', 'error');
    return;
  }

  const id = await createVault({
    name: payload.name,
    icon: payload.icon || '📋',
    color: payload.color,
    fields: [
      { key: 'title', label: 'Title', type: 'text', options: [] },
      { key: 'notes', label: 'Notes', type: 'textarea', options: [] },
    ],
    tags: [],
    createdAt: Date.now(),
  });

  createModalOpen.value = false;
  await loadHome();
  showToast('Table created!', 'success');
  router.push({ name: 'table-records', params: { tableId: id } });
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
  closeContextMenu();
}

onMounted(async () => {
  await loadHome();
  window.addEventListener('click', onWindowClick);
});

onUnmounted(() => {
  window.removeEventListener('click', onWindowClick);
});
</script>

<template>
  <div class="screen active">
    <AppTopbar
      show-logo
      :search-open="topSearchOpen"
      :search-value="homeSearch"
      search-placeholder="Search tables…"
      @toggle-search="topSearchOpen = !topSearchOpen"
      @update:search-value="homeSearch = $event"
    >
      <template #actions>
        <button class="btn btn-ghost btn-icon" title="Search tables" @click="topSearchOpen = !topSearchOpen">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="5.5" cy="5.5" r="4" stroke="currentColor" stroke-width="1.3"/><path d="M9 9l2.5 2.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        </button>
        <button class="btn btn-ghost btn-icon" title="Import table" @click="handleImportTable">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1.5v6.2M4 5.4l2.5 2.5 2.5-2.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 10.5h9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
        </button>
        <button class="btn btn-ghost btn-icon" title="Backup all data" @click="handleExportAll">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2.5 4.5l4 4 4-4M6.5 8.5V1.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M1 11.5h11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
        </button>
        <button class="btn btn-ghost btn-icon" title="Restore all data" @click="handleImportAll">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 8.5V1.5M2.5 5.5l4-4 4 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M1 11.5h11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
        </button>
        <button class="btn btn-ghost btn-icon" title="Toggle theme" @click="toggleTheme">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="6.5" cy="6.5" r="2.4" stroke="currentColor" stroke-width="1.2"/><path d="M6.5 1v1.4M6.5 10.6V12M12 6.5h-1.4M2.4 6.5H1M10.4 2.6l-1 1M3.6 9.4l-1 1M10.4 10.4l-1-1M3.6 3.6l-1-1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
        </button>
      </template>
    </AppTopbar>

    <div class="filter-bar">
      <TagGroups
        :groups="allTagGroups"
        :active-tags="homeTagFilters"
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
          @open="openTable"
          @menu="openContextMenu"
        />
      </template>
    </div>

    <button class="fab" @click="createModalOpen = true">+</button>

    <TableFormModal
      :open="createModalOpen"
      :is-light="isLight"
      @close="createModalOpen = false"
      @save="handleCreateTable"
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
