<script setup>
import { computed } from 'vue';
import { getTableMetaGroups } from '../../../shared/utils/tableVault';

const props = defineProps({
  table: {
    type: Object,
    required: true,
  },
  color: {
    type: Object,
    required: true,
  },
  metaSchema: {
    type: Array,
    default: () => [],
  },
});

defineEmits(['open']);

const metaGroups = computed(() => getTableMetaGroups(props.metaSchema, props.table));
</script>

<template>
  <div class="table-card" @click="$emit('open', table)">
    <div class="tc-stripe" :style="{ background: color.val }" />
    <div class="tc-icon">{{ table.icon || '📋' }}</div>
    <div class="tc-name">{{ table.name }}</div>
    <div v-if="metaGroups.length" class="tc-tags">
      <span
        v-for="group in metaGroups"
        :key="group.key"
      >
        <span
          v-for="value in group.values"
          :key="`${group.key}-${value}`"
          class="tc-tag"
          :style="{ background: color.dim, color: color.val }"
        >
          {{ value }}
        </span>
      </span>
    </div>
    <div class="tc-footer">
      <span class="tc-count" :style="{ background: color.dim, color: color.val }">
        {{ table._count }} record{{ table._count !== 1 ? 's' : '' }}
      </span>
    </div>
  </div>
</template>
