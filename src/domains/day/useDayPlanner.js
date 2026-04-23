import { computed, ref, watch } from 'vue';
import { loadJson, saveJson } from '../../shared/lib/storage';

const STORAGE_KEY = 'imago.day.vue';
const categories = ['maintain', 'build', 'break'];

function createDay(offset) {
  const date = new Date();
  date.setDate(date.getDate() - offset);
  return {
    id: crypto.randomUUID(),
    label: offset === 0 ? 'today' : offset === 1 ? 'yesterday' : `${offset}d ago`,
    date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    wake: 6,
    bed: 22,
    blocks: [
      { id: crypto.randomUUID(), name: 'work', category: 'build', hours: 6 },
      { id: crypto.randomUUID(), name: 'personal', category: 'maintain', hours: 4 },
      { id: crypto.randomUUID(), name: 'rest', category: 'break', hours: 2 },
    ],
  };
}

export function useDayPlanner() {
  const days = ref(loadJson(STORAGE_KEY, [createDay(0), createDay(1)]));
  const currentIndex = ref(0);

  watch(
    days,
    (value) => {
      saveJson(STORAGE_KEY, value);
    },
    { deep: true }
  );

  const currentDay = computed(() => days.value[currentIndex.value]);
  const availableHours = computed(() => currentDay.value.bed - currentDay.value.wake);

  function addBlock(payload) {
    currentDay.value.blocks.push({
      id: crypto.randomUUID(),
      name: payload.name.trim().toLowerCase(),
      category: payload.category,
      hours: Number(payload.hours),
    });
  }

  function removeBlock(id) {
    currentDay.value.blocks = currentDay.value.blocks.filter((block) => block.id !== id);
  }

  function shiftDay(direction) {
    currentIndex.value = Math.min(
      Math.max(currentIndex.value + direction, 0),
      days.value.length - 1
    );
  }

  function addDay() {
    days.value.push(createDay(days.value.length));
    currentIndex.value = days.value.length - 1;
  }

  return {
    categories,
    days,
    currentIndex,
    currentDay,
    availableHours,
    addBlock,
    removeBlock,
    shiftDay,
    addDay,
  };
}
