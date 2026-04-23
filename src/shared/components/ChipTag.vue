<template>
  <span class="chip" :style="toneStyle">
    <slot />
  </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  color: { type: String, default: 'var(--brand)' },
});

const toneStyle = computed(() => ({
  color: props.color,
  background: `color-mix(in srgb, ${props.color} 14%, white)`,
  borderColor: `color-mix(in srgb, ${props.color} 30%, transparent)`,
}));
</script>

<style scoped>
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid;
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 0.8rem;
  font-weight: 600;
}
</style>
