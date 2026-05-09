<script setup>
import { RouterLink } from 'vue-router';

defineProps({
  title: {
    type: String,
    required: true,
  },
  meta: {
    type: String,
    default: '',
  },
});
</script>

<template>
  <div class="al-screen">
    <div class="al-shell">
      <header class="al-header">
        <div class="al-header-top">
          <div>
            <RouterLink to="/" class="al-home-link">⌂</RouterLink>
            <div class="al-label">exploited</div>
            <div class="al-title">{{ title }}</div>
            <div class="al-meta">{{ meta }}</div>
          </div>

          <div class="al-header-actions">
            <slot name="header-actions" />
          </div>
        </div>

        <nav class="al-nav">
          <RouterLink class="al-nav-link" :to="{ name: 'afterlight-log' }">↳ log</RouterLink>
          <RouterLink class="al-nav-link" :to="{ name: 'afterlight-overview' }">↳ overview</RouterLink>
          <RouterLink class="al-nav-link" :to="{ name: 'afterlight-charts' }">↳ charts</RouterLink>
        </nav>
      </header>

      <main class="al-main">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
@import '../styles/afterlight.css';
</style>
