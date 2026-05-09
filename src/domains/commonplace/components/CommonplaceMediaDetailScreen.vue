<script setup>
import CommonplaceMediaDetailBody from './CommonplaceMediaDetailBody.vue';
import CommonplaceTopbar from './CommonplaceTopbar.vue';

defineProps({
  mediaDetailLabel: {
    type: String,
    default: '',
  },
  mediaDetail: {
    type: Object,
    required: true,
  },
});

defineEmits(['back', 'edit-media', 'toggle-tag', 'add-moment', 'open-moment', 'open-tag', 'jump']);
</script>

<template>
  <section class="view active">
    <CommonplaceTopbar back home :label="mediaDetailLabel" @back="$emit('back')">
      <button class="btn ib" @click="$emit('edit-media')">✎</button>
    </CommonplaceTopbar>
    <CommonplaceMediaDetailBody
      :detail="mediaDetail"
      @toggle-tag="$emit('toggle-tag', $event)"
      @add-moment="$emit('add-moment', $event)"
      @open-moment="$emit('open-moment', $event)"
      @open-tag="$emit('open-tag', $event)"
      @jump="$emit('jump', $event)"
    />
  </section>
</template>
