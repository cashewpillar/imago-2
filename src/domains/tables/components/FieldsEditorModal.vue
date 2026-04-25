<script setup>
import { reactive, watch } from 'vue';
import BaseModal from '../../../shared/components/BaseModal.vue';
import { FIELD_TYPES } from '../../../shared/constants/tableVault';
import { normalizeField, parseSelectOptions } from '../../../shared/utils/tableVault';

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  fields: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['close', 'save']);
const state = reactive({ fields: [] });

watch(
  () => [props.open, props.fields],
  () => {
    if (!props.open) return;
    state.fields = (props.fields || []).map((field, index) => ({
      ...normalizeField(field, index),
      optionsText: (field.options || []).join(', '),
    }));
  },
  { immediate: true },
);

function addField() {
  state.fields.push({
    key: `f_${Date.now()}_${state.fields.length}`,
    label: '',
    type: 'text',
    options: [],
    optionsText: '',
  });
}

function removeField(index) {
  state.fields.splice(index, 1);
}

function submit() {
  emit(
    'save',
    state.fields.map((field, index) =>
      normalizeField(
        {
          ...field,
          options: field.type === 'select' ? parseSelectOptions(field.optionsText) : [],
        },
        index,
      ),
    ),
  );
}
</script>

<template>
  <BaseModal :open="open" title="Edit Fields" @close="$emit('close')">
    <p style="font-size:12px;color:var(--muted);line-height:1.7;">Define the columns for records. The first field is the card title.</p>
    <div style="display:flex;flex-direction:column;gap:7px;">
      <div
        v-for="(field, index) in state.fields"
        :key="field.key"
        class="field-row"
        :class="{ primary: index === 0, wrap: field.type === 'select' }"
      >
        <span v-if="index === 0" class="field-badge">Title</span>
        <span v-else style="color:var(--muted2);cursor:grab;font-size:14px;">⠿</span>
        <input v-model="field.label" type="text" placeholder="Field name" />
        <select v-model="field.type" :disabled="index === 0">
          <option v-for="type in FIELD_TYPES" :key="type" :value="type">{{ type }}</option>
        </select>
        <div v-if="index === 0" style="width:22px;" />
        <button v-else class="field-del" @click="removeField(index)">✕</button>
        <div v-if="field.type === 'select'" class="field-options">
          <input v-model="field.optionsText" type="text" placeholder="Options, separated by commas" />
        </div>
      </div>
    </div>
    <button class="btn-add-field" @click="addField">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      </svg>
      Add Field
    </button>

    <template #footer>
      <button class="btn btn-ghost" @click="$emit('close')">Cancel</button>
      <button class="btn btn-primary" @click="submit">Save Fields</button>
    </template>
  </BaseModal>
</template>
