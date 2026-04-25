<script setup>
import { computed } from 'vue';
import SchemaEditorModal from '../../../shared/components/SchemaEditorModal.vue';
import { getTableFormData } from '../../../shared/utils/tableVault';

const props = defineProps({
  open: { type: Boolean, default: false },
  mode: { type: String, default: 'create' },
  table: { type: Object, default: null },
  isLight: { type: Boolean, default: false },
  schema: { type: Array, default: () => [] },
  initialData: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['close', 'save']);

const formFields = computed(() => props.schema);

const initialData = computed(() => (props.table ? getTableFormData(props.table, props.schema) : props.initialData));

</script>

<template>
  <SchemaEditorModal
    :open="open"
    :title="mode === 'edit' ? 'Table Settings' : 'New Table'"
    :form-fields="formFields"
    :initial-data="initialData"
    :form-field-schema-editable="true"
    :field-editor-enabled="false"
    :is-light="isLight"
    primary-pane-label="Table"
    secondary-pane-label="Fields"
    :save-label="mode === 'edit' ? 'Save' : 'Create'"
    @close="$emit('close')"
    @save="$emit('save', $event)"
  />
</template>
