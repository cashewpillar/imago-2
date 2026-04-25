<script setup>
import { COLORS } from '../constants/tableVault';
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: 'Lime',
  },
  isLight: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

const swatches = computed(() =>
  COLORS.map((color) => ({
    ...color,
    preview: props.isLight ? color.lightVal : color.val,
  })),
);
</script>

<template>
  <div class="cp">
    <div
      v-for="swatch in swatches"
      :key="swatch.name"
      class="cswatch"
      :title="swatch.name"
      :style="{
        background: swatch.preview,
        borderColor: swatch.name === modelValue ? swatch.preview : 'transparent',
        transform: swatch.name === modelValue ? 'scale(1.2)' : 'scale(1)',
      }"
      @click="emit('update:modelValue', swatch.name)"
    />
  </div>
</template>
