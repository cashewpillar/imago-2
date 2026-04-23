<template>
  <div class="grid">
    <RouterLink
      v-for="app in apps"
      :key="app.slug"
      :to="app.route"
      class="tile"
      :style="{ '--tile-accent': app.accent }"
    >
      <p class="tile__title">{{ app.title }}</p>
      <p class="tile__copy">{{ app.description }}</p>
    </RouterLink>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router';

defineProps({
  apps: { type: Array, required: true },
});
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.tile {
  display: block;
  padding: 22px;
  border-radius: var(--radius-lg);
  text-decoration: none;
  background:
    linear-gradient(160deg, color-mix(in srgb, var(--tile-accent) 18%, white) 0%, rgba(255, 255, 255, 0.55) 100%);
  border: 1px solid color-mix(in srgb, var(--tile-accent) 22%, transparent);
  min-height: 180px;
  box-shadow: var(--shadow);
  transition: transform 0.15s ease;
}

.tile:hover {
  transform: translateY(-2px) rotate(-0.3deg);
}

.tile__title {
  margin: 0 0 10px;
  font-family: var(--font-display);
  font-size: 1.6rem;
}

.tile__copy {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.6;
}
</style>
