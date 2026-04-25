<script setup>
defineProps({
  icon: {
    type: String,
    default: '🗂️',
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <div class="empty-state">
    <div class="empty-icon">{{ icon }}</div>
    <h3>{{ title }}</h3>
    <p>{{ message }}</p>
  </div>
</template>
