<script setup>
defineProps({
  item: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['open', 'open-tag', 'jump']);

function handleCardClick(event, item) {
  const interactiveTarget = event.target.closest('.cdh-mark, .cdh-tip-link, a, button, .task-item');
  if (interactiveTarget) return;
  emit('open', { id: item.id, mediaId: item.mediaId });
}
</script>

<template>
  <div :id="`mc-${item.id}`" class="mom-card" style="cursor:pointer" @click="handleCardClick($event, item)">
    <div class="mom-card-head">
      <span class="mom-anchor">{{ item.anchor || '—' }}</span>
      <span class="mom-date">{{ item.dateLabel }}</span>
    </div>
    <div class="mom-body">
      <template v-if="item.thoughtHtml">
        <div class="mom-sec">Thoughts</div>
        <div class="mom-txt" style="white-space:normal; overflow:visible; text-overflow:clip;" v-html="item.thoughtHtml"></div>
      </template>
      <template v-if="item.connectionHtml">
        <div class="mom-sec">How it connects to my life</div>
        <div class="mom-txt" style="white-space:normal; overflow:visible; text-overflow:clip;" v-html="item.connectionHtml"></div>
      </template>
      <template v-if="item.lineHtml">
        <div class="mom-sec">A line or moment</div>
        <div class="mom-txt" style="white-space:normal; overflow:visible; text-overflow:clip;" v-html="item.lineHtml"></div>
      </template>
    </div>
    <div v-if="item.tags.length" class="mom-tags">
      <span
        v-for="tag in item.tags"
        :key="tag"
        class="tp"
        style="cursor:pointer"
        @click.stop="$emit('open-tag', tag)"
      >#{{ tag }}</span>
    </div>
    <div v-if="item.relations.length" class="mom-rels">
      <span
        v-for="relation in item.relations"
        :key="`${item.id}-${relation.targetId}-${relation.label}`"
        class="rel-chip"
        @click.stop="$emit('jump', relation.targetId)"
      >
        <span>{{ relation.label }}</span>
        <span style="font-size:10px;opacity:.6;margin:0 2px;">→</span>
        <span>{{ relation.targetTitle }}</span>
      </span>
    </div>
  </div>
</template>
