<template>
  <form class="form" @submit.prevent="$emit('submit', draft)">
    <input v-model="draft.name" placeholder="activity" required />
    <input v-model.number="draft.start" type="number" min="0" max="24" step="0.5" required />
    <input v-model.number="draft.end" type="number" min="0" max="24" step="0.5" required />
    <input v-model="draft.color" type="color" />
    <BaseButton type="submit">Add block</BaseButton>
  </form>
</template>

<script setup>
import { reactive } from 'vue';
import BaseButton from '../../../shared/components/BaseButton.vue';

defineEmits(['submit']);

const draft = reactive({
  name: '',
  start: 9,
  end: 10,
  color: '#7c5cff',
});
</script>

<style scoped>
.form {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.form input {
  border-radius: 999px;
  border: 1px solid var(--border);
  background: white;
  padding: 10px 14px;
}
</style>
