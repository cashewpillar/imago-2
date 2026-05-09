<script setup>
import { computed, inject, onBeforeUnmount, onMounted, ref } from 'vue';
import BaseModal from '../../../shared/components/BaseModal.vue';
import {
  importAfterlightLegacyEntries,
  prepareAfterlightLegacyImport,
} from '../services/afterlightDb';

const emit = defineEmits(['imported']);

const { showToast } = inject('appShell');

const fileInput = ref(null);
const rootRef = ref(null);
const open = ref(false);
const importing = ref(false);
const menuOpen = ref(false);
const plan = ref(null);
const errorMessage = ref('');
const stateUpdates = ref({});

const mappedStates = computed(() =>
  (plan.value?.stateValues || []).map((value) => ({
    source: value,
    target: stateUpdates.value[value] ?? value,
  })),
);

function resetState() {
  open.value = false;
  importing.value = false;
  plan.value = null;
  errorMessage.value = '';
  stateUpdates.value = {};
  menuOpen.value = false;
}

function openPicker() {
  menuOpen.value = false;
  fileInput.value?.click();
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
}

function handleDocumentClick(event) {
  if (!menuOpen.value) return;
  if (rootRef.value?.contains(event.target)) return;
  menuOpen.value = false;
}

async function handleFileChange(event) {
  const [file] = event.target.files || [];
  event.target.value = '';
  if (!file) return;

  try {
    const payload = JSON.parse(await file.text());
    const nextPlan = prepareAfterlightLegacyImport(payload);
    plan.value = nextPlan;
    stateUpdates.value = Object.fromEntries((nextPlan.stateValues || []).map((value) => [value, value]));
    errorMessage.value = '';
    open.value = true;
  } catch (error) {
    plan.value = null;
    errorMessage.value = error.message || 'Could not read that import file.';
    showToast(errorMessage.value, 'error');
  }
}

async function submitImport() {
  if (!plan.value || importing.value) return;
  importing.value = true;

  try {
    const result = await importAfterlightLegacyEntries(plan.value, stateUpdates.value);
    showToast(`Imported ${result.imported} Afterlight entr${result.imported === 1 ? 'y' : 'ies'}`, 'success');
    resetState();
    emit('imported', result.workspace);
  } catch (error) {
    errorMessage.value = error.message || 'Import failed.';
    showToast(errorMessage.value, 'error');
  } finally {
    importing.value = false;
  }
}

function closeModal() {
  if (importing.value) return;
  resetState();
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
});
</script>

<template>
  <div ref="rootRef" class="al-import-launcher" :class="{ 'is-open': menuOpen }">
    <button type="button" class="al-menu-trigger" title="More" @click.stop="toggleMenu">
      <span />
      <span />
      <span />
    </button>

    <div v-if="menuOpen" class="al-overflow-menu">
      <button type="button" class="al-overflow-item" @click="openPicker">
        Import legacy
      </button>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept=".json,application/json"
      class="al-hidden-input"
      @change="handleFileChange"
    >

    <BaseModal :open="open" title="Import legacy Afterlight" wide @close="closeModal">
      <div v-if="plan" class="al-import-stack">
        <div class="al-import-summary">
          <div class="al-import-summary-title">Legacy file detected</div>
          <div class="al-import-summary-copy">
            This import appends entries into your current Afterlight vault and preserves `rawDate` when present.
          </div>
          <div class="al-import-summary-meta">
            <span>{{ plan.entries.length }} ready to import</span>
            <span>{{ plan.totalEntries }} total in export</span>
            <span v-if="plan.exportedAt">{{ plan.exportedAt }}</span>
          </div>
        </div>

        <div v-if="mappedStates.length" class="al-import-mapping-list">
          <div class="al-section-label">update internal state labels on import</div>
          <div
            v-for="item in mappedStates"
            :key="item.source"
            class="al-import-mapping-row"
          >
            <div class="al-import-source">{{ item.source }}</div>
            <div class="al-import-arrow">→</div>
            <input
              v-model="stateUpdates[item.source]"
              class="al-field al-import-input"
              type="text"
              :placeholder="item.source"
            >
          </div>
        </div>

        <div v-if="errorMessage" class="al-status err">
          {{ errorMessage }}
        </div>
      </div>

      <template #footer>
        <button class="btn btn-ghost" :disabled="importing" @click="closeModal">Cancel</button>
        <button class="btn btn-primary" :disabled="!plan || importing" @click="submitImport">
          {{ importing ? 'Importing…' : 'Import entries' }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.al-import-launcher {
  position: relative;
  display: flex;
}

.al-import-launcher.is-open .al-menu-trigger span {
  background: #c8a96e;
}

.al-menu-trigger {
  width: 24px;
  min-height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  cursor: pointer;
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.al-menu-trigger:hover {
  opacity: 1;
  transform: translateY(-1px);
}

.al-menu-trigger span {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #7a7570;
  transition: background 0.15s ease;
}

.al-menu-trigger:hover span,
.al-menu-trigger:focus-visible span {
  background: #c8a96e;
}

.al-menu-trigger:focus-visible {
  outline: none;
}

.al-overflow-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 150px;
  padding: 4px;
  border: 1px solid #2a2a2a;
  border-radius: 2px;
  background: #101010;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
  z-index: 20;
}

.al-overflow-item {
  width: 100%;
  padding: 9px 10px;
  border: none;
  border-radius: 2px;
  background: transparent;
  color: #a89f92;
  font-family: inherit;
  font-size: 11px;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.al-overflow-item:hover {
  background: #171717;
  color: #c8a96e;
}

.al-hidden-input {
  display: none;
}
</style>
