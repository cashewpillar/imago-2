<script setup>
import SearchField from './SearchField.vue';

defineProps({
  title: {
    type: String,
    default: '',
  },
  showLogo: {
    type: Boolean,
    default: false,
  },
  showBack: {
    type: Boolean,
    default: false,
  },
  searchOpen: {
    type: Boolean,
    default: false,
  },
  searchValue: {
    type: String,
    default: '',
  },
  searchPlaceholder: {
    type: String,
    default: 'Search…',
  },
});

defineEmits(['back', 'toggle-search', 'update:searchValue']);
</script>

<template>
  <div class="topbar">
    <button v-if="showBack" class="back-btn" @click="$emit('back')">
      <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
        <path d="M6 1L1 6l5 5M1 6h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <div v-if="showLogo" class="logo">Table<span style="color:var(--text);">Vault</span></div>
    <div v-else class="topbar-title">{{ title }}</div>

    <div class="topbar-search" :class="{ open: searchOpen }">
      <SearchField
        :model-value="searchValue"
        :placeholder="searchPlaceholder"
        @update:model-value="$emit('update:searchValue', $event)"
      />
    </div>

    <div class="topbar-actions">
      <slot name="actions" :search-open="searchOpen" :toggle-search="() => $emit('toggle-search')" />
    </div>
  </div>
</template>
