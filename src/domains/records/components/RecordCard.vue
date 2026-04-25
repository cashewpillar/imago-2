<script setup>
defineProps({
  record: {
    type: Object,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  previewFields: {
    type: Array,
    default: () => [],
  },
  metaGroups: {
    type: Array,
    default: () => [],
  },
  color: {
    type: Object,
    required: true,
  },
  dateLabel: {
    type: String,
    required: true,
  },
});

defineEmits(['open', 'menu']);
</script>

<template>
  <div class="rec-card" @click="$emit('open', record)">
    <div class="rc-stripe" :style="{ background: color.val }" />
    <div class="rc-header">
      <div class="rc-title">{{ title }}</div>
      <button class="rc-menu" @click.stop="$emit('menu', $event, record)">⋮</button>
    </div>
    <div v-if="previewFields.length" class="rc-fields">
      <div v-for="field in previewFields" :key="field.label + field.value" class="rc-frow">
        <span class="rc-fkey">{{ field.label }}</span>
        <span v-if="field.type !== 'progress'" class="rc-fval">{{ field.value }}</span>
        <span v-else class="rc-fval" style="display:flex;align-items:center;gap:5px;">
          <div class="prog-wrap" style="flex:1;">
            <div class="prog-fill" :style="{ width: `${field.value}%`, background: color.val }" />
          </div>
          <span style="font-size:10px;color:var(--muted);flex-shrink:0;">{{ field.value }}%</span>
        </span>
      </div>
    </div>
    <div v-if="metaGroups.length" class="rc-meta">
      <div v-for="group in metaGroups" :key="group.key" class="rc-meta-group">
        <div class="rc-meta-label">{{ group.label }}</div>
        <div class="rc-meta-tags">
          <span
            v-for="tag in group.values"
            :key="tag"
            class="rc-tag"
            :style="{ background: color.dim, color: color.val }"
          >
            {{ tag }}
          </span>
        </div>
      </div>
    </div>
    <div class="rc-date">{{ dateLabel }}</div>
  </div>
</template>
