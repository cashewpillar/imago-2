<script setup>
import { computed, onMounted, ref } from 'vue';
import AfterlightLegacyImportLauncher from '../components/AfterlightLegacyImportLauncher.vue';
import AfterlightShell from '../components/AfterlightShell.vue';
import { getAfterlightWorkspace } from '../services/afterlightDb';
import {
  buildInsights,
  buildOverviewStats,
  countMulti,
  countSingle,
  filterEntriesByRange,
  formatEntryDateTime,
  formatDuration,
  formatRangeLabel,
  getEntryTime,
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

const stats = computed(() => buildOverviewStats(filteredEntries.value));
const actionCounts = computed(() => countMulti(filteredEntries.value, 'action'));
const stateCounts = computed(() => countMulti(filteredEntries.value, 'state'));
const timeCounts = computed(() => countSingle(filteredEntries.value, 'time'));
const dayTypeCounts = computed(() => countSingle(filteredEntries.value, 'daytype'));
const locationCounts = computed(() => countSingle(filteredEntries.value, 'location'));
const insights = computed(() => buildInsights(filteredEntries.value));
const headerMeta = computed(() => formatRangeLabel(filteredEntries.value));

const agencyBreakdown = computed(() => {
  const automatic = filteredEntries.value.filter((entry) => entry.agency === 'Automatic').length;
  const intentional = filteredEntries.value.filter((entry) => entry.agency === 'Intentional').length;
  const total = automatic + intentional;
  return {
    automatic,
    intentional,
    automaticPercent: total ? Math.round((automatic / total) * 100) : 0,
    intentionalPercent: total ? Math.round((intentional / total) * 100) : 0,
  };
});

function renderBars(items, fillClass) {
  if (!items.length) return [];
  const max = items[0][1] || 1;
  return items.map(([name, count]) => ({
    name,
    count,
    width: Math.round((count / max) * 100),
    fillClass,
  }));
}

async function loadWorkspace() {
  const workspace = await getAfterlightWorkspace();
  entries.value = workspace.entries || [];
}

onMounted(loadWorkspace);
</script>

<template>
  <AfterlightShell title="vision" :meta="headerMeta">
    <template #header-actions>
      <AfterlightLegacyImportLauncher @imported="loadWorkspace" />
    </template>

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
        <div class="al-section-label">overview</div>
        <div class="al-stats-grid">
          <div class="al-stats-card">
            <div class="al-stat-value">{{ stats.total }}</div>
            <div class="al-stat-label">total logs</div>
            <div class="al-stat-sub">{{ stats.days }} days</div>
          </div>
          <div class="al-stats-card">
            <div class="al-stat-value">{{ formatDuration(stats.topTriggerMinutes) }}</div>
            <div class="al-stat-label">time on top trigger</div>
            <div class="al-stat-sub">{{ stats.topTrigger?.[0] || '—' }}</div>
          </div>
          <div class="al-stats-card">
            <div class="al-stat-value" style="font-size:18px; padding-top:4px;">{{ stats.topTrigger?.[0] || '—' }}</div>
            <div class="al-stat-label">top trigger</div>
            <div class="al-stat-sub">{{ stats.topTrigger?.[1] ? `${stats.topTrigger[1]}x` : '' }}</div>
          </div>
          <div class="al-stats-card">
            <div class="al-stat-value" style="font-size:18px; padding-top:4px;">{{ stats.topState?.[0] || '—' }}</div>
            <div class="al-stat-label">top state</div>
            <div class="al-stat-sub">{{ stats.topState?.[1] ? `${stats.topState[1]}x` : '' }}</div>
          </div>
        </div>
      </section>

      <section class="al-section">
        <div class="al-two-col">
          <div>
            <div class="al-section-label">top triggers</div>
            <div v-for="item in renderBars(actionCounts, 'al-gold')" :key="item.name" class="al-bar-row">
              <span class="al-bar-name">{{ item.name }}</span>
              <div class="al-bar-track"><div class="al-bar-fill" :class="item.fillClass" :style="{ width: `${item.width}%` }" /></div>
              <span class="al-bar-count">{{ item.count }}</span>
            </div>
          </div>
          <div>
            <div class="al-section-label">internal states</div>
            <div v-for="item in renderBars(stateCounts, 'al-green')" :key="item.name" class="al-bar-row">
              <span class="al-bar-name">{{ item.name }}</span>
              <div class="al-bar-track"><div class="al-bar-fill" :class="item.fillClass" :style="{ width: `${item.width}%` }" /></div>
              <span class="al-bar-count">{{ item.count }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="al-section">
        <div class="al-two-col">
          <div>
            <div class="al-section-label">time of day</div>
            <div v-for="item in renderBars(timeCounts, 'al-purple')" :key="item.name" class="al-bar-row">
              <span class="al-bar-name">{{ item.name }}</span>
              <div class="al-bar-track"><div class="al-bar-fill" :class="item.fillClass" :style="{ width: `${item.width}%` }" /></div>
              <span class="al-bar-count">{{ item.count }}</span>
            </div>
          </div>
          <div>
            <div class="al-section-label">day type</div>
            <div v-for="item in renderBars(dayTypeCounts, 'al-purple')" :key="item.name" class="al-bar-row">
              <span class="al-bar-name">{{ item.name }}</span>
              <div class="al-bar-track"><div class="al-bar-fill" :class="item.fillClass" :style="{ width: `${item.width}%` }" /></div>
              <span class="al-bar-count">{{ item.count }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="al-section">
        <div class="al-section-label">locations</div>
        <div v-for="item in renderBars(locationCounts, 'al-gold')" :key="item.name" class="al-bar-row">
          <span class="al-bar-name">{{ item.name }}</span>
          <div class="al-bar-track"><div class="al-bar-fill" :class="item.fillClass" :style="{ width: `${item.width}%` }" /></div>
          <span class="al-bar-count">{{ item.count }}</span>
        </div>
      </section>

      <section v-if="agencyBreakdown.automatic || agencyBreakdown.intentional" class="al-section">
        <div class="al-section-label">intentional vs automatic</div>
        <div class="al-agency-track">
          <div class="al-red" :style="{ width: `${agencyBreakdown.automaticPercent}%` }" />
          <div class="al-green" :style="{ width: `${agencyBreakdown.intentionalPercent}%` }" />
        </div>
        <div class="al-agency-legend">
          <span><span class="al-legend-dot al-red" />Automatic {{ agencyBreakdown.automaticPercent }}% ({{ agencyBreakdown.automatic }})</span>
          <span><span class="al-legend-dot al-green" />Intentional {{ agencyBreakdown.intentionalPercent }}% ({{ agencyBreakdown.intentional }})</span>
        </div>
      </section>

      <section v-if="insights.length" class="al-section">
        <div class="al-section-label">patterns worth noting</div>
        <div v-for="insight in insights" :key="insight" class="al-insight">
          {{ insight }}
        </div>
      </section>

      <section class="al-section">
        <div class="al-section-label">recent entries</div>
        <div class="al-entry-list">
          <article v-for="entry in filteredEntries.slice(0, 20)" :key="entry.id" class="al-entry">
            <div class="al-entry-head">
              <div class="al-entry-time">{{ formatEntryDateTime(entry) }}</div>
              <div class="al-entry-day">{{ entry.time || '—' }} · {{ entry.daytype || '—' }}</div>
            </div>

            <div class="al-chip-row">
              <span v-for="item in entry.action" :key="`a-${entry.id}-${item}`" class="al-chip active">{{ item }}</span>
            </div>

            <div class="al-chip-row">
              <span v-for="item in entry.state" :key="`s-${entry.id}-${item}`" class="al-chip">{{ item }}</span>
            </div>

            <div class="al-chip-row">
              <span class="al-chip">{{ entry.location || 'No location' }}</span>
              <span class="al-chip">{{ entry.agency || 'No agency' }}</span>
              <span class="al-chip">{{ entry.minutes ? formatDuration(entry.minutes) : '—' }}</span>
            </div>

            <div v-if="entry.notes" class="al-notes-copy">{{ entry.notes }}</div>
          </article>
        </div>
      </section>
    </template>

    <div v-else class="al-empty">No local entries yet for this range.</div>
  </AfterlightShell>
</template>

<style scoped>
@import '../styles/afterlight.css';
</style>
