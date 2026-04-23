<template>
  <div class="notes">
    <article v-for="note in notes" :key="note.id" class="note">
      <p class="note__quote">“{{ note.quote }}”</p>
      <p v-if="note.reflection" class="note__copy">{{ note.reflection }}</p>
      <div class="note__meta">
        <ChipTag :color="stanceColor(note.stance)">{{ note.stance }}</ChipTag>
        <ChipTag v-for="tag in note.tags" :key="tag">{{ tag }}</ChipTag>
      </div>
    </article>
  </div>
</template>

<script setup>
import ChipTag from '../../../shared/components/ChipTag.vue';

const props = defineProps({
  notes: { type: Array, required: true },
  stances: { type: Array, required: true },
});

function stanceColor(value) {
  return props.stances.find((option) => option.value === value)?.color ?? 'var(--brand)';
}
</script>

<style scoped>
.notes {
  display: grid;
  gap: 14px;
}

.note {
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-strong);
}

.note__quote {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.15rem;
  line-height: 1.5;
}

.note__copy {
  margin: 10px 0 0;
  color: var(--text-muted);
  line-height: 1.6;
}

.note__meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
}
</style>
