<script setup>
import { computed, ref, watch } from 'vue';
import CommonplaceTopbar from './CommonplaceTopbar.vue';

const props = defineProps({
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
  allTags: {
    type: Array,
    default: () => [],
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

const emit = defineEmits([
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

function getLevenshteinDistance(a, b) {
  const tmp = [];
  for (let i = 0; i <= a.length; i += 1) tmp[i] = [i];
  for (let j = 0; j <= b.length; j += 1) tmp[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      tmp[i][j] = b.charAt(j - 1) === a.charAt(i - 1)
        ? tmp[i - 1][j - 1]
        : Math.min(tmp[i - 1][j - 1] + 1, tmp[i][j - 1] + 1, tmp[i - 1][j] + 1);
    }
  }
  return tmp[a.length][b.length];
}

const selectedIndex = ref(-1);
const showSuggestions = ref(false);

const suggestions = computed(() => {
  const input = (props.momentForm.tagInput || '').trim().toLowerCase();
  if (!input) return [];

  const results = props.allTags
    .filter((t) => !props.activeTags.includes(t))
    .map((t) => {
      const tag = t.toLowerCase();
      // 1. Exact match
      if (tag === input) return { tag: t, score: 0 };
      // 2. Prefix match
      if (tag.startsWith(input)) return { tag: t, score: 1 };
      // 3. Substring match
      if (tag.includes(input)) return { tag: t, score: 2 };

      if (input.length > 2) {
        // 4. Fuzzy prefix match (e.g. "awsthe" -> "aesthe...")
        const prefix = tag.slice(0, input.length);
        const pDist = getLevenshteinDistance(input, prefix);
        if (pDist <= 1) return { tag: t, score: 3 + pDist };

        // 5. Fuzzy whole-word match
        const dist = getLevenshteinDistance(input, tag);
        if (dist <= 2) return { tag: t, score: 6 + dist };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score)
    .map((m) => m.tag);

  return results.slice(0, 8);
});

watch(() => props.momentForm.tagInput, (newVal) => {
  if (!newVal) {
    showSuggestions.value = false;
    selectedIndex.value = -1;
  } else {
    showSuggestions.value = suggestions.value.length > 0;
    // Don't reset selectedIndex here to allow arrow navigation to persist if input changes?
    // Actually, usually you reset it.
    if (selectedIndex.value >= suggestions.value.length) {
      selectedIndex.value = suggestions.value.length - 1;
    }
  }
});

function selectSuggestion(tag) {
  // eslint-disable-next-line vue/no-mutating-props
  props.momentForm.tagInput = tag;
  emit('handle-tag-key', { key: 'Enter', preventDefault: () => {} });
  showSuggestions.value = false;
  selectedIndex.value = -1;
}

function onKeydown(e) {
  if (!showSuggestions.value) {
    emit('handle-tag-key', e);
    return;
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedIndex.value = (selectedIndex.value + 1) % suggestions.value.length;
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedIndex.value = (selectedIndex.value - 1 + suggestions.value.length) % suggestions.value.length;
  } else if ((e.key === 'Enter' || e.key === 'Tab' || e.key === ' ') && selectedIndex.value !== -1) {
    e.preventDefault();
    selectSuggestion(suggestions.value[selectedIndex.value]);
  } else if (e.key === 'Escape') {
    showSuggestions.value = false;
    selectedIndex.value = -1;
  } else {
    emit('handle-tag-key', e);
  }
}

function onBlur() {
  // Small delay to allow click on suggestion
  setTimeout(() => {
    showSuggestions.value = false;
    selectedIndex.value = -1;
    emit('commit-tag-input');
  }, 150);
}
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
        <div class="fg">
          <label class="fl">Tags <span style="color:var(--ink4);font-style:italic;font-size:9px;">type then space</span></label>
          <div style="position:relative;">
            <input v-model="momentForm.tagInput" class="fi" placeholder="grief, identity, memory…" @input="$emit('handle-tag-input', $event)" @keydown="onKeydown" @blur="onBlur">
            <div v-if="showSuggestions && suggestions.length" class="tag-suggestions">
              <div
                v-for="(tag, index) in suggestions"
                :key="tag"
                class="tag-suggestion"
                :class="{ selected: index === selectedIndex }"
                @mousedown="selectSuggestion(tag)"
              >
                #{{ tag }}
              </div>
            </div>
          </div>
          <div id="ti-display" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;"><span v-for="(tag, index) in activeTags" :key="`${tag}-${index}`" class="tp-rm">#{{ tag }}<button @click="$emit('remove-tag', index)">×</button></span></div>
        </div>
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
