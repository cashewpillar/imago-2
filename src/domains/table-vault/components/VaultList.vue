<template>
  <div class="list">
    <button
      v-for="vault in vaults"
      :key="vault.id"
      class="item"
      :class="{ 'item--active': vault.id === selectedId }"
      type="button"
      @click="$emit('select', vault.id)"
    >
      <span class="item__title">{{ vault.icon }} {{ vault.name }}</span>
      <div class="item__tags">
        <ChipTag v-for="tag in vault.tags" :key="tag" :color="vault.color">{{ tag }}</ChipTag>
      </div>
    </button>
  </div>
</template>

<script setup>
import ChipTag from '../../../shared/components/ChipTag.vue';

defineProps({
  vaults: { type: Array, required: true },
  selectedId: { type: Number, default: null },
});

defineEmits(['select']);
</script>

<style scoped>
.list {
  display: grid;
  gap: 10px;
}

.item {
  text-align: left;
  padding: 14px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--surface-strong);
}

.item--active {
  border-color: var(--brand);
}

.item__title {
  display: block;
  font-family: var(--font-display);
  font-size: 1.2rem;
}

.item__tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}
</style>
