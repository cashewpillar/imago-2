<script setup>
defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  importInputId: {
    type: String,
    default: '',
  },
  storyImportInputId: {
    type: String,
    default: '',
  },
});

defineEmits(['close', 'export', 'reset']);
</script>

<template>
  <div class="ov" :class="{ open }" @click.self="$emit('close')">
    <div class="sheet">
      <div class="handle"></div>
      <div class="ms-t">Your commonplace</div>
      <div class="mi" @click="$emit('export')"><span class="mi-ico">↓</span><div><div>Export all</div><div class="mi-sub">Download as JSON</div></div></div>
      <label class="mi" :for="importInputId"><span class="mi-ico">↑</span><div><div>Import</div><div class="mi-sub">Merge from JSON file</div></div></label>
      <label class="mi" :for="storyImportInputId"><span class="mi-ico">↗</span><div><div>Import from Story</div><div class="mi-sub">Bring in books and captured lines</div></div></label>
      <div class="mdiv"></div>
      <div class="mi" @click="$emit('reset')"><span class="mi-ico">⚠</span><div><div>Reset Data</div><div class="mi-sub">Wipe all data from this device</div></div></div>
      <div class="mdiv"></div>
      <div class="mi" style="cursor:default;opacity:.5;"><span class="mi-ico">○</span><div><div>Commonplace</div><div class="mi-sub">Media as anchors. Thoughts as record.</div></div></div>
    </div>
  </div>
</template>
