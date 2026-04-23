<template>
  <form class="form" @submit.prevent="$emit('submit', draft)">
    <input v-model="draft.name" placeholder="block name" required />
    <select v-model="draft.category">
      <option v-for="category in categories" :key="category" :value="category">
        {{ category }}
      </option>
    </select>
    <input v-model.number="draft.hours" min="0.5" step="0.5" type="number" placeholder="hours" required />
    <BaseButton type="submit">Add block</BaseButton>
  </form>
</template>

<script setup>
import { reactive } from 'vue';
import BaseButton from '../../../shared/components/BaseButton.vue';

defineProps({
  categories: { type: Array, required: true },
});

defineEmits(['submit']);

const draft = reactive({
  name: '',
  category: 'maintain',
  hours: 1,
});
</script>

<style scoped>
.form {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.form input,
.form select {
  min-width: 0;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: white;
  padding: 10px 14px;
}
</style>
