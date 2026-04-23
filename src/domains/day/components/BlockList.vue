<template>
  <div class="list">
    <article v-for="block in blocks" :key="block.id" class="item">
      <div>
        <p class="item__title">{{ block.name }}</p>
        <p class="item__meta">{{ block.category }} · {{ block.hours }}h</p>
      </div>
      <BaseButton variant="ghost" @click="$emit('remove', block.id)">Remove</BaseButton>
    </article>
  </div>
</template>

<script setup>
import BaseButton from '../../../shared/components/BaseButton.vue';

defineProps({
  blocks: { type: Array, required: true },
});

defineEmits(['remove']);
</script>

<style scoped>
.list {
  display: grid;
  gap: 10px;
}

.item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  background: var(--surface-strong);
  border: 1px solid var(--border);
}

.item__title,
.item__meta {
  margin: 0;
}

.item__title {
  text-transform: capitalize;
}

.item__meta {
  margin-top: 4px;
  color: var(--text-muted);
}
</style>
