<script setup>
defineProps({
  as: {
    type: String,
    default: 'div',
  },
  interactive: {
    type: Boolean,
    default: false,
  },
});
</script>

<template>
  <component :is="as" :class="interactive ? 'table-card' : 'rec-card'">
    <slot />
  </component>
</template>
