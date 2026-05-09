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
  curMoStg: {
    type: Number,
    required: true,
  },
  momentForm: {
    type: Object,
    required: true,
  },
  activeTags: {
    type: Array,
    required: true,
  },
  relationRows: {
    type: Array,
    required: true,
  },
  showMomentDelete: {
    type: Boolean,
    default: false,
  },
  momentOptions: {
    type: Array,
    required: true,
  },
});

defineEmits([
  'back',
  'delete-moment',
  'save-moment',
  'set-stage',
  'handle-tag-input',
  'handle-tag-key',
  'commit-tag-input',
  'remove-tag',
  'copy-blocks',
  'add-relation',
  'remove-relation',
]);
</script>

<template>
  <section class="view active">
    <CommonplaceTopbar back home :label="title" :meta="meta" @back="$emit('back')" />
    <div class="me-body">
      <div>
        <div class="fg"><label class="fl"><span>Thoughts</span><button class="fl-copy" @click="$emit('copy-blocks', 'mo-thought-blks')">Copy</button></label><div id="mo-thought-blks"></div></div>
      </div>
      <div id="mo-s2" class="mo-s2" :class="{ on: curMoStg === 2 }">
        <div class="fg"><label class="fl">Anchor <span style="color:var(--ink4);font-style:italic;font-size:9px;">chapter, episode, scene, timestamp…</span></label><input v-model="momentForm.anchor" class="fi" placeholder="e.g. Chapter 12, Episode 4, 00:42…"></div>
        <div class="fg"><label class="fl">Tags <span style="color:var(--ink4);font-style:italic;font-size:9px;">type then space</span></label><input v-model="momentForm.tagInput" class="fi" placeholder="grief, identity, memory…" @input="$emit('handle-tag-input', $event)" @keydown="$emit('handle-tag-key', $event)" @blur="$emit('commit-tag-input')"><div id="ti-display" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;"><span v-for="(tag, index) in activeTags" :key="`${tag}-${index}`" class="tp-rm">#{{ tag }}<button @click="$emit('remove-tag', index)">×</button></span></div></div>
        <div style="height:24px;"></div>
        <div class="div-lbl">Details</div>
        <div class="fg"><label class="fl"><span>A line or moment that means something to you <span style="color:var(--ink4);font-style:italic;font-size:9px;">optional</span></span><button class="fl-copy" @click="$emit('copy-blocks', 'mo-line-blks')">Copy</button></label><div id="mo-line-blks"></div></div>
        <div class="fg"><label class="fl"><span>How does it connect to your life?</span><button class="fl-copy" @click="$emit('copy-blocks', 'mo-conn-blks')">Copy</button></label><div id="mo-conn-blks"></div></div>
        <div class="fg" style="margin-top:20px;"><label class="fl">Date & Time</label><input v-model="momentForm.date" type="datetime-local" class="fi"></div>
        <div style="height:24px;"></div>
        <div class="div-lbl">Connections</div>
        <div class="fg"><label class="fl">Connections to other moments</label><div v-for="(row, index) in relationRows" :key="index" class="rel-row"><input v-model="row.label" class="fi" style="flex:0 0 90px;" placeholder="Label…"><select v-model="row.toId" class="fi"><option :value="null">— pick a moment —</option><option v-for="option in momentOptions" :key="option.id" :value="option.id">{{ option.label }}</option></select><button class="rel-rm-btn" @click="$emit('remove-relation', index)">×</button></div><button class="btn" style="font-size:12px;margin-top:5px;" @click="$emit('add-relation')">+ add connection</button></div>
      </div>
    </div>
    <div class="save-bar"><button v-if="showMomentDelete" class="btn bd" @click="$emit('delete-moment')">Delete</button><button class="btn" @click="$emit('back')">Cancel</button><button class="btn bp" @click="curMoStg === 1 ? $emit('set-stage', 2) : $emit('save-moment')">{{ curMoStg === 1 ? 'Next' : 'Save' }}</button></div>
  </section>
</template>
