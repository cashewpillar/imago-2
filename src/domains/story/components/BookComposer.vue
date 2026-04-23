<template>
  <form class="form" @submit.prevent="$emit('submit', draft)">
    <label>
      <span>Title</span>
      <input v-model="draft.title" required />
    </label>
    <label>
      <span>Author</span>
      <input v-model="draft.author" required />
    </label>
    <BaseButton type="submit">Add book</BaseButton>
  </form>
</template>

<script setup>
import { reactive } from 'vue';
import BaseButton from '../../../shared/components/BaseButton.vue';

defineEmits(['submit']);

const draft = reactive({
  title: '',
  author: '',
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

input {
  width: 100%;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: white;
}
</style>
