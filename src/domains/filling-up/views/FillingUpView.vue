<template>
  <div class="fill">
    <main class="fill__app">
      <div class="fill__header">
        <div>
          <RouterLink to="/" class="fill__back">← imago</RouterLink>
          <div class="fill__title">a fraction of a day</div>
          <div class="fill__sub">select then place on a lightweight timeline</div>
        </div>
      </div>

      <section class="fill__section">
        <TimelineComposer @submit="handleSubmit" />
      </section>

      <section class="fill__section">
        <TimelineCanvas :hours="hours" :blocks="timeline.blocks" @remove="removeBlock" />
      </section>
    </main>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router';
import { useTimelinePlanner } from '../useTimelinePlanner';
import TimelineComposer from '../components/TimelineComposer.vue';
import TimelineCanvas from '../components/TimelineCanvas.vue';

const { timeline, hours, addBlock, removeBlock } = useTimelinePlanner();

function handleSubmit(draft) {
  addBlock(draft);
  draft.name = '';
  draft.start = 9;
  draft.end = 10;
  draft.color = '#7c5cff';
}
</script>

<style scoped>
.fill {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  background: #ffffff;
}

.fill__app {
  width: 100%;
  max-width: 400px;
  min-height: 100vh;
  padding: 1.25rem 1rem 3rem;
}

.fill__back {
  text-decoration: none;
  color: #a0a09a;
  font-size: 12px;
}

.fill__title {
  margin-top: 0.5rem;
  font-size: 17px;
  font-weight: 500;
  color: #1a1a18;
}

.fill__sub {
  margin-top: 0.2rem;
  font-size: 12px;
  color: #a0a09a;
}

.fill__section + .fill__section {
  margin-top: 1rem;
}

.fill :deep(.form input),
.fill :deep(.button--primary) {
  border-radius: 8px;
  border: 0.5px solid rgba(0, 0, 0, 0.3);
  background: transparent;
  color: #1a1a18;
  box-shadow: none;
}

.fill :deep(.button--primary) {
  padding: 10px 12px;
}

.fill :deep(.timeline) {
  gap: 6px;
}

.fill :deep(.timeline__row) {
  grid-template-columns: 40px 1fr;
  gap: 8px;
}

.fill :deep(.timeline__label) {
  font-size: 10px;
  color: #a0a09a;
}

.fill :deep(.timeline__track) {
  min-height: 42px;
  border-radius: 10px;
  border: 0.5px solid rgba(0, 0, 0, 0.15);
  background: #f5f5f3;
}

.fill :deep(.timeline__block) {
  border-radius: 6px;
  padding: 6px 8px;
}
</style>
