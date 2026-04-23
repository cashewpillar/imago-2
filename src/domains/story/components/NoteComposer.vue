<template>
  <form class="form" @submit.prevent="$emit('submit', draft)">
    <label>
      <span>Highlight</span>
      <textarea v-model="draft.quote" rows="4" required></textarea>
    </label>
    <label>
      <span>Reflection</span>
      <textarea v-model="draft.reflection" rows="3"></textarea>
    </label>
    <label>
      <span>Stance</span>
      <select v-model="draft.stance">
        <option v-for="option in stances" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </label>
    <label>
      <span>Tags</span>
      <input v-model="draft.tags" placeholder="voice, structure, image" />
    </label>
    <BaseButton type="submit">Save note</BaseButton>
  </form>
</template>

<script setup>
import { reactive } from 'vue';
import BaseButton from '../../../shared/components/BaseButton.vue';

defineProps({
  stances: { type: Array, required: true },
});

defineEmits(['submit']);

const draft = reactive({
  quote: '',
  reflection: '',
  stance: 'yes',
  tags: '',
});
</script>

<style scoped>
.form {
  display: grid;
  gap: 12px;
}

label span {
  display: block;
  margin-bottom: 6px;
  font-size: 0.85rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

textarea,
input,
select {
  width: 100%;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: white;
}
</style>
