<script setup>
const props = defineProps({
  groups: {
    type: Array,
    default: () => [],
  },
  activeFilters: {
    type: Object,
    default: () => ({}),
  },
  color: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['toggle']);

function isActive(groupKey, tag) {
  return (props.activeFilters?.[groupKey] || []).includes(tag.value);
}

function handleToggle(group, tag) {
  emit('toggle', { groupKey: group.key, tag: tag.value, type: group.type });
}
</script>

<template>
  <div v-if="groups.length" class="tag-row">
    <div v-for="group in groups" :key="group.key || group.label" class="tag-group">
      <div class="tag-group-label">{{ group.label }}</div>
      <div class="tag-group-chips">
        <div
          v-for="tag in group.tags"
          :key="`${group.key}:${tag.value}`"
          class="tag-chip"
          :class="{ active: isActive(group.key, tag) }"
          :style="isActive(group.key, tag) ? { background: color.val, borderColor: color.val } : undefined"
          @click="handleToggle(group, tag)"
        >
          {{ tag.label }}
        </div>
      </div>
    </div>
  </div>
</template>
