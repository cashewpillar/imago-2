<script setup>
import CommonplaceBottomNav from './CommonplaceBottomNav.vue';
import CommonplaceEmptyState from './CommonplaceEmptyState.vue';
import CommonplaceJumpCard from './CommonplaceJumpCard.vue';
import CommonplaceTopbar from './CommonplaceTopbar.vue';

defineProps({
  brandHtml: {
    type: String,
    default: '',
  },
  connectionGroups: {
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

defineEmits(['open-menu', 'switch-tab', 'open-moment']);
</script>

<template>
  <section class="view active">
    <CommonplaceTopbar :brand-html="brandHtml">
      <button class="btn ib" @click="$emit('open-menu')">⋯</button>
    </CommonplaceTopbar>
    <div class="pg-head"><div class="pg-h">Your <em>connections</em></div></div>
    <div v-if="!connectionGroups.length" class="list">
      <CommonplaceEmptyState icon="◇" :html="emptyStateHtml" />
    </div>
    <div v-else class="list">
      <div v-for="group in connectionGroups" :key="group.label" class="cg">
        <div class="cg-lbl">{{ group.label }}</div>
        <CommonplaceJumpCard
          v-for="item in group.items"
          :key="`${item.id}-${item.toText}`"
          :item="item"
          @open="$emit('open-moment', $event)"
        />
      </div>
    </div>
    <CommonplaceBottomNav :active-tab="activeTab" @switch="$emit('switch-tab', $event)" />
  </section>
</template>
