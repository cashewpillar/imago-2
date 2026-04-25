<script setup>
defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 }),
  },
  items: {
    type: Array,
    default: () => [],
  },
});

defineEmits(['select', 'close']);
</script>

<template>
  <div v-if="open" class="ctx-menu ctx-menu-open" :style="{ left: `${position.x}px`, top: `${position.y}px`, display: 'block' }">
    <template v-for="(item, index) in items" :key="index">
      <div v-if="item.sep" class="ctx-sep" />
      <div
        v-else
        class="ctx-item"
        :class="{ danger: item.danger }"
        @click="$emit('select', item)"
      >
        {{ item.label }}
      </div>
    </template>
  </div>
</template>
