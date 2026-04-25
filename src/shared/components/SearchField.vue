<script setup>
defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Search…',
  },
});

defineEmits(['update:modelValue']);
</script>

<template>
  <div class="search-wrap">
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" stroke-width="1.3" />
      <path d="M9 9l2.5 2.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
    </svg>
    <input
      :value="modelValue"
      class="search-input"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  </div>
</template>
