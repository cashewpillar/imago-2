<script setup>
defineProps({
  item: {
    type: Object,
    required: true,
  },
});

defineEmits(['open']);
</script>

<template>
  <div class="ci" @click="$emit('open', item.id)">
    <div class="ci-top">
      <span class="ci-anch">{{ item.anchor || '—' }}</span>
      <span class="ci-title">{{ item.title }}</span>
    </div>
    <div v-if="item.preview" class="ci-preview">"{{ item.preview }}"</div>
    <div v-if="item.toText" class="ci-to">
      <span class="rel-badge">{{ item.badge }}</span>
      <span>{{ item.toText }}</span>
    </div>
  </div>
</template>
