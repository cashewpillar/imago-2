<script setup>
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
import SearchField from './SearchField.vue';
import ContextMenu from './ContextMenu.vue';

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
  showHome: {
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
  menuItems: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['back', 'toggle-search', 'update:searchValue', 'menu-select']);

const menuOpen = ref(false);
const menuPos = ref({ x: 0, y: 0 });

const toggleMenu = (e) => {
  const rect = e.currentTarget.getBoundingClientRect();
  menuPos.value = { x: rect.right, y: rect.bottom + 5 };
  menuOpen.value = !menuOpen.value;
};

const handleSelect = (item) => {
  menuOpen.value = false;
  if (item.action) item.action();
  emit('menu-select', item);
};
</script>

<template>
  <div class="topbar">
    <RouterLink v-if="showHome" to="/" class="home-btn" title="Back to Home">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    </RouterLink>

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
      
      <button 
        v-if="menuItems.length" 
        class="btn btn-ghost btn-icon" 
        title="Settings"
        @click="toggleMenu"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <g stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 8.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 0 0 0-7z"/>
            <path d="
              M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3
              1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1
              a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2
              a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0
              a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.8-.3l.1-.1
              a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0c.2.6.8 1 1.5 1H21a2 2 0 1 1 0 4h-.2
              a1.7 1.7 0 0 0-1.5 1z
            "/>
          </g>
        </svg>
      </button>

      <ContextMenu
        :open="menuOpen"
        :position="menuPos"
        :items="menuItems"
        @close="menuOpen = false"
        @select="handleSelect"
      />
    </div>
  </div>
</template>
