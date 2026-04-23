<template>
  <div class="summary">
    <button type="button" @click="$emit('move', -1)">←</button>
    <div class="summary__center">
      <strong>{{ day.label }}</strong>
      <span>{{ day.date }} · {{ availableHours }}h awake</span>
    </div>
    <button type="button" @click="$emit('move', 1)">→</button>
    <button type="button" @click="$emit('add-day')">+ day</button>
  </div>
</template>

<script setup>
defineProps({
  day: { type: Object, required: true },
  availableHours: { type: Number, required: true },
});

defineEmits(['move', 'add-day']);
</script>

<style scoped>
.summary {
  display: flex;
  gap: 10px;
  align-items: center;
}

.summary button {
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface-strong);
  padding: 10px 14px;
}

.summary__center {
  flex: 1;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  background: var(--surface-strong);
  border: 1px solid var(--border);
}

.summary__center strong,
.summary__center span {
  display: block;
}

.summary__center span {
  margin-top: 4px;
  color: var(--text-muted);
}
</style>
