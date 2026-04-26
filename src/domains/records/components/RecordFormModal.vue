<script setup>
import { computed } from 'vue';
import SchemaEditorModal from '../../../shared/components/SchemaEditorModal.vue';
import { normalizeField } from '../../../shared/utils/tableVault';

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: 'add' },
  fields: { type: Array, default: () => [] },
  color: { type: Object, required: true },
  initialData: { type: Object, default: () => ({}) },
});

defineEmits(['close', 'save', 'copy', 'delete']);

const formFields = computed(() => props.fields.map((field, index) => normalizeField(field, index)));
</script>

<template>
  <SchemaEditorModal
    :open="open"
    :title="mode === 'edit' ? 'Edit Record' : 'Add Record'"
    :form-fields="formFields"
    :initial-data="initialData"
    :editable-fields="fields"
    :field-editor-enabled="true"
    :accent-color="color.name || color.val"
    primary-pane-label="Record"
    secondary-pane-label="Fields"
    :save-label="mode === 'edit' ? 'Save' : 'Add'"
    @close="$emit('close')"
    @save="$emit('save', $event)"
  >
    <template #footer-left>
      <template v-if="mode === 'edit'">
        <button class="btn btn-ghost" title="Copy as YAML" @click="$emit('copy')">
          Copy
        </button>
        <button class="btn btn-danger" title="Delete record" @click="$emit('delete')">
          Delete
        </button>
      </template>
    </template>
  </SchemaEditorModal>
</template>
