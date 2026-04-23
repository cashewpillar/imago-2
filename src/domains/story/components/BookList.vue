<template>
  <div class="list">
    <button
      v-for="book in books"
      :key="book.id"
      class="item"
      :class="{ 'item--active': book.id === selectedId }"
      type="button"
      @click="$emit('select', book.id)"
    >
      <span class="item__title">{{ book.title }}</span>
      <span class="item__meta">{{ book.author }} · {{ book.notes.length }} notes</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  books: { type: Array, required: true },
  selectedId: { type: String, default: null },
});

defineEmits(['select']);
</script>

<style scoped>
.list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item {
  width: 100%;
  text-align: left;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--surface-strong);
}

.item--active {
  border-color: var(--brand);
  background: color-mix(in srgb, var(--brand) 8%, white);
}

.item__title,
.item__meta {
  display: block;
}

.item__title {
  font-family: var(--font-display);
  font-size: 1.2rem;
}

.item__meta {
  margin-top: 4px;
  color: var(--text-muted);
}
</style>
