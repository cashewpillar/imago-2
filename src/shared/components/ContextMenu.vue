<script setup>
import { ref, watch, nextTick } from 'vue';

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 }),
  },
  items: {
    type: Array,
    default: () => [],
  },
});

defineEmits(['select', 'close']);

const menuRef = ref(null);
const adjustedPosition = ref({ x: 0, y: 0 });

watch(
  [() => props.open, () => props.position],
  async ([isOpen]) => {
    if (isOpen) {
      // Initialize with requested position
      adjustedPosition.value = { ...props.position };
      
      await nextTick();
      if (menuRef.value) {
        const rect = menuRef.value.getBoundingClientRect();
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;

        let x = props.position.x;
        let y = props.position.y;

        // Flip or shift if hitting right edge
        if (x + rect.width > screenW - 10) {
          x = screenW - rect.width - 10;
        }
        
        // Flip or shift if hitting bottom edge
        if (y + rect.height > screenH - 10) {
          y = screenH - rect.height - 10;
        }

        // Ensure not off-screen to the left/top
        x = Math.max(10, x);
        y = Math.max(10, y);

        adjustedPosition.value = { x, y };
      }
    } else {
      // Reset position when closed
      adjustedPosition.value = { x: 0, y: 0 };
    }
  },
  { immediate: true }
);
</script>

<template>
  <div
    v-if="open"
    ref="menuRef"
    class="ctx-menu ctx-menu-open"
    :style="{ 
      left: `${adjustedPosition.x}px`, 
      top: `${adjustedPosition.y}px`, 
      display: 'block',
      visibility: adjustedPosition.x === 0 ? 'hidden' : 'visible'
    }"
  >
    <template v-for="(item, index) in items" :key="index">
      <div v-if="item.sep" class="ctx-sep" />
      <div
        v-else
        class="ctx-item"
        :class="{ danger: item.danger }"
        @click="$emit('select', item)"
      >
        {{ item.label }}
      </div>
    </template>
  </div>
</template>
