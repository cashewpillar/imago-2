<script setup>
import CommonplaceMomentCard from './CommonplaceMomentCard.vue';
import CommonplaceTagChips from './CommonplaceTagChips.vue';

defineProps({
  detail: {
    type: Object,
    required: true,
  },
});

defineEmits(['toggle-tag', 'add-moment', 'open-moment', 'open-tag', 'jump']);
</script>

<template>
  <div>
    <div class="md-head">
      <div class="md-type">{{ detail.typeLabel }}</div>
      <div class="md-title">{{ detail.title }}</div>
      <div v-if="detail.creator" class="md-creator">{{ detail.creator }}</div>
      <div
        v-if="detail.reasonHtml"
        style="padding:4px 0 0; opacity:0.8; font-size:13px; font-family:'Lora',serif; line-height:1.6; font-style:italic;"
        v-html="detail.reasonHtml"
      ></div>
      <div v-if="detail.tags.length" class="md-tags" style="margin-top:10px; border-top:1px solid var(--b); padding-top:10px;">
        <CommonplaceTagChips :items="detail.tags" :active-key="detail.activeTag" @toggle="$emit('toggle-tag', $event)" />
      </div>
    </div>
    <div class="sec-head">
      <span class="sec-lbl">Moments {{ detail.countSuffix }}</span>
      <button class="btn" style="font-size:12px;padding:5px 10px;" @click="$emit('add-moment', detail.id)">+ add moment</button>
    </div>
    <div class="moments-wrap">
      <div v-if="!detail.moments.length" class="no-mom">{{ detail.emptyText }}</div>
      <CommonplaceMomentCard
        v-for="moment in detail.moments"
        v-else
        :key="moment.id"
        :item="moment"
        @open="$emit('open-moment', $event)"
        @open-tag="$emit('open-tag', $event)"
        @jump="$emit('jump', $event)"
      />
    </div>
  </div>
</template>
