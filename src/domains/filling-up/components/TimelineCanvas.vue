<template>
  <div class="timeline">
    <div v-for="hour in hours" :key="hour" class="timeline__row">
      <div class="timeline__label">{{ formatHour(hour) }}</div>
      <div class="timeline__track">
        <div
          v-for="block in blocksForHour(hour)"
          :key="block.id"
          class="timeline__block"
          :style="{ borderColor: block.color, background: `${block.color}20` }"
        >
          <span>{{ block.name }}</span>
          <button type="button" @click="$emit('remove', block.id)">×</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  hours: { type: Array, required: true },
  blocks: { type: Array, required: true },
});

defineEmits(['remove']);

function formatHour(hour) {
  const suffix = hour >= 12 ? 'pm' : 'am';
  const base = hour % 12 || 12;
  return `${base}${suffix}`;
}

function blocksForHour(hour) {
  return props.blocks.filter((block) => hour >= block.start && hour < block.end);
}
</script>

<style scoped>
.timeline {
  display: grid;
  gap: 10px;
}

.timeline__row {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 12px;
  align-items: start;
}

.timeline__label {
  color: var(--text-muted);
  font-size: 0.85rem;
  padding-top: 10px;
}

.timeline__track {
  min-height: 48px;
  border: 1px dashed var(--border);
  border-radius: var(--radius-md);
  padding: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.timeline__block {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid;
}

.timeline__block button {
  border: 0;
  background: transparent;
  color: inherit;
  padding: 0;
}
</style>
