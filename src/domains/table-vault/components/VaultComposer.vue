<template>
  <form class="form" @submit.prevent="$emit('submit', draft)">
    <input v-model="draft.name" placeholder="table name" required />
    <input v-model="draft.icon" maxlength="2" placeholder="📋" />
    <input v-model="draft.color" type="color" />
    <input v-model="draft.tags" placeholder="tags, comma separated" />
    <BaseButton type="submit">Create table</BaseButton>
  </form>
</template>

<script setup>
import { reactive } from 'vue';
import BaseButton from '../../../shared/components/BaseButton.vue';

defineEmits(['submit']);

const draft = reactive({
  name: '',
  icon: '📋',
  color: '#237eae',
  tags: '',
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
