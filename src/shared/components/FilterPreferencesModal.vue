<script setup>
import { computed, ref, watch } from 'vue';
import BaseModal from './BaseModal.vue';
import TagGroups from './TagGroups.vue';
import { EMPTY_FILTER_VALUE, sanitizeGroupFilters } from '../utils/tableVault';

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: 'Filter Preferences' },
  groups: { type: Array, default: () => [] },
  activeFilters: { type: Object, default: () => ({}) },
  preferences: { type: Array, default: () => [] },
  color: { type: Object, required: true },
});

const emit = defineEmits(['close', 'apply', 'save-preference', 'delete-preference']);

const draftFilters = ref({});
const preferenceName = ref('');

const hasActiveFilters = computed(() => Object.values(draftFilters.value).some((value) => Array.isArray(value) && value.length));

function getPreferenceSummary(preference) {
  return Object.entries(preference.filters || {})
    .flatMap(([groupKey, values]) => {
      const group = props.groups.find((item) => item.key === groupKey);
      return (Array.isArray(values) ? values : []).map((value) => {
        if (!group) return value;
        const tag = group.tags.find((item) => item.value === value);
        if (tag) return tag.label;
        if (value === EMPTY_FILTER_VALUE) return `No ${group.label || 'value'}`;
        return value;
      });
    })
    .join(' · ');
}

function syncDraft() {
  draftFilters.value = sanitizeGroupFilters(props.activeFilters, props.groups);
}

function toggleDraft({ groupKey, nextValue }) {
  draftFilters.value = {
    ...draftFilters.value,
    [groupKey]: nextValue,
  };

  if (!draftFilters.value[groupKey]?.length) {
    const { [groupKey]: _removed, ...rest } = draftFilters.value;
    draftFilters.value = rest;
  }
}

function applyDraft() {
  emit('apply', sanitizeGroupFilters(draftFilters.value, props.groups));
}

function savePreference() {
  if (!preferenceName.value.trim()) return;
  emit('save-preference', {
    name: preferenceName.value.trim(),
    filters: sanitizeGroupFilters(draftFilters.value, props.groups),
  });
  preferenceName.value = '';
}

function loadPreference(preference) {
  draftFilters.value = sanitizeGroupFilters(preference.filters, props.groups);
}

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    syncDraft();
  },
  { immediate: true },
);

watch(
  () => props.groups,
  (groups) => {
    draftFilters.value = sanitizeGroupFilters(draftFilters.value, groups);
  },
  { deep: true },
);
</script>

<template>
  <BaseModal :open="open" :title="title" @close="$emit('close')">
    <div class="filter-pref-modal">
      <section class="filter-pref-section">
        <div class="filter-pref-heading">Current Combination</div>
        <p class="filter-pref-copy">
          Pick the select and multiselect filters you want, then apply them now or save them as a preset.
        </p>
        <TagGroups :groups="groups" :active-filters="draftFilters" :color="color" @toggle="toggleDraft" />
        <p v-if="!groups.length" class="filter-pref-empty">No filterable select fields available yet.</p>
      </section>

      <section class="filter-pref-section">
        <div class="filter-pref-heading">Save Preset</div>
        <div class="filter-pref-save-row">
          <input
            v-model="preferenceName"
            class="finput"
            type="text"
            maxlength="40"
            placeholder="Preset name"
          >
          <button class="btn btn-primary" :disabled="!preferenceName.trim() || !hasActiveFilters" @click="savePreference">
            Save
          </button>
        </div>
      </section>

      <section class="filter-pref-section">
        <div class="filter-pref-heading">Saved Presets</div>
        <div v-if="preferences.length" class="filter-pref-list">
          <div v-for="preference in preferences" :key="preference.id" class="filter-pref-card">
            <div class="filter-pref-card-main">
              <div class="filter-pref-name">{{ preference.name }}</div>
              <div class="filter-pref-summary">
                {{ getPreferenceSummary(preference) || 'Empty preset' }}
              </div>
            </div>
            <div class="filter-pref-card-actions">
              <button class="btn btn-ghost" @click="loadPreference(preference)">Load</button>
              <button class="btn btn-danger" @click="$emit('delete-preference', preference.id)">Delete</button>
            </div>
          </div>
        </div>
        <p v-else class="filter-pref-empty">No saved presets yet.</p>
      </section>
    </div>

    <template #footer>
      <button class="btn btn-ghost" @click="$emit('close')">Close</button>
      <button class="btn btn-primary" @click="applyDraft">Apply</button>
    </template>
  </BaseModal>
</template>

<style scoped>
.filter-pref-modal {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.filter-pref-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.filter-pref-heading {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted2);
}

.filter-pref-copy,
.filter-pref-empty,
.filter-pref-summary {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.5;
}

.filter-pref-save-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.filter-pref-save-row .finput {
  flex: 1;
}

.filter-pref-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-pref-card {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--bg3);
  padding: 10px 12px;
}

.filter-pref-card-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-pref-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
}

.filter-pref-card-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .filter-pref-save-row,
  .filter-pref-card {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-pref-card-actions {
    justify-content: flex-end;
  }
}
</style>
