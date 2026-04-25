<script setup>
defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    required: true,
  },
  wide: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['close']);
</script>

<template>
  <div v-if="open" class="modal-backdrop open" @click.self="$emit('close')">
    <div class="modal" :class="{ 'modal-wide': wide }">
      <div class="modal-header">
        <div class="modal-title">{{ title }}</div>
        <div class="modal-header-actions">
          <slot name="header-actions" />
          <button class="modal-close" @click="$emit('close')">✕</button>
        </div>
      </div>
      <div class="modal-body">
        <slot />
      </div>
      <div class="modal-footer">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>
