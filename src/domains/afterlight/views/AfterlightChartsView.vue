<script setup>
import { computed, inject, onMounted, ref } from 'vue';
import AfterlightLegacyImportLauncher from '../components/AfterlightLegacyImportLauncher.vue';
import AfterlightShell from '../components/AfterlightShell.vue';
import AfterlightEntryForm from '../components/AfterlightEntryForm.vue';
import BaseModal from '../../../shared/components/BaseModal.vue';
import { getAfterlightWorkspace, updateAfterlightEntry, deleteAfterlightEntry } from '../services/afterlightDb';
import {
  countMinuteBuckets,
  filterEntriesByRange,
  formatDuration,
  formatEntryDateTime,
  formatRangeLabel,
  getEntryTime,
  sumMinutesByMulti,
  sumMinutesBySingle,
  sumMinutesOverTime,
  toDateKey,
} from '../services/afterlightAnalytics';

const { showToast } = inject('appShell');

const selectedRange = ref(30);
const entries = ref([]);
const editingEntry = ref(null);
const selectedDayEntries = ref([]);
const saving = ref(false);

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
const minuteTrend = computed(() => sumMinutesOverTime(filteredEntries.value, selectedRange.value));
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
  const points = minuteTrend.value;
  if (!points.length) return { points: [], path: '', labels: [], yTicks: [] };

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
  };
});

async function loadWorkspace() {
  const workspace = await getAfterlightWorkspace();
  entries.value = workspace.entries || [];
}

function handlePointClick(point) {
  const dayEntries = entries.value.filter((entry) => toDateKey(getEntryTime(entry)) === point.date);
  if (dayEntries.length === 1) {
    editingEntry.value = dayEntries[0];
  } else if (dayEntries.length > 1) {
    selectedDayEntries.value = dayEntries;
  }
}

function startEdit(entry) {
  editingEntry.value = entry;
  selectedDayEntries.value = [];
}

function cancelEdit() {
  editingEntry.value = null;
  selectedDayEntries.value = [];
}

async function handleUpdate(formData) {
  if (!editingEntry.value || saving.value) return;
  saving.value = true;
  try {
    await updateAfterlightEntry(editingEntry.value.id, formData);
    await loadWorkspace();
    editingEntry.value = null;
    showToast('Entry updated', 'success');
  } catch (error) {
    showToast(error.message || 'Update failed', 'error');
  } finally {
    saving.value = false;
  }
}

async function handleDelete() {
  if (!editingEntry.value || saving.value) return;
  if (!confirm('Are you sure you want to delete this entry?')) return;
  
  saving.value = true;
  try {
    await deleteAfterlightEntry(editingEntry.value.id);
    await loadWorkspace();
    editingEntry.value = null;
    showToast('Entry deleted', 'success');
  } catch (error) {
    showToast(error.message || 'Delete failed', 'error');
  } finally {
    saving.value = false;
  }
}

onMounted(loadWorkspace);
</script>

<template>
  <AfterlightShell title="clairvoyance" :meta="headerMeta">
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
            <template v-if="point.value > 0">
              <circle
                class="al-dot"
                :cx="point.x"
                :cy="point.y"
                r="6"
                style="cursor: pointer; fill-opacity: 0.1; stroke: transparent; stroke-width: 10;"
                @click="handlePointClick(point)"
              />
              <circle
                class="al-dot"
                :cx="point.x"
                :cy="point.y"
                r="4"
                pointer-events="none"
              >
                <title>{{ `${point.label} · ${formatDuration(point.value)}${point.notes ? ` · ${point.notes}` : ''}` }}</title>
              </circle>
            </template>
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

    <BaseModal
      :open="selectedDayEntries.length > 0"
      title="select entry"
      @close="cancelEdit"
    >
      <div class="al-entry-list">
        <article
          v-for="entry in selectedDayEntries"
          :key="entry.id"
          class="al-entry"
          @click="startEdit(entry)"
        >
          <div class="al-entry-head">
            <div class="al-entry-time">{{ formatEntryDateTime(entry) }}</div>
            <div class="al-entry-day">{{ entry.time || '—' }} · {{ entry.daytype || '—' }}</div>
          </div>
          <div class="al-chip-row">
            <span v-for="item in entry.action" :key="`a-${entry.id}-${item}`" class="al-chip active">{{ item }}</span>
          </div>
          <div v-if="entry.notes" class="al-notes-copy">{{ entry.notes }}</div>
        </article>
      </div>
    </BaseModal>

    <BaseModal
      :open="!!editingEntry"
      title="edit entry"
      @close="cancelEdit"
    >
      <AfterlightEntryForm
        v-if="editingEntry"
        :initial-data="editingEntry"
        :saving="saving"
        submit-label="save changes"
        saving-label="saving…"
        @submit="handleUpdate"
        @cancel="cancelEdit"
      />
      <template #footer>
        <button class="al-btn al-btn-danger" :disabled="saving" @click="handleDelete">
          delete entry
        </button>
      </template>
    </BaseModal>
  </AfterlightShell>
</template>

<style scoped>
@import '../styles/afterlight.css';
</style>
