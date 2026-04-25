<script setup>
import { ref } from 'vue';

const props = defineProps({
  tags: {
    type: Array,
    default: () => [],
  },
  color: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['add', 'remove']);
const inputValue = ref('');

function commitTag() {
  const value = inputValue.value.trim().replace(/,/g, '');
  if (value) emit('add', value);
  inputValue.value = '';
}

function onKeydown(event) {
  if (event.key === 'Enter' || event.key === ',' || event.key === ' ') {
    event.preventDefault();
    commitTag();
    return;
  }

  if (event.key === 'Backspace' && !inputValue.value && props.tags.length) {
    emit('remove', props.tags.length - 1);
  }
}
</script>

<template>
  <div class="tag-editor">
    <span
      v-for="(tag, index) in tags"
      :key="`${tag}-${index}`"
      class="tpill"
      :style="{ background: color.dim, color: color.val }"
    >
      {{ tag }}
      <span class="tpill-x" @click="emit('remove', index)">×</span>
    </span>
    <input
      v-model="inputValue"
      type="text"
      class="tag-inp"
      placeholder="Type tag, press Enter…"
      @keydown="onKeydown"
      @blur="commitTag"
    />
  </div>
</template>
