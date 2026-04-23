import { computed, ref, watch } from 'vue';
import { loadJson, saveJson } from '../../shared/lib/storage';

const STORAGE_KEY = 'imago.filling-up.vue';

function seedTimeline() {
  return {
    wake: 6,
    bed: 22,
    blocks: [
      { id: crypto.randomUUID(), name: 'work', start: 9, end: 12, color: '#7c5cff' },
      { id: crypto.randomUUID(), name: 'lunch', start: 12, end: 13, color: '#c56c2f' },
      { id: crypto.randomUUID(), name: 'walk', start: 18, end: 19, color: '#199870' },
    ],
  };
}

export function useTimelinePlanner() {
  const timeline = ref(loadJson(STORAGE_KEY, seedTimeline()));

  watch(
    timeline,
    (value) => {
      saveJson(STORAGE_KEY, value);
    },
    { deep: true }
  );

  const hours = computed(() => {
    const result = [];
    for (let hour = timeline.value.wake; hour <= timeline.value.bed; hour += 1) {
      result.push(hour);
    }
    return result;
  });

  function addBlock(payload) {
    timeline.value.blocks.push({
      id: crypto.randomUUID(),
      name: payload.name.trim().toLowerCase(),
      start: Number(payload.start),
      end: Number(payload.end),
      color: payload.color,
    });
  }

  function removeBlock(id) {
    timeline.value.blocks = timeline.value.blocks.filter((block) => block.id !== id);
  }

  return { timeline, hours, addBlock, removeBlock };
}
