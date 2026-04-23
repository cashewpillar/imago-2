<template>
  <form class="form" @submit.prevent="$emit('submit', draft)">
    <input v-model="draft.title" placeholder="title" required />
    <textarea v-model="draft.notes" rows="4" placeholder="notes"></textarea>
    <BaseButton type="submit">Add record</BaseButton>
  </form>
</template>

<script setup>
import { reactive } from 'vue';
import BaseButton from '../../../shared/components/BaseButton.vue';

defineEmits(['submit']);

const draft = reactive({
  title: '',
  notes: '',
});
</script>

<style scoped>
.form {
  display: grid;
  gap: 12px;
}

.form input,
.form textarea {
  width: 100%;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: white;
}
</style>
