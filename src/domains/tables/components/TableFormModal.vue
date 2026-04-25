<script setup>
import { reactive, watch } from 'vue';
import BaseModal from '../../../shared/components/BaseModal.vue';
import ColorPicker from '../../../shared/components/ColorPicker.vue';

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  isLight: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'save']);

const form = reactive({
  name: '',
  icon: '',
  color: 'Lime',
});

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return;
    form.name = '';
    form.icon = '';
    form.color = 'Lime';
  },
);

function submit() {
  emit('save', {
    name: form.name.trim(),
    icon: form.icon.trim(),
    color: form.color,
  });
}
</script>

<template>
  <BaseModal :open="open" title="New Table" @close="$emit('close')">
    <div class="fg">
      <label class="flabel">Name</label>
      <input v-model="form.name" class="finput" maxlength="40" placeholder="e.g. Fitness Goals, Book List…" />
    </div>
    <div style="display:flex;gap:12px;">
      <div class="fg" style="flex:0 0 auto;">
        <label class="flabel">Icon</label>
        <input v-model="form.icon" class="finput" maxlength="4" placeholder="📋" style="font-size:20px;width:58px;text-align:center;" />
      </div>
      <div class="fg" style="flex:1;">
        <label class="flabel">Color</label>
        <ColorPicker v-model="form.color" :is-light="isLight" />
      </div>
    </div>

    <template #footer>
      <button class="btn btn-ghost" @click="$emit('close')">Cancel</button>
      <button class="btn btn-primary" @click="submit">Create</button>
    </template>
  </BaseModal>
</template>
