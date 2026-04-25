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
});

defineEmits(['close']);
</script>

<template>
  <div v-if="open" class="modal-backdrop open" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <div class="modal-title">{{ title }}</div>
        <button class="modal-close" @click="$emit('close')">✕</button>
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
