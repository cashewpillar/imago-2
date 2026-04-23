import { computed, ref } from 'vue';
import { tableVaultDb } from './tableVault.db';

export function useTableVault() {
  const vaults = ref([]);
  const entries = ref([]);
  const currentVaultId = ref(null);

  const currentVault = computed(
    () => vaults.value.find((vault) => vault.id === currentVaultId.value) ?? null
  );

  async function loadVaults() {
    vaults.value = await tableVaultDb.vaults.orderBy('createdAt').reverse().toArray();
    if (!currentVaultId.value && vaults.value[0]) {
      currentVaultId.value = vaults.value[0].id;
      await loadEntries(vaults.value[0].id);
    }
  }

  async function loadEntries(vaultId) {
    currentVaultId.value = vaultId;
    entries.value = await tableVaultDb.entries.where('tableId').equals(vaultId).reverse().sortBy('createdAt');
    entries.value.reverse();
  }

  async function addVault(payload) {
    const id = await tableVaultDb.vaults.add({
      name: payload.name.trim(),
      icon: payload.icon.trim() || '📋',
      color: payload.color,
      tags: payload.tags
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
      createdAt: Date.now(),
    });
    await loadVaults();
    await loadEntries(id);
  }

  async function addEntry(payload) {
    if (!currentVaultId.value) {
      return;
    }

    await tableVaultDb.entries.add({
      tableId: currentVaultId.value,
      title: payload.title.trim(),
      notes: payload.notes.trim(),
      createdAt: Date.now(),
    });
    await loadEntries(currentVaultId.value);
  }

  async function removeEntry(id) {
    await tableVaultDb.entries.delete(id);
    if (currentVaultId.value) {
      await loadEntries(currentVaultId.value);
    }
  }

  return {
    vaults,
    entries,
    currentVaultId,
    currentVault,
    loadVaults,
    loadEntries,
    addVault,
    addEntry,
    removeEntry,
  };
}
