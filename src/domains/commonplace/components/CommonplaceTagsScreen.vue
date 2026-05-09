<script setup>
import { toBlob, toPng } from 'html-to-image';
import CommonplaceBottomNav from './CommonplaceBottomNav.vue';
import CommonplaceEmptyState from './CommonplaceEmptyState.vue';
import CommonplaceMomentCard from './CommonplaceMomentCard.vue';
import CommonplaceTagChips from './CommonplaceTagChips.vue';
import CommonplaceTopbar from './CommonplaceTopbar.vue';

defineProps({
  brandHtml: {
    type: String,
    default: '',
  },
  homeTags: {
    type: Array,
    required: true,
  },
  activeTag: {
    type: String,
    default: null,
  },
  tagGroups: {
    type: Array,
    required: true,
  },
  emptyStateHtml: {
    type: String,
    default: '',
  },
  activeTab: {
    type: String,
    required: true,
  },
});

defineEmits(['open-menu', 'switch-tab', 'open-moment', 'toggle-tag', 'open-tag', 'jump', 'toast']);

async function copyAsImage(el, item = null) {
  if (!el || !navigator.clipboard || !window.ClipboardItem) return;

  const filter = (node) => {
    if (node.classList?.contains('mom-copy-btn')) return false;
    return true;
  };

  try {
    // Single card copy: provide image AND meaningful text fallback
    const promise = toBlob(el, {
      pixelRatio: 3,
      filter: filter,
      backgroundColor: '#FEFCF8',
      width: el.scrollWidth + 2,
      height: el.scrollHeight + 2,
    });

    const text = item ? `[${item.mediaTitle || ''}${item.anchor ? ` | ${item.anchor}` : ''}]\n${el.querySelector('.mom-body')?.innerText || ''}`.trim() : '';

    const data = [new ClipboardItem({ 
      'image/png': promise,
      'text/plain': new Blob([text], { type: 'text/plain' })
    })];
    await navigator.clipboard.write(data);
  } catch (err) {
    console.error('Copy failed', err);
    throw err;
  }
}

async function downloadGroup(tag) {
  const container = document.getElementById(`cg-${tag}`);
  if (!container) return;
  const cards = container.querySelectorAll('.mom-card');
  if (cards.length > 20) return; // Safeguard against manual calls
  
  for (let i = 0; i < cards.length; i += 1) {
    const card = cards[i];
    const mediaTitle = card.querySelector('.mom-anchor b')?.innerText || 'Moment';
    const anchor = card.querySelector('.mom-anchor span:last-child')?.innerText || '';
    const filename = `${tag}-${mediaTitle}-${anchor}-${i + 1}`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    const dataUrl = await toPng(card, {
      pixelRatio: 3,
      filter: (n) => !n.classList?.contains('mom-copy-btn'),
      backgroundColor: '#FEFCF8',
    });

    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = dataUrl;
    link.click();
    
    if (i < cards.length - 1) {
      await new Promise(r => setTimeout(r, 250));
    }
  }
}

async function copyIndividual(item) {
  const el = document.getElementById(`mc-${item.id}`);
  if (el) await copyAsImage(el, item);
}
</script>

<template>
  <section class="view active">
    <CommonplaceTopbar :brand-html="brandHtml" home>
      <button class="btn ib" @click="$emit('open-menu')">⋯</button>
    </CommonplaceTopbar>
    <div class="pg-head"><div class="pg-h">Your <em>tags</em></div></div>
    <CommonplaceTagChips :items="homeTags" :active-key="activeTag" @toggle="$emit('toggle-tag', $event)" />
    <div v-if="!tagGroups.length" class="list">
      <CommonplaceEmptyState icon="◈" :html="emptyStateHtml" />
    </div>
    <div v-else class="list">
      <div v-for="group in tagGroups" :key="group.tag" :id="`cg-${group.tag}`" class="cg">
        <div class="cg-lbl" style="display:flex; justify-content:space-between; align-items:center;">
          <span>{{ group.tag === 'Untagged' ? '' : '#' }}{{ group.tag }} · {{ group.count }} {{ group.count === 1 ? 'moment' : 'moments' }}</span>
          <button 
            v-if="activeTag && group.count <= 20"
            class="btn" 
            style="font-size:9px; padding:2px 8px; height:20px; line-height:1;" 
            @click="downloadGroup(group.tag); $emit('toast', 'Downloading images...')"
          >
            Download All
          </button>
        </div>
        <CommonplaceMomentCard
          v-for="item in group.items"
          :key="item.id"
          :item="item"
          @open="$emit('open-moment', $event)"
          @open-tag="$emit('open-tag', $event)"
          @jump="$emit('jump', $event)"
          @copy="copyIndividual($event); $emit('toast', 'Copied image')"
        />
      </div>
    </div>
    <CommonplaceBottomNav :active-tab="activeTab" @switch="$emit('switch-tab', $event)" />
  </section>
</template>
