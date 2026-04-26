<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { EMPTY_FILTER_VALUE } from '../utils/tableVault';

const props = defineProps({
  groups: {
    type: Array,
    default: () => [],
  },
  activeFilters: {
    type: Object,
    default: () => ({}),
  },
  color: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['toggle']);

const activeGroupKey = ref(null);

function isActive(groupKey, tag) {
  return (props.activeFilters?.[groupKey] || []).includes(tag.value);
}

function handleToggle(group, tag) {
  const current = props.activeFilters[group.key] || [];
  let next = [];

  if (tag.value === EMPTY_FILTER_VALUE) {
    // If selecting "None", clear everything else
    next = current.includes(EMPTY_FILTER_VALUE) ? [] : [EMPTY_FILTER_VALUE];
  } else {
    // If selecting something else, remove "None"
    const withoutEmpty = current.filter(v => v !== EMPTY_FILTER_VALUE);
    if (withoutEmpty.includes(tag.value)) {
      next = withoutEmpty.filter(v => v !== tag.value);
    } else {
      next = group.type === 'select' ? [tag.value] : [...withoutEmpty, tag.value];
    }
  }

  emit('toggle', { 
    groupKey: group.key, 
    tag: tag.value, 
    type: group.type,
    // Provide the new state if the parent wants to use it directly
    nextValue: next 
  });
}

const shouldCollapse = computed(() => props.groups.length > 1);

function getGroupLabel(group) {
  const active = props.activeFilters[group.key] || [];
  if (active.length === 0) return group.label;
  if (active.length === 1) {
    const tag = group.tags.find(t => t.value === active[0]);
    return tag ? tag.label : group.label;
  }
  return `${group.label}: ${active.length}`;
}

function toggleGroup(e, groupKey) {
  e.stopPropagation();
  if (activeGroupKey.value === groupKey) {
    activeGroupKey.value = null;
  } else {
    activeGroupKey.value = groupKey;
  }
}

function closePopovers() {
  activeGroupKey.value = null;
}

onMounted(() => {
  window.addEventListener('click', closePopovers);
});

onUnmounted(() => {
  window.removeEventListener('click', closePopovers);
});
</script>

<template>
  <div v-if="groups.length" :class="shouldCollapse ? 'tag-compact-row' : 'tag-row'">
    <!-- Expanded Mode -->
    <template v-if="!shouldCollapse">
      <div v-for="group in groups" :key="group.key || group.label" class="tag-group">
        <div class="tag-group-label">{{ group.label }}</div>
        <div class="tag-group-chips">
          <div
            v-for="tag in group.tags"
            :key="`${group.key}:${tag.value}`"
            class="tag-chip"
            :class="{ active: isActive(group.key, tag) }"
            :style="isActive(group.key, tag) ? { background: color.dim, color: color.val, borderColor: 'transparent' } : undefined"
            @click="handleToggle(group, tag)"
          >
            {{ tag.label }}
          </div>
        </div>
      </div>
    </template>

    <!-- Compact Mode -->
    <template v-else>
      <div v-for="group in groups" :key="group.key" class="tag-compact-group">
        <div 
          class="tag-chip" 
          :class="{ active: (activeFilters[group.key] || []).length > 0 }"
          :style="(activeFilters[group.key] || []).length > 0 ? { background: color.dim, color: color.val, borderColor: 'transparent' } : undefined"
          @click="toggleGroup($event, group.key)"
        >
          {{ getGroupLabel(group) }}
          <span class="tag-chip-arrow">▾</span>
        </div>

        <div v-if="activeGroupKey === group.key" class="tag-popover" @click.stop>
          <div class="tag-popover-header">{{ group.label }}</div>
          <div class="tag-popover-list">
            <div
              v-for="tag in group.tags"
              :key="`${group.key}:${tag.value}`"
              class="tag-popover-item"
              :class="{ active: isActive(group.key, tag) }"
              @click="handleToggle(group, tag)"
            >
              <div class="tag-popover-check" :style="isActive(group.key, tag) ? { background: color.dim, color: color.val, borderColor: color.val } : undefined">
                <span v-if="isActive(group.key, tag)">✓</span>
              </div>
              {{ tag.label }}
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.tag-compact-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding: 4px 0;
}

.tag-compact-group {
  position: relative;
}

.tag-chip-arrow {
  font-size: 10px;
  margin-left: 4px;
  opacity: 0.7;
}

.tag-popover {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 100;
  min-width: 160px;
  background: var(--bg3);
  border: 1px solid var(--border2);
  border-radius: var(--r-sm);
  box-shadow: var(--sh);
  overflow: hidden;
  animation: popIn 0.12s cubic-bezier(0, 0, 0.2, 1);
}

@keyframes popIn {
  from { opacity: 0; transform: translateY(-4px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.tag-popover-header {
  padding: 8px 12px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted2);
  border-bottom: 1px solid var(--border);
  background: var(--bg2);
}

.tag-popover-list {
  max-height: 240px;
  overflow-y: auto;
  padding: 4px 0;
}

.tag-popover-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.1s;
}

.tag-popover-item:hover {
  background: var(--bg4);
}

.tag-popover-item.active {
  font-weight: 600;
  color: var(--text);
}

.tag-popover-check {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #0e0e10;
  transition: all 0.12s;
}

.tag-popover-item.active .tag-popover-check {
  border-color: transparent;
}
</style>
