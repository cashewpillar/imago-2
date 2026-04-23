<template>
  <button class="button" :class="[`button--${variant}`]">
    <slot />
  </button>
</template>

<script setup>
defineProps({
  variant: { type: String, default: 'primary' },
});
</script>

<style scoped>
.button {
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 10px 16px;
  transition: transform 0.12s ease, opacity 0.12s ease, border-color 0.12s ease;
}

.button:hover {
  transform: translateY(-1px);
}

.button--primary {
  background: var(--text);
  color: white;
}

.button--secondary {
  background: var(--surface-strong);
  color: var(--text);
  border-color: var(--border);
}

.button--ghost {
  background: transparent;
  color: var(--text-muted);
  border-color: var(--border);
}
</style>
