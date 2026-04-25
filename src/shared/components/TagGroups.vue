<script setup>
defineProps({
  groups: {
    type: Array,
    default: () => [],
  },
  activeTags: {
    type: Array,
    default: () => [],
  },
  color: {
    type: Object,
    required: true,
  },
});

defineEmits(['toggle']);
</script>

<template>
  <div v-if="groups.length" class="tag-row">
    <div v-for="group in groups" :key="group.label" class="tag-group">
      <div class="tag-group-label">{{ group.label }}</div>
      <div class="tag-group-chips">
        <div
          v-for="tag in group.tags"
          :key="tag"
          class="tag-chip"
          :class="{ active: activeTags.includes(tag) }"
          :style="activeTags.includes(tag) ? { background: color.val, borderColor: color.val } : undefined"
          @click="$emit('toggle', tag)"
        >
          {{ tag }}
        </div>
      </div>
    </div>
  </div>
</template>
