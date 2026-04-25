<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue';
import { FIELD_TYPES } from '../constants/tableVault';
import { getColor } from '../utils/color';
import { normalizeField, parseSelectOptions, sanitizeTableMetaSchema } from '../utils/tableVault';
import BaseModal from './BaseModal.vue';
import ColorPicker from './ColorPicker.vue';

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    required: true,
  },
  formFields: {
    type: Array,
    default: () => [],
  },
  initialData: {
    type: Object,
    default: () => ({}),
  },
  editableFields: {
    type: Array,
    default: () => [],
  },
  formFieldSchemaEditable: {
    type: Boolean,
    default: false,
  },
  formFieldTypeOptions: {
    type: Array,
    default: () => ['text', 'number', 'date', 'url', 'boolean', 'select', 'multiselect', 'progress', 'textarea', 'icon', 'color'],
  },
  fieldEditorEnabled: {
    type: Boolean,
    default: false,
  },
  fieldTypeOptions: {
    type: Array,
    default: () => FIELD_TYPES,
  },
  isLight: {
    type: Boolean,
    default: false,
  },
  accentColor: {
    type: String,
    default: 'Lime',
  },
  primaryPaneLabel: {
    type: String,
    default: 'Details',
  },
  secondaryPaneLabel: {
    type: String,
    default: 'Fields',
  },
  saveLabel: {
    type: String,
    default: 'Save',
  },
});

const emit = defineEmits(['close', 'save']);

const form = reactive({});
const localFormFields = ref([]);
const localEditableFields = ref([]);
const activePane = ref('form');
const hasSecondaryPane = computed(() => props.formFieldSchemaEditable || props.fieldEditorEnabled);

const accent = computed(() => getColor(form.color || props.accentColor || 'Lime', props.isLight));

const normalizedFormFields = computed(() => sanitizeTableMetaSchema(localFormFields.value));

const normalizedEditableFields = computed(() =>
  localEditableFields.value.map((field, index) =>
    normalizeField(
      {
        ...field,
        options: ['select', 'multiselect'].includes(field.type) ? parseSelectOptions(field.optionsText) : [],
      },
      index,
    ),
  ),
);

const formRows = computed(() => {
  const rows = [];
  normalizedFormFields.value.forEach((field) => {
    const rowKey = field.row || null;
    const lastRow = rows[rows.length - 1];
    if (rowKey && lastRow?.rowKey === rowKey) {
      lastRow.fields.push(field);
      return;
    }
    rows.push({ rowKey, fields: [field] });
  });
  return rows;
});

watch(
  () => [props.open, props.initialData, props.formFields, props.editableFields],
  () => {
    if (!props.open) return;
    activePane.value = 'form';
    localFormFields.value = (props.formFields || []).map((field) => ({
      ...field,
      optionsText: Array.isArray(field.options) ? field.options.join(', ') : field.optionsText || '',
    }));
    normalizedFormFields.value.forEach((field) => {
      const value = props.initialData?.[field.key];
      if (field.type === 'boolean') form[field.key] = value ?? false;
      else if (field.type === 'multiselect') form[field.key] = Array.isArray(value) ? [...value] : [];
      else form[field.key] = value ?? '';
    });
    Object.keys(form).forEach((key) => {
      if (!normalizedFormFields.value.find((field) => field.key === key)) delete form[key];
    });

    localEditableFields.value = (props.editableFields || []).map((field, index) => ({
      ...normalizeField(field, index),
      optionsText: (field.options || []).join(', '),
    }));
  },
  { immediate: true, deep: true },
);

watch(
  normalizedFormFields,
  (fields) => {
    fields.forEach((field) => {
      if (!(field.key in form)) {
        form[field.key] = field.type === 'boolean' ? false : field.type === 'multiselect' ? [] : '';
      }
    });
    Object.keys(form).forEach((key) => {
      if (!fields.find((field) => field.key === key)) delete form[key];
    });
  },
  { deep: true },
);

function addField() {
  localEditableFields.value.push({
    key: `f_${Date.now()}_${localEditableFields.value.length}`,
    label: '',
    type: 'text',
    options: [],
    optionsText: '',
  });
}

function removeField(index) {
  localEditableFields.value.splice(index, 1);
}

function addFormField() {
  localFormFields.value.push({
    key: `meta_${Date.now()}_${localFormFields.value.length}`,
    label: '',
    type: 'text',
    optionsText: '',
  });
}

function removeFormField(index) {
  localFormFields.value.splice(index, 1);
}

function toggleMultiSelectValue(fieldKey, option) {
  if (!Array.isArray(form[fieldKey])) form[fieldKey] = [];
  const index = form[fieldKey].indexOf(option);
  if (index >= 0) form[fieldKey].splice(index, 1);
  else form[fieldKey].push(option);
}

function selectSingleValue(fieldKey, option) {
  if (form[fieldKey] === option) {
    form[fieldKey] = '';
  } else {
    form[fieldKey] = option;
  }
}

function supportsOptions(field) {
  return ['select', 'multiselect'].includes(field.type);
}

function supportsMaxlength(field) {
  return ['text', 'url', 'textarea'].includes(field.type);
}

function adjustTextareaHeight(e) {
  const el = e?.target || e;
  if (!el || !el.style) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

watch(
  () => [props.open, activePane.value],
  async ([isOpen]) => {
    if (isOpen) {
      await nextTick();
      document.querySelectorAll('.ftextarea').forEach((el) => {
        adjustTextareaHeight(el);
      });
    }
  },
);

function submit() {
  const data = {};
  normalizedFormFields.value.forEach((field) => {
    data[field.key] = field.type === 'multiselect' ? [...(form[field.key] || [])] : form[field.key];
  });

  emit('save', {
    data,
    formFields: normalizedFormFields.value,
    fields: normalizedEditableFields.value,
  });
}
</script>

<template>
  <BaseModal :open="open" :title="title" @close="$emit('close')">
    <template v-if="hasSecondaryPane" #header-actions>
      <div class="record-form-switch">
        <button
          class="record-form-switch-btn"
          :class="{ active: activePane === 'form' }"
          @click="activePane = 'form'"
        >
          {{ primaryPaneLabel }}
        </button>
        <button
          class="record-form-switch-btn"
          :class="{ active: activePane === 'fields' }"
          @click="activePane = 'fields'"
        >
          {{ secondaryPaneLabel }}
        </button>
      </div>
    </template>

    <div class="record-form-layout">
      <div v-if="activePane === 'form'" class="record-form-pane">
        <div
          v-for="(row, rowIndex) in formRows"
          :key="row.rowKey || rowIndex"
          class="form-row"
          :class="{ 'form-row-inline': row.fields.length > 1 }"
        >
          <div
            v-for="field in row.fields"
            :key="field.key"
            class="form-cell"
            :class="{ 'form-cell-compact': field.compact }"
          >
            <div class="rflabel">
              {{ field.label }}
              <span class="type-badge">{{ field.type }}</span>
            </div>

            <textarea
              v-if="field.type === 'textarea'"
              v-model="form[field.key]"
              class="ftextarea"
              @input="adjustTextareaHeight"
            />

            <div v-else-if="field.type === 'boolean'" style="display:flex;gap:16px;margin-top:2px;">
              <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;">
                <input v-model="form[field.key]" :value="true" type="radio" :name="`b_${field.key}`" :style="{ accentColor: accent.val }" />
                Yes
              </label>
              <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;">
                <input v-model="form[field.key]" :value="false" type="radio" :name="`b_${field.key}`" :style="{ accentColor: accent.val }" />
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
                  :style="{ accentColor: accent.val }"
                />
                <span style="font-size:13px;font-weight:600;min-width:38px;" :style="{ color: accent.val }">
                  {{ Number(form[field.key] || 0) }}%
                </span>
              </div>
              <div class="prog-wrap" style="margin-top:6px;">
                <div class="prog-fill" :style="{ width: `${Number(form[field.key] || 0)}%`, background: accent.val }" />
              </div>
            </div>

            <div v-else-if="field.type === 'select'" class="multi-select-wrap">
              <button
                v-for="option in field.options || []"
                :key="option"
                type="button"
                class="multi-select-chip"
                :class="{ active: form[field.key] === option }"
                @click="selectSingleValue(field.key, option)"
              >
                {{ option }}
              </button>
            </div>

            <div v-else-if="field.type === 'multiselect'" class="multi-select-wrap">
              <button
                v-for="option in field.options || []"
                :key="option"
                type="button"
                class="multi-select-chip"
                :class="{ active: (form[field.key] || []).includes(option) }"
                @click="toggleMultiSelectValue(field.key, option)"
              >
                {{ option }}
              </button>
            </div>

            <ColorPicker
              v-else-if="field.type === 'color'"
              v-model="form[field.key]"
              :is-light="isLight"
            />

            <input
              v-else-if="field.type !== 'multiselect'"
              v-model="form[field.key]"
              class="finput"
              :class="{ 'finput-icon': field.type === 'icon' }"
              :maxlength="field.type === 'icon' ? 4 : field.maxlength"
              :type="field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'url' ? 'url' : 'text'"
            />
          </div>
        </div>
      </div>

      <div v-else class="record-fields-pane record-fields-pane-standalone">
        <div v-if="formFieldSchemaEditable" class="record-fields-section">
          <div class="record-fields-section-title">Table Fields</div>
          <div class="record-fields-list">
            <div
              v-for="(field, index) in localFormFields"
              :key="field.key"
              class="field-row"
              :class="{ wrap: supportsOptions(field) || supportsMaxlength(field) }"
            >
              <span class="field-badge field-badge-neutral">{{ field.key }}</span>
              <input v-model="field.label" type="text" placeholder="Field name" />
              <select v-model="field.type">
                <option v-for="type in formFieldTypeOptions" :key="type" :value="type">{{ type }}</option>
              </select>
              <button
                v-if="!field.locked"
                class="field-del"
                @click="removeFormField(index)"
              >
                ✕
              </button>
              <div v-else style="width:22px;" />
              <div v-if="supportsOptions(field)" class="field-options">
                <input v-model="field.optionsText" type="text" placeholder="Options, separated by commas" />
              </div>
              <div
                v-if="field.type !== 'color' && field.type !== 'boolean' && field.type !== 'progress'"
                class="field-properties"
              >
                <label v-if="supportsMaxlength(field)" class="field-prop field-prop-small">
                  <span>Max</span>
                  <input v-model="field.maxlength" type="number" min="1" placeholder="None" />
                </label>
                <label class="field-prop">
                  <span>Row</span>
                  <input v-model="field.row" type="text" placeholder="Optional row key" />
                </label>
                <label class="field-prop field-prop-toggle">
                  <input v-model="field.compact" type="checkbox" />
                  Compact
                </label>
              </div>
            </div>
          </div>
          <button class="btn-add-field" @click="addFormField">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
            Add Table Field
          </button>
        </div>

        <div
          v-if="formFieldSchemaEditable && fieldEditorEnabled"
          class="record-fields-divider"
        />

        <div v-if="fieldEditorEnabled" class="record-fields-section">
          <div class="record-fields-section-title">Record Fields</div>
          <div class="record-fields-list">
            <div
              v-for="(field, index) in localEditableFields"
              :key="field.key"
              class="field-row"
              :class="{ primary: index === 0, wrap: supportsOptions(field) || supportsMaxlength(field) }"
            >
              <span v-if="index === 0" class="field-badge">Title</span>
              <span v-else style="color:var(--muted2);cursor:grab;font-size:14px;">⠿</span>
              <input v-model="field.label" type="text" placeholder="Field name" />
              <select v-model="field.type" :disabled="index === 0">
                <option v-for="type in fieldTypeOptions" :key="type" :value="type">{{ type }}</option>
              </select>
              <div v-if="index === 0" style="width:22px;" />
              <button v-else class="field-del" @click="removeField(index)">✕</button>
              <div v-if="supportsOptions(field)" class="field-options">
                <input v-model="field.optionsText" type="text" placeholder="Options, separated by commas" />
              </div>
              <div
                v-if="field.type !== 'color' && field.type !== 'boolean' && field.type !== 'progress'"
                class="field-properties"
              >
                <label v-if="supportsMaxlength(field)" class="field-prop field-prop-small">
                  <span>Max</span>
                  <input v-model="field.maxlength" type="number" min="1" placeholder="None" />
                </label>
                <label class="field-prop">
                  <span>Row</span>
                  <input v-model="field.row" type="text" placeholder="Optional row key" />
                </label>
                <label class="field-prop field-prop-toggle">
                  <input v-model="field.compact" type="checkbox" />
                  Compact
                </label>
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
    </div>

    <template #footer>
      <button class="btn btn-ghost" @click="$emit('close')">Cancel</button>
      <button class="btn btn-primary" @click="submit">{{ saveLabel }}</button>
    </template>
  </BaseModal>
</template>
