<script setup>
import { computed, reactive, ref, watch } from 'vue';
import BaseModal from '../../../shared/components/BaseModal.vue';
import { FIELD_TYPES } from '../../../shared/constants/tableVault';
import { normalizeField, parseSelectOptions } from '../../../shared/utils/tableVault';

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  mode: {
    type: String,
    default: 'add',
  },
  fields: {
    type: Array,
    default: () => [],
  },
  color: {
    type: Object,
    required: true,
  },
  initialData: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['close', 'save']);
const form = reactive({});
const editableFields = ref([]);
const activePane = ref('record');

const normalizedFields = computed(() => editableFields.value.map((field, index) => normalizeField(field, index)));

watch(
  () => [props.open, props.initialData, props.fields],
  () => {
    if (!props.open) return;
    activePane.value = 'record';
    editableFields.value = (props.fields || []).map((field, index) => ({
      ...normalizeField(field, index),
      optionsText: (field.options || []).join(', '),
    }));
    normalizedFields.value.forEach((field) => {
      const value = props.initialData?.[field.key];
      form[field.key] = value ?? (field.type === 'boolean' ? false : '');
    });
    Object.keys(form).forEach((key) => {
      if (!normalizedFields.value.find((field) => field.key === key)) delete form[key];
    });
  },
  { immediate: true },
);

watch(
  normalizedFields,
  (fields) => {
    fields.forEach((field) => {
      if (!(field.key in form)) form[field.key] = field.type === 'boolean' ? false : '';
    });
    Object.keys(form).forEach((key) => {
      if (!fields.find((field) => field.key === key)) delete form[key];
    });
  },
  { deep: true },
);

function addField() {
  editableFields.value.push({
    key: `f_${Date.now()}_${editableFields.value.length}`,
    label: '',
    type: 'text',
    options: [],
    optionsText: '',
  });
}

function removeField(index) {
  editableFields.value.splice(index, 1);
}

function submit() {
  const payload = {};
  normalizedFields.value.forEach((field) => {
    payload[field.key] = form[field.key];
  });
  emit(
    'save',
    {
      data: payload,
      fields: editableFields.value.map((field, index) =>
        normalizeField(
          {
            ...field,
            options: field.type === 'select' ? parseSelectOptions(field.optionsText) : [],
          },
          index,
        ),
      ),
    },
  );
}
</script>

<template>
  <BaseModal :open="open" :title="mode === 'edit' ? 'Edit Record' : 'Add Record'" @close="$emit('close')">
    <template #header-actions>
      <div class="record-form-switch">
        <button
          class="record-form-switch-btn"
          :class="{ active: activePane === 'record' }"
          @click="activePane = 'record'"
        >
          Record
        </button>
        <button
          class="record-form-switch-btn"
          :class="{ active: activePane === 'fields' }"
          @click="activePane = 'fields'"
        >
          Fields
        </button>
      </div>
    </template>

    <div class="record-form-layout">
      <div v-if="activePane === 'record'" class="record-form-pane">
        <div v-for="(field, index) in normalizedFields" :key="field.key" class="rfrow">
          <div class="rflabel">
            {{ field.label }}
            <span class="type-badge">{{ field.type }}</span>
          </div>

          <textarea
            v-if="field.type === 'textarea'"
            v-model="form[field.key]"
            class="ftextarea"
          />

          <div v-else-if="field.type === 'boolean'" style="display:flex;gap:16px;margin-top:2px;">
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;">
              <input v-model="form[field.key]" :value="true" type="radio" :name="`b_${field.key}`" :style="{ accentColor: color.val }" />
              Yes
            </label>
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;">
              <input v-model="form[field.key]" :value="false" type="radio" :name="`b_${field.key}`" :style="{ accentColor: color.val }" />
              No
            </label>
          </div>

          <div v-else-if="field.type === 'progress'" style="margin-top:4px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <input
                v-model="form[field.key]"
                type="range"
                min="0"
                max="100"
                step="1"
                style="flex:1;"
                :style="{ accentColor: color.val }"
              />
              <span style="font-size:13px;font-weight:600;min-width:38px;" :style="{ color: color.val }">
                {{ Number(form[field.key] || 0) }}%
              </span>
            </div>
            <div class="prog-wrap" style="margin-top:6px;">
              <div class="prog-fill" :style="{ width: `${Number(form[field.key] || 0)}%`, background: color.val }" />
            </div>
          </div>

          <select
            v-else-if="field.type === 'select'"
            v-model="form[field.key]"
            class="fselect"
          >
            <option value="">Select…</option>
            <option v-for="option in field.options" :key="option" :value="option">{{ option }}</option>
          </select>

          <input
            v-else
            v-model="form[field.key]"
            class="finput"
            :type="field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'url' ? 'url' : 'text'"
            :placeholder="field.type === 'url' ? 'https://…' : ''"
          />
        </div>
      </div>

      <div v-else class="record-fields-pane record-fields-pane-standalone">
        <div class="record-fields-list">
          <div
            v-for="(field, index) in editableFields"
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
      </div>
    </div>

    <template #footer>
      <button class="btn btn-ghost" @click="$emit('close')">Cancel</button>
      <button class="btn btn-primary" @click="submit">{{ mode === 'edit' ? 'Save' : 'Add' }}</button>
    </template>
  </BaseModal>
</template>
