<script setup>
defineProps({
  activeTab: {
    type: String,
    required: true,
  },
});

defineEmits(['switch']);

const items = [
  { key: 'home', icon: '◎', label: 'Library' },
  { key: 'tags', icon: '◈', label: 'Tags' },
  { key: 'connections', icon: '◇', label: 'Connections' },
];
</script>

<template>
  <div class="bnav">
    <button
      v-for="item in items"
      :key="item.key"
      class="nt"
      :class="{ on: activeTab === item.key }"
      @click="$emit('switch', item.key)"
    >
      <span class="nt-ico">{{ item.icon }}</span>{{ item.label }}
    </button>
  </div>
</template>
