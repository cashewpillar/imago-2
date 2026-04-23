<template>
  <header class="header">
    <div>
      <RouterLink v-if="backTo" :to="backTo" class="header__back">{{ backLabel }}</RouterLink>
      <p v-if="eyebrow" class="header__eyebrow">{{ eyebrow }}</p>
      <h1 class="header__title">{{ title }}</h1>
      <p v-if="subtitle" class="header__subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup>
import { RouterLink } from 'vue-router';

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  eyebrow: { type: String, default: '' },
  backTo: { type: [String, Object], default: '' },
  backLabel: { type: String, default: 'Back' },
});
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header__back,
.header__eyebrow {
  display: inline-block;
  margin: 0 0 8px;
  color: var(--text-muted);
  font-size: 0.82rem;
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.header__title {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.4rem);
  font-family: var(--font-display);
  line-height: 0.95;
}

.header__subtitle {
  max-width: 54ch;
  margin: 12px 0 0;
  color: var(--text-muted);
  line-height: 1.6;
}

.header__actions {
  display: flex;
  gap: 12px;
  align-items: center;
}
</style>
