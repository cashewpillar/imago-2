<script setup>
import { reactive, watch } from 'vue';
import BaseModal from '../../../shared/components/BaseModal.vue';
import { normalizeField } from '../../../shared/utils/tableVault';

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

watch(
  () => [props.open, props.initialData, props.fields],
  () => {
    if (!props.open) return;
    props.fields.forEach((field, index) => {
      const normalized = normalizeField(field, index);
      const value = props.initialData?.[normalized.key];
      form[normalized.key] = value ?? (normalized.type === 'boolean' ? false : '');
    });
  },
  { immediate: true },
);

function submit() {
  const payload = {};
  props.fields.forEach((field, index) => {
    const normalized = normalizeField(field, index);
    payload[normalized.key] = form[normalized.key];
  });
  emit('save', payload);
}
</script>

<template>
  <BaseModal :open="open" :title="mode === 'edit' ? 'Edit Record' : 'Add Record'" @close="$emit('close')">
    <div v-for="(field, index) in fields" :key="field.key" class="rfrow">
      <div class="rflabel">
        {{ normalizeField(field, index).label }}
        <span class="type-badge">{{ normalizeField(field, index).type }}</span>
      </div>

      <textarea
        v-if="normalizeField(field, index).type === 'textarea'"
        v-model="form[normalizeField(field, index).key]"
        class="ftextarea"
      />

      <div v-else-if="normalizeField(field, index).type === 'boolean'" style="display:flex;gap:16px;margin-top:2px;">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;">
          <input v-model="form[normalizeField(field, index).key]" :value="true" type="radio" :name="`b_${field.key}`" :style="{ accentColor: color.val }" />
          Yes
        </label>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px;">
          <input v-model="form[normalizeField(field, index).key]" :value="false" type="radio" :name="`b_${field.key}`" :style="{ accentColor: color.val }" />
          No
        </label>
      </div>

      <div v-else-if="normalizeField(field, index).type === 'progress'" style="margin-top:4px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <input
            v-model="form[normalizeField(field, index).key]"
            type="range"
            min="0"
            max="100"
            step="1"
            style="flex:1;"
            :style="{ accentColor: color.val }"
          />
          <span style="font-size:13px;font-weight:600;min-width:38px;" :style="{ color: color.val }">
            {{ Number(form[normalizeField(field, index).key] || 0) }}%
          </span>
        </div>
        <div class="prog-wrap" style="margin-top:6px;">
          <div class="prog-fill" :style="{ width: `${Number(form[normalizeField(field, index).key] || 0)}%`, background: color.val }" />
        </div>
      </div>

      <select
        v-else-if="normalizeField(field, index).type === 'select'"
        v-model="form[normalizeField(field, index).key]"
        class="fselect"
      >
        <option value="">Select…</option>
        <option v-for="option in normalizeField(field, index).options" :key="option" :value="option">{{ option }}</option>
      </select>

      <input
        v-else
        v-model="form[normalizeField(field, index).key]"
        class="finput"
        :type="normalizeField(field, index).type === 'number' ? 'number' : normalizeField(field, index).type === 'date' ? 'date' : normalizeField(field, index).type === 'url' ? 'url' : 'text'"
        :placeholder="normalizeField(field, index).type === 'url' ? 'https://…' : ''"
      />
    </div>

    <template #footer>
      <button class="btn btn-ghost" @click="$emit('close')">Cancel</button>
      <button class="btn btn-primary" @click="submit">{{ mode === 'edit' ? 'Save' : 'Add' }}</button>
    </template>
  </BaseModal>
</template>
