<script setup>
import { computed, ref, watch } from 'vue';
import BaseModal from '../../../shared/components/BaseModal.vue';
import {
  getDefaultImportTarget,
  getFieldSampleValues,
  IMPORT_TARGET_CREATE,
  IMPORT_TARGET_SKIP,
  normalizeField,
} from '../../../shared/utils/tableVault';

const props = defineProps({
  open: { type: Boolean, default: false },
  backup: { type: Object, default: null },
  targetFields: { type: Array, default: () => [] },
});

const emit = defineEmits(['close', 'import']);

const mappings = ref([]);

const sourceTable = computed(() => props.backup?.vault || null);
const sourceFields = computed(() => (sourceTable.value?.fields || []).map((field, index) => normalizeField(field, index)));
const sourceEntries = computed(() => props.backup?.entries || []);

const targetOptions = computed(() => [
  { value: IMPORT_TARGET_SKIP, label: 'Skip this field' },
  { value: IMPORT_TARGET_CREATE, label: 'Create new field' },
  ...(props.targetFields || []).map((field) => ({
    value: field.key,
    label: `${field.label} (${field.type})`,
  })),
]);

const mappedCount = computed(() => mappings.value.filter((item) => item.targetKey !== IMPORT_TARGET_SKIP).length);
const createCount = computed(() => mappings.value.filter((item) => item.targetKey === IMPORT_TARGET_CREATE).length);

watch(
  () => [props.open, props.backup, props.targetFields],
  () => {
    if (!props.open || !props.backup) return;
    mappings.value = sourceFields.value.map((field, index) => ({
      sourceKey: field.key,
      targetKey: getDefaultImportTarget(field, props.targetFields, index),
    }));
  },
  { immediate: true, deep: true },
);

function getSample(fieldKey) {
  return getFieldSampleValues(sourceEntries.value, fieldKey, 3);
}

function getMapping(fieldKey) {
  return mappings.value.find((item) => item.sourceKey === fieldKey)?.targetKey || IMPORT_TARGET_SKIP;
}

function setMapping(fieldKey, value) {
  const row = mappings.value.find((item) => item.sourceKey === fieldKey);
  if (row) row.targetKey = value;
}

function submit() {
  emit('import', {
    backup: props.backup,
    mappings: mappings.value,
  });
}
</script>

<template>
  <BaseModal :open="open" title="Import Records" wide @close="$emit('close')">
    <div v-if="sourceTable" class="import-records">
      <div class="import-summary-card">
        <div class="import-summary-title">{{ sourceTable.icon || '📦' }} {{ sourceTable.name }}</div>
        <div class="import-summary-copy">
          {{ sourceEntries.length }} record{{ sourceEntries.length === 1 ? '' : 's' }} from this backup will be imported into the active table.
        </div>
        <div class="import-summary-meta">
          <span>{{ mappedCount }} mapped</span>
          <span>{{ createCount }} new field{{ createCount === 1 ? '' : 's' }}</span>
        </div>
      </div>

      <div class="record-fields-section">
        <div class="record-fields-section-title">Field Alignment</div>
        <div class="import-mapping-list">
          <div v-for="field in sourceFields" :key="field.key" class="import-mapping-row">
            <div class="import-mapping-source">
              <div class="import-mapping-label">
                {{ field.label }}
                <span class="type-badge">{{ field.type }}</span>
              </div>
              <div class="import-mapping-key">{{ field.key }}</div>
              <div v-if="getSample(field.key).length" class="import-mapping-samples">
                {{ getSample(field.key).join(' • ') }}
              </div>
            </div>

            <div class="import-mapping-arrow">→</div>

            <select
              :value="getMapping(field.key)"
              class="fselect import-mapping-select"
              @change="setMapping(field.key, $event.target.value)"
            >
              <option v-for="option in targetOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <button class="btn btn-ghost" @click="$emit('close')">Cancel</button>
      <button class="btn btn-primary" @click="submit">Import</button>
    </template>
  </BaseModal>
</template>
