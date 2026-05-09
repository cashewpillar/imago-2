<script setup>
import CommonplaceBottomNav from './CommonplaceBottomNav.vue';
import CommonplaceEmptyState from './CommonplaceEmptyState.vue';
import CommonplaceMediaCard from './CommonplaceMediaCard.vue';
import CommonplaceTopbar from './CommonplaceTopbar.vue';

defineProps({
  brandHtml: {
    type: String,
    default: '',
  },
  searchOpen: {
    type: Boolean,
    default: false,
  },
  searchValue: {
    type: String,
    default: '',
  },
  currentFilter: {
    type: String,
    default: 'all',
  },
  homeSections: {
    type: Array,
    required: true,
  },
  emptyStateHtml: {
    type: String,
    default: '',
  },
  activeTab: {
    type: String,
    required: true,
  },
});

defineEmits(['toggle-search', 'update:searchValue', 'set-filter', 'open-menu', 'open-media-editor', 'open-media', 'switch-tab']);
</script>

<template>
  <section class="view active">
    <CommonplaceTopbar :brand-html="brandHtml" home>
      <button class="btn ib" @click="$emit('toggle-search')"><span style="font-size:15px">○</span></button>
      <button class="btn ib" @click="$emit('open-menu')">⋯</button>
    </CommonplaceTopbar>
    <div class="search-wrap" :class="{ active: searchOpen }">
      <div class="search-inner">
        <span class="s-ico">○</span>
        <input
          :value="searchValue"
          placeholder="Search media, moments, tags…"
          @input="$emit('update:searchValue', $event.target.value)"
        >
      </div>
    </div>
    <div class="tabs">
      <button class="chip" :class="{ on: currentFilter === 'all' }" @click="$emit('set-filter', 'all')">All</button>
      <button class="chip" :class="{ on: currentFilter === 'book' }" @click="$emit('set-filter', 'book')">Books</button>
      <button class="chip" :class="{ on: currentFilter === 'film' }" @click="$emit('set-filter', 'film')">Films</button>
      <button class="chip" :class="{ on: currentFilter === 'tv' }" @click="$emit('set-filter', 'tv')">TV</button>
      <button class="chip" :class="{ on: currentFilter === 'other' }" @click="$emit('set-filter', 'other')">Other</button>
    </div>
    <div v-if="!homeSections.length" class="list">
      <CommonplaceEmptyState icon="◌" :html="emptyStateHtml" />
    </div>
    <div v-else class="list">
      <template v-for="section in homeSections" :key="section.title">
        <div class="sec-head" style="padding-top:10px;"><span class="sec-lbl">{{ section.title }}</span></div>
        <CommonplaceMediaCard
          v-for="item in section.items"
          :key="item.id"
          :item="item"
          @open="$emit('open-media', $event)"
        />
      </template>
    </div>
    <button class="fab" @click="$emit('open-media-editor')">+</button>
    <CommonplaceBottomNav :active-tab="activeTab" @switch="$emit('switch-tab', $event)" />
  </section>
</template>
