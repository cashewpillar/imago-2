<template>
  <div class="empty">
    <p class="empty__title">{{ title }}</p>
    <p class="empty__copy">{{ copy }}</p>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  copy: { type: String, required: true },
});
</script>

<style scoped>
.empty {
  padding: 28px;
  text-align: center;
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-md);
  color: var(--text-muted);
}

.empty__title {
  margin: 0 0 8px;
  font-size: 1rem;
  color: var(--text);
}

.empty__copy {
  margin: 0;
  line-height: 1.6;
}
</style>
