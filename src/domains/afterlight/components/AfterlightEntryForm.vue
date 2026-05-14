<script setup>
import { computed, inject, onMounted, ref, watch } from 'vue';
import { getAfterlightWorkspace } from '../services/afterlightDb';
import { getDayType, getTimeOfDay } from '../services/afterlightAnalytics';

const props = defineProps({
  initialData: { type: Object, default: null },
  saving: { type: Boolean, default: false },
  submitLabel: { type: String, default: 'log this moment' },
  savingLabel: { type: String, default: 'logging…' },
});

const emit = defineEmits(['submit', 'cancel']);

const { showToast } = inject('appShell');

const loading = ref(true);
const vault = ref(null);
const minutePresets = ref([]);
const status = ref({ message: '', type: 'ok' });

const form = ref(createDefaultForm());

function createDefaultForm() {
  return {
    action: [],
    state: [],
    location: 'Room',
    time: getTimeOfDay(),
    daytype: getDayType(),
    minutes: 30,
    notes: '',
  };
}

const fieldsByKey = computed(() => new Map((vault.value?.fields || []).map((field) => [field.key, field])));

function getOptions(key) {
  return fieldsByKey.value.get(key)?.options || [];
}

const canSubmit = computed(() => {
  const minutes = Number(form.value.minutes);
  return Boolean(
    form.value.action.length &&
    form.value.state.length &&
    form.value.location &&
    form.value.time &&
    form.value.daytype &&
    Number.isFinite(minutes) &&
    minutes >= 0,
  );
});

function toggleMulti(key, value) {
  const list = [...form.value[key]];
  const index = list.indexOf(value);
  if (index >= 0) list.splice(index, 1);
  else list.push(value);
  form.value = { ...form.value, [key]: list };
}

function selectSingle(key, value) {
  form.value = { ...form.value, [key]: form.value[key] === value ? '' : value };
}

function setMinutes(value) {
  form.value = { ...form.value, minutes: value };
}

async function loadWorkspace() {
  loading.value = true;
  const next = await getAfterlightWorkspace();
  vault.value = next.vault;
  minutePresets.value = next.minutePresets || [];
  loading.value = false;
}

function handleSubmit() {
  if (!canSubmit.value || props.saving) return;
  emit('submit', { ...form.value });
}

watch(
  () => props.initialData,
  (next) => {
    if (next) {
      form.value = {
        action: Array.isArray(next.action) ? [...next.action] : [],
        state: Array.isArray(next.state) ? [...next.state] : [],
        location: next.location || '',
        time: next.time || '',
        daytype: next.daytype || '',
        minutes: next.minutes,
        notes: next.notes || '',
      };
    } else {
      form.value = createDefaultForm();
    }
  },
  { immediate: true },
);

onMounted(loadWorkspace);

defineExpose({
  reset: () => {
    form.value = createDefaultForm();
  },
});
</script>

<template>
  <div v-if="loading" class="al-empty">Loading local Afterlight schema…</div>

  <template v-else>
    <section class="al-section">
      <div class="al-section-label">action / trigger</div>
      <div class="al-pills">
        <button
          v-for="option in getOptions('action')"
          :key="option"
          type="button"
          class="al-pill"
          :class="{ active: form.action.includes(option) }"
          @click="toggleMulti('action', option)"
        >
          {{ option }}
        </button>
      </div>
    </section>

    <section class="al-section">
      <div class="al-section-label">internal state</div>
      <div class="al-pills">
        <button
          v-for="option in getOptions('state')"
          :key="option"
          type="button"
          class="al-pill al-pill-lg"
          :class="{ active: form.state.includes(option) }"
          @click="toggleMulti('state', option)"
        >
          {{ option }}
        </button>
      </div>
    </section>

    <section class="al-section">
      <div class="al-section-label">location</div>
      <div class="al-pills">
        <button
          v-for="option in getOptions('location')"
          :key="option"
          type="button"
          class="al-pill"
          :class="{ active: form.location === option }"
          @click="selectSingle('location', option)"
        >
          {{ option }}
        </button>
      </div>
    </section>

    <section class="al-section">
      <div class="al-section-label">time of day</div>
      <div class="al-pills">
        <button
          v-for="option in getOptions('time')"
          :key="option"
          type="button"
          class="al-pill"
          :class="{ active: form.time === option }"
          @click="selectSingle('time', option)"
        >
          {{ option }}
        </button>
      </div>
    </section>

    <section class="al-section">
      <div class="al-section-label">day type</div>
      <div class="al-pills">
        <button
          v-for="option in getOptions('daytype')"
          :key="option"
          type="button"
          class="al-pill"
          :class="{ active: form.daytype === option }"
          @click="selectSingle('daytype', option)"
        >
          {{ option }}
        </button>
      </div>
    </section>

    <section class="al-section">
      <div class="al-section-label">minutes</div>
      <div class="al-minutes-row">
        <button
          v-for="preset in minutePresets"
          :key="preset"
          type="button"
          class="al-pill"
          :class="{ active: Number(form.minutes) === Number(preset) }"
          @click="setMinutes(Number(preset))"
        >
          {{ preset }}
        </button>
        <input
          v-model.number="form.minutes"
          class="al-field al-minutes-input"
          type="number"
          min="0"
          step="1"
          placeholder="other"
        >
      </div>
    </section>

    <section class="al-section">
      <div class="al-section-label">notes (optional)</div>
      <textarea v-model="form.notes" class="al-notes" placeholder="write something.." />
    </section>

    <div class="al-divider" />

    <section class="al-section">
      <div class="al-btn-row">
        <button class="al-btn" :disabled="!canSubmit || saving" @click="handleSubmit">
          {{ saving ? savingLabel : submitLabel }}
        </button>
        <button v-if="initialData" class="al-btn al-btn-ghost" @click="emit('cancel')">
          cancel
        </button>
      </div>
    </section>
  </template>
</template>

<style scoped>
@import '../styles/afterlight.css';

.al-btn-row {
  display: flex;
  gap: 12px;
}

.al-btn-ghost {
  background: transparent;
  border: 1px solid var(--al-border);
  color: var(--al-text-dim);
}

.al-btn-ghost:hover {
  border-color: var(--al-text-dim);
  color: var(--al-text);
}
</style>
