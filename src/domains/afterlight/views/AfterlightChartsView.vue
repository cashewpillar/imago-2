<script setup>
import { computed, onMounted, ref } from 'vue';
import AfterlightShell from '../components/AfterlightShell.vue';
import { getAfterlightWorkspace } from '../services/afterlightDb';
import {
  countMinuteBuckets,
  filterEntriesByRange,
  formatDuration,
  formatRangeLabel,
  getEntryTime,
  getTrendOutlier,
  sumMinutesByMulti,
  sumMinutesBySingle,
  sumMinutesOverTime,
} from '../services/afterlightAnalytics';

const selectedRange = ref(30);
const entries = ref([]);

const rangeOptions = [
  { label: 'last 7 days', value: 7 },
  { label: 'last 30 days', value: 30 },
  { label: 'last 90 days', value: 90 },
  { label: 'all time', value: 0 },
];

const filteredEntries = computed(() =>
  filterEntriesByRange(entries.value, selectedRange.value).sort((a, b) => getEntryTime(b) - getEntryTime(a)),
);

const minutesByTrigger = computed(() => sumMinutesByMulti(filteredEntries.value, 'action'));
const minutesByTime = computed(() => sumMinutesBySingle(filteredEntries.value, 'time'));
const minuteBuckets = computed(() => countMinuteBuckets(filteredEntries.value));
const minuteTrend = computed(() => sumMinutesOverTime(filteredEntries.value));
const headerMeta = computed(() => formatRangeLabel(filteredEntries.value));

function renderBars(items, fillClass, formatter = (value) => value) {
  if (!items.length) return [];
  const max = Math.max(...items.map(([, value]) => value), 1);
  return items.map(([name, value]) => ({
    name,
    value,
    formatted: formatter(value),
    width: Math.round((value / max) * 100),
    fillClass,
  }));
}

const chartModel = computed(() => {
  const outlier = getTrendOutlier(minuteTrend.value);
  const points = outlier ? minuteTrend.value.filter((item) => item !== outlier) : minuteTrend.value;
  if (!points.length) return { points: [], path: '', labels: [], yTicks: [], note: outlier };

  const width = 640;
  const height = 220;
  const left = 16;
  const right = 16;
  const top = 16;
  const bottom = 34;
  const innerWidth = width - left - right;
  const innerHeight = height - top - bottom;
  const maxValue = Math.max(...points.map((item) => item.value), 1);
  const step = points.length > 1 ? innerWidth / (points.length - 1) : 0;
  const mappedPoints = points.map((point, index) => ({
    ...point,
    x: left + index * step,
    y: top + innerHeight - (point.value / maxValue) * innerHeight,
  }));
  const path = mappedPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const yTicks = [...new Set([maxValue, Math.round(maxValue / 2), 0])];
  const labels = mappedPoints.length <= 6
    ? mappedPoints
    : [mappedPoints[0], mappedPoints[Math.floor((mappedPoints.length - 1) / 2)], mappedPoints[mappedPoints.length - 1]];

  return {
    width,
    height,
    left,
    right,
    top,
    bottom,
    innerHeight,
    maxValue,
    points: mappedPoints,
    path,
    labels,
    yTicks,
    note: outlier,
  };
});

async function loadWorkspace() {
  const workspace = await getAfterlightWorkspace();
  entries.value = workspace.entries || [];
}

onMounted(loadWorkspace);
</script>

<template>
  <AfterlightShell title="clairvoyance" :meta="headerMeta">
    <div class="al-filter-row">
      <button
        v-for="option in rangeOptions"
        :key="option.value"
        type="button"
        class="al-filter-pill"
        :class="{ active: selectedRange === option.value }"
        @click="selectedRange = option.value"
      >
        {{ option.label }}
      </button>
    </div>

    <template v-if="filteredEntries.length">
      <section class="al-section">
        <div class="al-section-label">minutes over time</div>
        <svg
          v-if="chartModel.points.length"
          class="al-svg"
          :viewBox="`0 0 ${chartModel.width} ${chartModel.height}`"
          role="img"
          aria-label="Minutes over time line chart"
        >
          <template v-for="tick in chartModel.yTicks" :key="tick">
            <line
              class="al-grid-line"
              :x1="chartModel.left"
              :y1="chartModel.top + chartModel.innerHeight - (tick / chartModel.maxValue) * chartModel.innerHeight"
              :x2="chartModel.width - chartModel.right"
              :y2="chartModel.top + chartModel.innerHeight - (tick / chartModel.maxValue) * chartModel.innerHeight"
            />
            <text
              class="al-svg-label"
              :x="chartModel.width - chartModel.right"
              :y="chartModel.top + chartModel.innerHeight - (tick / chartModel.maxValue) * chartModel.innerHeight - 6"
              text-anchor="end"
            >
              {{ formatDuration(tick) }}
            </text>
          </template>

          <line
            class="al-axis-line"
            :x1="chartModel.left"
            :y1="chartModel.top + chartModel.innerHeight"
            :x2="chartModel.width - chartModel.right"
            :y2="chartModel.top + chartModel.innerHeight"
          />

          <path class="al-path" :d="chartModel.path" />

          <g v-for="point in chartModel.points" :key="point.date">
            <circle class="al-dot" :cx="point.x" :cy="point.y" r="4">
              <title>{{ `${point.label} · ${formatDuration(point.value)}${point.notes ? ` · ${point.notes}` : ''}` }}</title>
            </circle>
          </g>

          <text
            v-for="point in chartModel.labels"
            :key="`label-${point.date}`"
            class="al-svg-label"
            :x="point.x"
            :y="chartModel.height - 8"
            text-anchor="middle"
          >
            {{ point.label }}
          </text>
        </svg>
        <div v-else class="al-empty">No minutes data to chart yet.</div>

        <div v-if="chartModel.note" class="al-chart-note">
          Outlier hidden from scale: {{ chartModel.note.label }} · {{ formatDuration(chartModel.note.value) }}.
        </div>
      </section>

      <section class="al-section">
        <div class="al-two-col">
          <div>
            <div class="al-section-label">minutes by trigger</div>
            <div v-for="item in renderBars(minutesByTrigger, 'al-gold', formatDuration)" :key="item.name" class="al-bar-row">
              <span class="al-bar-name">{{ item.name }}</span>
              <div class="al-bar-track"><div class="al-bar-fill" :class="item.fillClass" :style="{ width: `${item.width}%` }" /></div>
              <span class="al-bar-count">{{ item.formatted }}</span>
            </div>
          </div>
          <div>
            <div class="al-section-label">minutes by time of day</div>
            <div v-for="item in renderBars(minutesByTime, 'al-purple', formatDuration)" :key="item.name" class="al-bar-row">
              <span class="al-bar-name">{{ item.name }}</span>
              <div class="al-bar-track"><div class="al-bar-fill" :class="item.fillClass" :style="{ width: `${item.width}%` }" /></div>
              <span class="al-bar-count">{{ item.formatted }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="al-section">
        <div class="al-section-label">session length</div>
        <div v-for="item in renderBars(minuteBuckets, 'al-green')" :key="item.name" class="al-bar-row">
          <span class="al-bar-name">{{ item.name }}</span>
          <div class="al-bar-track"><div class="al-bar-fill" :class="item.fillClass" :style="{ width: `${item.width}%` }" /></div>
          <span class="al-bar-count">{{ item.formatted }}</span>
        </div>
      </section>
    </template>

    <div v-else class="al-empty">No local entries yet for this range.</div>
  </AfterlightShell>
</template>

<style scoped>
@import '../styles/afterlight.css';
</style>
