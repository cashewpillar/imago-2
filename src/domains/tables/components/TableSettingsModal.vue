<script setup>
import { computed, reactive, watch } from 'vue';
import BaseModal from '../../../shared/components/BaseModal.vue';
import ColorPicker from '../../../shared/components/ColorPicker.vue';
import TagEditor from '../../../shared/components/TagEditor.vue';
import { getColor } from '../../../shared/utils/color';

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  table: {
    type: Object,
    default: null,
  },
  isLight: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'save', 'export', 'delete']);

const form = reactive({
  name: '',
  icon: '',
  color: 'Lime',
  tags: [],
});

const editorColor = computed(() => getColor(form.color, props.isLight));

watch(
  () => [props.open, props.table],
  () => {
    if (!props.open || !props.table) return;
    form.name = props.table.name || '';
    form.icon = props.table.icon || '';
    form.color = props.table.color || 'Lime';
    form.tags = [...(props.table.tags || [])];
  },
  { immediate: true },
);

function addTag(tag) {
  if (!form.tags.includes(tag)) form.tags.push(tag);
}

function removeTag(index) {
  form.tags.splice(index, 1);
}

function submit() {
  emit('save', {
    name: form.name.trim(),
    icon: form.icon.trim(),
    color: form.color,
    tags: [...form.tags],
  });
}
</script>

<template>
  <BaseModal :open="open" title="Table Settings" @close="$emit('close')">
    <div class="fg">
      <label class="flabel">Name</label>
      <input v-model="form.name" class="finput" maxlength="40" />
    </div>
    <div style="display:flex;gap:12px;">
      <div class="fg" style="flex:0 0 auto;">
        <label class="flabel">Icon</label>
        <input v-model="form.icon" class="finput" maxlength="4" style="font-size:20px;width:58px;text-align:center;" />
      </div>
      <div class="fg" style="flex:1;">
        <label class="flabel">Color</label>
        <ColorPicker v-model="form.color" :is-light="isLight" />
      </div>
    </div>
    <div class="fg">
      <label class="flabel">Tags</label>
      <TagEditor :tags="form.tags" :color="editorColor" @add="addTag" @remove="removeTag" />
    </div>
    <div style="padding-top:12px;border-top:1px solid var(--border);display:flex;gap:8px;">
      <button class="btn btn-ghost" style="flex:1;" @click="$emit('export')">Export Table</button>
      <button class="btn btn-danger" style="flex:1;" @click="$emit('delete')">Delete Table</button>
    </div>

    <template #footer>
      <button class="btn btn-ghost" @click="$emit('close')">Cancel</button>
      <button class="btn btn-primary" @click="submit">Save</button>
    </template>
  </BaseModal>
</template>
