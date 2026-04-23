<template>
  <div class="day">
    <main class="day__app">
      <div class="day__header">
        <RouterLink to="/" class="day__back">← imago</RouterLink>
        <p class="day__title">a fraction of a day</p>
      </div>

      <section class="day__section">
        <DaySummary
          :day="currentDay"
          :available-hours="availableHours"
          @move="shiftDay"
          @add-day="addDay"
        />
      </section>

      <section class="day__section">
        <p class="day__label">blocks</p>
        <BlockComposer :categories="categories" @submit="handleSubmit" />
      </section>

      <section class="day__section">
        <BlockList :blocks="currentDay.blocks" @remove="removeBlock" />
      </section>
    </main>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router';
import { useDayPlanner } from '../useDayPlanner';
import DaySummary from '../components/DaySummary.vue';
import BlockComposer from '../components/BlockComposer.vue';
import BlockList from '../components/BlockList.vue';

const { categories, currentDay, availableHours, addBlock, removeBlock, shiftDay, addDay } =
  useDayPlanner();

function handleSubmit(draft) {
  addBlock(draft);
  draft.name = '';
  draft.category = 'maintain';
  draft.hours = 1;
}
</script>

<style scoped>
.day {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  background: #ffffff;
  color: #1a1a18;
}

.day__app {
  width: 100%;
  max-width: 390px;
  min-height: 100vh;
  padding: 1rem 1rem 2.5rem;
}

.day__header {
  margin-bottom: 1.25rem;
}

.day__back {
  text-decoration: none;
  color: #6b6b67;
  font-size: 12px;
}

.day__title {
  margin: 0.5rem 0 0;
  font-size: 18px;
  font-weight: 500;
}

.day__section + .day__section {
  margin-top: 1rem;
}

.day__label {
  margin: 0 0 0.6rem;
  font-size: 11px;
  color: #a0a09a;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.day :deep(.summary) {
  gap: 8px;
}

.day :deep(.summary button),
.day :deep(.summary__center),
.day :deep(.form input),
.day :deep(.form select),
.day :deep(.button--primary),
.day :deep(.item) {
  border-radius: 8px;
  border: 0.5px solid rgba(0, 0, 0, 0.3);
  background: #f5f5f3;
  box-shadow: none;
}

.day :deep(.summary__center) {
  background: #f5f5f3;
}

.day :deep(.summary__center span),
.day :deep(.item__meta) {
  color: #6b6b67;
}

.day :deep(.button--primary) {
  color: #1a1a18;
  padding: 10px 14px;
}

.day :deep(.list) {
  gap: 8px;
}

.day :deep(.item__title) {
  text-transform: none;
}
</style>
