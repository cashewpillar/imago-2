<template>
  <div class="list">
    <article v-for="entry in entries" :key="entry.id" class="item">
      <div>
        <h3>{{ entry.title }}</h3>
        <p>{{ entry.notes || 'No notes yet.' }}</p>
      </div>
      <BaseButton variant="ghost" @click="$emit('remove', entry.id)">Delete</BaseButton>
    </article>
  </div>
</template>

<script setup>
import BaseButton from '../../../shared/components/BaseButton.vue';

defineProps({
  entries: { type: Array, required: true },
});

defineEmits(['remove']);
</script>

<style scoped>
.list {
  display: grid;
  gap: 12px;
}

.item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: start;
  padding: 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--surface-strong);
}

.item h3,
.item p {
  margin: 0;
}

.item p {
  margin-top: 8px;
  color: var(--text-muted);
  line-height: 1.6;
}
</style>
