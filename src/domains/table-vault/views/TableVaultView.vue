<template>
  <div class="vault">
    <div class="vault__app">
      <div class="vault__topbar">
        <RouterLink to="/" class="vault__back">← imago</RouterLink>
        <div class="vault__logo">Table<span>Vault</span></div>
      </div>

      <div class="vault__layout">
        <section class="vault__panel">
          <VaultComposer @submit="handleVaultSubmit" />
        </section>

        <section class="vault__panel">
          <VaultList :vaults="vaults" :selected-id="currentVaultId" @select="loadEntries" />
        </section>

        <section class="vault__panel">
          <template v-if="currentVault">
            <h2 class="vault__title">{{ currentVault.icon }} {{ currentVault.name }}</h2>
            <EntryComposer @submit="handleEntrySubmit" />
          </template>
          <EmptyState
            v-else
            title="No table selected"
            copy="Create a table first, then records can be added here."
          />
        </section>

        <section class="vault__panel vault__panel--wide">
          <EntryList v-if="entries.length" :entries="entries" @remove="removeEntry" />
          <EmptyState
            v-else
            title="No records yet"
            copy="This table is ready for its first entry."
          />
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import EmptyState from '../../../shared/components/EmptyState.vue';
import { useTableVault } from '../useTableVault';
import VaultComposer from '../components/VaultComposer.vue';
import VaultList from '../components/VaultList.vue';
import EntryComposer from '../components/EntryComposer.vue';
import EntryList from '../components/EntryList.vue';

const {
  vaults,
  entries,
  currentVaultId,
  currentVault,
  loadVaults,
  loadEntries,
  addVault,
  addEntry,
  removeEntry,
} = useTableVault();

onMounted(loadVaults);

async function handleVaultSubmit(draft) {
  await addVault(draft);
  draft.name = '';
  draft.icon = '📋';
  draft.color = '#b8ff57';
  draft.tags = '';
}

async function handleEntrySubmit(draft) {
  await addEntry(draft);
  draft.title = '';
  draft.notes = '';
}
</script>

<style scoped>
.vault {
  min-height: 100vh;
  background: #0e0e10;
  color: #efefee;
}

.vault__app {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 14px 32px;
}

.vault__topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;
  height: 52px;
  margin-bottom: 12px;
  background: #0e0e10;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.vault__back {
  color: #7a7a88;
  text-decoration: none;
  font-size: 13px;
}

.vault__logo {
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.5px;
  color: #b8ff57;
}

.vault__logo span {
  color: #efefee;
}

.vault__layout {
  display: grid;
  grid-template-columns: 280px 320px 1fr;
  gap: 10px;
  align-items: start;
}

.vault__panel {
  background: #17171b;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 14px;
  padding: 14px;
}

.vault__panel--wide {
  grid-column: span 2;
}

.vault__title {
  margin: 0 0 14px;
  font-size: 15px;
  font-weight: 700;
}

.vault :deep(.form),
.vault :deep(.list) {
  gap: 8px;
}

.vault :deep(.form input),
.vault :deep(.form textarea),
.vault :deep(.button--primary),
.vault :deep(.item) {
  background: #1f1f25;
  color: #efefee;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 8px;
  box-shadow: none;
}

.vault :deep(.button--ghost) {
  background: transparent;
  border-color: rgba(255, 255, 255, 0.13);
  color: #7a7a88;
}

.vault :deep(.item__meta),
.vault :deep(.item p),
.vault :deep(.empty) {
  color: #7a7a88;
}

.vault :deep(.empty) {
  background: transparent;
  border-color: rgba(255, 255, 255, 0.13);
}

@media (max-width: 900px) {
  .vault__layout {
    grid-template-columns: 1fr;
  }

  .vault__panel--wide {
    grid-column: auto;
  }
}
</style>
