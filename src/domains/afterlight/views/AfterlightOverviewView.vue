<script setup>
import { computed, inject, onMounted, ref } from 'vue';
import AfterlightLegacyImportLauncher from '../components/AfterlightLegacyImportLauncher.vue';
import AfterlightShell from '../components/AfterlightShell.vue';
import AfterlightEntryForm from '../components/AfterlightEntryForm.vue';
import BaseModal from '../../../shared/components/BaseModal.vue';
import { getAfterlightWorkspace, updateAfterlightEntry, deleteAfterlightEntry } from '../services/afterlightDb';
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

const { showToast } = inject('appShell');

const selectedRange = ref(30);
const entries = ref([]);
const editingEntry = ref(null);
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

const stats = computed(() => buildOverviewStats(filteredEntries.value));
const actionCounts = computed(() => countMulti(filteredEntries.value, 'action'));
const stateCounts = computed(() => countMulti(filteredEntries.value, 'state'));
const timeCounts = computed(() => countSingle(filteredEntries.value, 'time'));
const dayTypeCounts = computed(() => countSingle(filteredEntries.value, 'daytype'));
const locationCounts = computed(() => countSingle(filteredEntries.value, 'location'));
const insights = computed(() => buildInsights(filteredEntries.value));
const headerMeta = computed(() => formatRangeLabel(filteredEntries.value));

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

function startEdit(entry) {
  editingEntry.value = entry;
}

function cancelEdit() {
  editingEntry.value = null;
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

      <section v-if="insights.length" class="al-section">
        <div class="al-section-label">patterns worth noting</div>
        <div v-for="insight in insights" :key="insight" class="al-insight">
          {{ insight }}
        </div>
      </section>

      <section class="al-section">
        <div class="al-section-label">recent entries</div>
        <div class="al-entry-list">
          <article v-for="entry in filteredEntries.slice(0, 20)" :key="entry.id" class="al-entry" @click="startEdit(entry)">
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
              <span class="al-chip">{{ entry.minutes ? formatDuration(entry.minutes) : '—' }}</span>
            </div>

            <div v-if="entry.notes" class="al-notes-copy">{{ entry.notes }}</div>
          </article>
        </div>
      </section>
    </template>

    <div v-else class="al-empty">No local entries yet for this range.</div>

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
