<script setup>
import { computed, inject, ref } from 'vue';
import BaseModal from '../../../shared/components/BaseModal.vue';
import {
  importAfterlightLegacyEntries,
  prepareAfterlightLegacyImport,
} from '../services/afterlightDb';

const emit = defineEmits(['imported']);

const { showToast } = inject('appShell');

const fileInput = ref(null);
const open = ref(false);
const importing = ref(false);
const plan = ref(null);
const errorMessage = ref('');
const actionUpdates = ref({});

const mappedActions = computed(() =>
  (plan.value?.actionValues || []).map((value) => ({
    source: value,
    target: actionUpdates.value[value] ?? value,
  })),
);

function resetState() {
  open.value = false;
  importing.value = false;
  plan.value = null;
  errorMessage.value = '';
  actionUpdates.value = {};
}

function openPicker() {
  fileInput.value?.click();
}

async function handleFileChange(event) {
  const [file] = event.target.files || [];
  event.target.value = '';
  if (!file) return;

  try {
    const payload = JSON.parse(await file.text());
    const nextPlan = prepareAfterlightLegacyImport(payload);
    plan.value = nextPlan;
    actionUpdates.value = Object.fromEntries((nextPlan.actionValues || []).map((value) => [value, value]));
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
    const result = await importAfterlightLegacyEntries(plan.value, actionUpdates.value);
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
</script>

<template>
  <div class="al-import-launcher">
    <button type="button" class="al-filter-pill al-import-trigger" @click="openPicker">
      import legacy
    </button>
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

        <div v-if="mappedActions.length" class="al-import-mapping-list">
          <div class="al-section-label">update action labels on import</div>
          <div
            v-for="item in mappedActions"
            :key="item.source"
            class="al-import-mapping-row"
          >
            <div class="al-import-source">{{ item.source }}</div>
            <div class="al-import-arrow">→</div>
            <input
              v-model="actionUpdates[item.source]"
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
