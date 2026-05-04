<script setup>
defineProps({
  items: {
    type: Array,
    required: true,
  },
  activeKey: {
    type: String,
    default: null,
  },
  compact: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['toggle']);
</script>

<template>
  <div class="tag-row" :class="{ compact }">
    <button
      v-for="item in items"
      :key="item.key"
      class="chip chip-t"
      :class="{ on: activeKey === item.key }"
      @click="$emit('toggle', item.key)"
    >
      {{ item.label }} <span style="opacity:0.5;margin-left:2px">{{ item.count }}</span>
    </button>
  </div>
</template>
