<template>
  <section class="card" :class="{ 'card--interactive': interactive }">
    <slot />
  </section>
</template>

<script setup>
defineProps({
  interactive: { type: Boolean, default: false },
});
</script>

<style scoped>
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  backdrop-filter: blur(18px);
  padding: 20px;
}

.card--interactive {
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.card--interactive:hover {
  transform: translateY(-2px);
  border-color: var(--border-strong);
}
</style>
