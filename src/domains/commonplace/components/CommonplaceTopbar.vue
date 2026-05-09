<script setup>
import { RouterLink } from 'vue-router';

defineProps({
  brandHtml: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  meta: {
    type: String,
    default: '',
  },
  back: {
    type: Boolean,
    default: false,
  },
  home: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['back']);
</script>

<template>
  <div class="tb">
    <RouterLink v-if="home" to="/" class="btn ib home-btn">⌂</RouterLink>
    <button v-if="back" class="btn ib" @click="$emit('back')">←</button>
    <div v-if="brandHtml" class="tb-brand" v-html="brandHtml" />
    <span v-else class="tb-lbl">{{ label }}</span>
    <span v-if="meta" class="tb-meta">{{ meta }}</span>
    <slot />
  </div>
</template>
