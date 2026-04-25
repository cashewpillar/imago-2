<script setup>
defineProps({
  table: {
    type: Object,
    required: true,
  },
  color: {
    type: Object,
    required: true,
  },
});

defineEmits(['open', 'menu']);
</script>

<template>
  <div class="table-card" @click="$emit('open', table)">
    <div class="tc-stripe" :style="{ background: color.val }" />
    <div class="tc-icon">{{ table.icon || '📋' }}</div>
    <div class="tc-name">{{ table.name }}</div>
    <div v-if="table.tags?.length" class="tc-tags">
      <span
        v-for="tag in table.tags"
        :key="tag"
        class="tc-tag"
        :style="{ background: color.dim, color: color.val }"
      >
        {{ tag }}
      </span>
    </div>
    <div class="tc-footer">
      <span class="tc-count" :style="{ background: color.dim, color: color.val }">
        {{ table._count }} record{{ table._count !== 1 ? 's' : '' }}
      </span>
      <button class="tc-menu" @click.stop="$emit('menu', $event, table)">⋮</button>
    </div>
  </div>
</template>
