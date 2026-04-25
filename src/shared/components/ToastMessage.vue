<script setup>
defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'success',
  },
});
</script>

<template>
  <div id="toast" :class="{ show: open }">
    <div class="tdot" :style="{ background: type === 'success' ? '#57e5a0' : '#ff5c5c' }" />
    <span>{{ message }}</span>
  </div>
</template>
