<script setup>
import CommonplaceBottomNav from './CommonplaceBottomNav.vue';
import CommonplaceEmptyState from './CommonplaceEmptyState.vue';
import CommonplaceJumpCard from './CommonplaceJumpCard.vue';
import CommonplaceTagChips from './CommonplaceTagChips.vue';
import CommonplaceTopbar from './CommonplaceTopbar.vue';

defineProps({
  brandHtml: {
    type: String,
    default: '',
  },
  homeTags: {
    type: Array,
    required: true,
  },
  activeTag: {
    type: String,
    default: null,
  },
  tagGroups: {
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

defineEmits(['open-menu', 'switch-tab', 'open-moment', 'toggle-tag']);
</script>

<template>
  <section class="view active">
    <CommonplaceTopbar :brand-html="brandHtml" home>
      <button class="btn ib" @click="$emit('open-menu')">⋯</button>
    </CommonplaceTopbar>
    <div class="pg-head"><div class="pg-h">Your <em>tags</em></div></div>
    <CommonplaceTagChips :items="homeTags" :active-key="activeTag" @toggle="$emit('toggle-tag', $event)" />
    <div v-if="!tagGroups.length" class="list">
      <CommonplaceEmptyState icon="◈" :html="emptyStateHtml" />
    </div>
    <div v-else class="list">
      <div v-for="group in tagGroups" :key="group.tag" class="cg">
        <div class="cg-lbl">{{ group.tag === 'Untagged' ? '' : '#' }}{{ group.tag }} · {{ group.count }} {{ group.count === 1 ? 'moment' : 'moments' }}</div>
        <CommonplaceJumpCard
          v-for="item in group.items"
          :key="item.id"
          :item="item"
          @open="$emit('open-moment', $event)"
        />
      </div>
    </div>
    <CommonplaceBottomNav :active-tab="activeTab" @switch="$emit('switch-tab', $event)" />
  </section>
</template>
