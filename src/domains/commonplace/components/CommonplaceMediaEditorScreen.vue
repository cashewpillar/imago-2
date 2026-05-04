<script setup>
import CommonplaceTopbar from './CommonplaceTopbar.vue';

defineProps({
  title: {
    type: String,
    required: true,
  },
  meta: {
    type: String,
    default: '',
  },
  mediaForm: {
    type: Object,
    required: true,
  },
  showMediaDelete: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['back', 'delete-media', 'save-media']);
</script>

<template>
  <section class="view active">
    <CommonplaceTopbar back :label="title" :meta="meta" @back="$emit('back')" />
    <div class="me-body">
      <div class="fg"><label class="fl">Type</label><select v-model="mediaForm.type" class="fi"><option value="book">Book</option><option value="film">Film</option><option value="tv">TV series</option><option value="other">Other</option></select></div>
      <div class="fg"><label class="fl">Status</label><select v-model="mediaForm.status" class="fi"><option value="not-started">Not started</option><option value="in-progress">In Progress</option><option value="on-hold">On hold</option><option value="done">Done</option></select></div>
      <div class="fg"><label class="fl">Title</label><input v-model="mediaForm.title" class="fi" placeholder="Title of the work…"></div>
      <div class="fg"><label class="fl">Author / Director / Creator</label><input v-model="mediaForm.creator" class="fi" placeholder="Who made it…"></div>
      <div class="fg"><label class="fl">Why did you pick this?</label><div id="me-reason-blks"></div></div>
    </div>
    <div class="save-bar"><button v-if="showMediaDelete" class="btn bd" @click="$emit('delete-media')">Delete</button><button class="btn" @click="$emit('back')">Cancel</button><button class="btn bp" @click="$emit('save-media')">Save</button></div>
  </section>
</template>
