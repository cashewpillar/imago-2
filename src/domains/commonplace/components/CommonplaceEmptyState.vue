<script setup>
defineProps({
  icon: {
    type: String,
    required: true,
  },
  html: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <div class="empty">
    <div class="empty-ico">{{ icon }}</div>
    <p v-html="html"></p>
  </div>
</template>
