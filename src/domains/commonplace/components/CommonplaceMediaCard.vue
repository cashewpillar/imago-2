<script setup>
defineProps({
  item: {
    type: Object,
    required: true,
  },
});

defineEmits(['open']);
</script>

<template>
  <div class="mc" :style="{ borderLeftColor: item.borderColor }" @click="$emit('open', item.id)">
    <div class="mc-head">
      <div class="mc-info">
        <div class="mc-title">
          {{ item.title }} <span class="mc-type" style="margin-left:6px; vertical-align:middle;">{{ item.typeLabel }}</span>
        </div>
        <div v-if="item.creator" class="mc-creator">{{ item.creator }}</div>
      </div>
      <div class="mc-count">{{ item.momentCountLabel }}</div>
    </div>
    <div v-if="item.preview" class="mc-preview">"{{ item.preview }}"</div>
  </div>
</template>
