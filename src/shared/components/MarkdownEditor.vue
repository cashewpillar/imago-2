<script setup>
import { nextTick, onMounted, ref, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue']);

const textareaRef = ref(null);
const isFocused = ref(false);

function adjustHeight() {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

async function startEditing() {
  isFocused.value = true;
  await nextTick();
  if (textareaRef.value) {
    textareaRef.value.focus();
    adjustHeight();
  }
}

function handleKeydown(e) {
  if (e.key === 'Enter') {
    const el = e.target;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const value = el.value;
    
    const beforeCursor = value.substring(0, start);
    const lastNewline = beforeCursor.lastIndexOf('\n');
    const currentLine = beforeCursor.substring(lastNewline + 1);
    
    let prefix = '';
    if (currentLine.trimStart().startsWith('- [ ] ')) prefix = '- [ ] ';
    else if (currentLine.trimStart().startsWith('- [x] ')) prefix = '- [ ] ';
    else if (currentLine.trimStart().startsWith('- ')) prefix = '- ';
    else if (currentLine.trimStart().startsWith('* ')) prefix = '* ';
    
    if (prefix) {
      if (currentLine.trim() === prefix.trim()) {
        e.preventDefault();
        const newValue = value.substring(0, lastNewline + 1) + value.substring(end);
        emit('update:modelValue', newValue);
        nextTick(() => {
          el.selectionStart = el.selectionEnd = lastNewline + 1;
          adjustHeight();
        });
        return;
      }
      
      e.preventDefault();
      const insertion = '\n' + prefix;
      const newValue = value.substring(0, start) + insertion + value.substring(end);
      emit('update:modelValue', newValue);
      
      nextTick(() => {
        el.selectionStart = el.selectionEnd = start + insertion.length;
        adjustHeight();
      });
    }
  }
}

function renderMarkdown(text) {
  if (!text) return '';
  let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  const lines = html.split('\n');
  const renderedLines = lines.map((line, index) => {
    if (line.startsWith('### ')) return `<h3>${line.substring(4)}</h3>`;
    if (line.startsWith('#### ')) return `<h4>${line.substring(5)}</h4>`;
    if (line.startsWith('##### ')) return `<h5>${line.substring(6)}</h5>`;
    if (line.startsWith('- [ ] ')) return `<div class="md-check" data-line="${index}"><input type="checkbox" /> <span>${line.substring(6)}</span></div>`;
    if (line.startsWith('- [x] ')) return `<div class="md-check is-checked" data-line="${index}"><input type="checkbox" checked /> <span>${line.substring(6)}</span></div>`;
    if (line.startsWith('- ')) return `<div class="md-bullet"><span>•</span> <span>${line.substring(2)}</span></div>`;
    if (line.startsWith('* ')) return `<div class="md-bullet"><span>•</span> <span>${line.substring(2)}</span></div>`;
    return line ? `<p>${line}</p>` : '<br/>';
  });
  return renderedLines.join('');
}

function handlePreviewClick(e) {
  const target = e.target;
  const checkRow = target.closest('.md-check');
  
  if (checkRow) {
    e.stopPropagation();
    const lineIndex = parseInt(checkRow.getAttribute('data-line'));
    const lines = props.modelValue.split('\n');
    const line = lines[lineIndex];
    
    if (line.startsWith('- [ ] ')) lines[lineIndex] = line.replace('- [ ] ', '- [x] ');
    else if (line.startsWith('- [x] ')) lines[lineIndex] = line.replace('- [x] ', '- [ ] ');
    
    emit('update:modelValue', lines.join('\n'));
    return;
  }
  
  if (target.closest('a')) {
    e.stopPropagation();
    return;
  }

  startEditing();
}

onMounted(() => {
  adjustHeight();
});

watch(() => props.modelValue, () => {
  nextTick(adjustHeight);
});
</script>

<template>
  <div class="md-editor-container" :class="{ 'is-editing': isFocused || !modelValue }">
    <textarea
      ref="textareaRef"
      :value="modelValue"
      class="ftextarea"
      :placeholder="placeholder"
      @input="[$emit('update:modelValue', $event.target.value), adjustHeight()]"
      @keydown="handleKeydown"
      @focus="isFocused = true"
      @blur="isFocused = false"
    />
    <div 
      class="md-preview" 
      @click="handlePreviewClick"
      v-html="renderMarkdown(modelValue)"
    />
  </div>
</template>

<style scoped>
.md-editor-container {
  display: grid;
  width: 100%;
}

.ftextarea,
.md-preview {
  grid-area: 1 / 1 / 2 / 2;
  min-height: 70px;
  width: 100%;
  padding: 10px;
  font-size: 13px;
  line-height: 1.5;
  border-radius: var(--r-sm);
  transition: border-color 0.12s;
}

.ftextarea {
  resize: none;
  overflow: hidden;
  font-family: inherit;
  z-index: 2;
  background: var(--bg3);
  border: 1px solid var(--border2);
  color: var(--text);
  outline: none;
}

.ftextarea:focus {
  border-color: var(--primary);
}

.md-preview {
  background: var(--bg3);
  border: 1px solid var(--border2);
  color: var(--text);
  cursor: text;
  z-index: 1;
  overflow: hidden;
}

.md-preview:hover {
  border-color: var(--primary);
}

.md-editor-container.is-editing > .md-preview {
  visibility: hidden;
  pointer-events: none;
}

.md-editor-container:not(.is-editing) > .ftextarea {
  visibility: hidden;
  pointer-events: none;
}

/* Markdown Styles inside preview */
:deep(.md-preview) h3, 
:deep(.md-preview) h4, 
:deep(.md-preview) h5, 
:deep(.md-preview) p { 
  margin: 0; 
  padding: 0; 
}
:deep(.md-preview) h3 { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
:deep(.md-preview) h4 { font-size: 14px; font-weight: 700; margin-bottom: 2px; }
:deep(.md-preview) h5 { font-size: 12px; font-weight: 700; }
:deep(.md-preview) br { content: ""; display: block; margin: 0.75em 0; }
:deep(.md-preview) a { color: var(--primary); text-decoration: none; font-weight: 600; }
:deep(.md-preview) a:hover { text-decoration: underline; }
:deep(.md-preview) .md-bullet, 
:deep(.md-preview) .md-check { 
  display: flex; 
  gap: 8px; 
  margin-bottom: 0; 
  align-items: flex-start; 
}
:deep(.md-preview) .md-check {
  cursor: pointer;
  padding: 2px 4px;
  margin-left: -4px;
  border-radius: 4px;
  transition: background 0.1s;
}
:deep(.md-preview) .md-check:hover {
  background: color-mix(in srgb, var(--primary), transparent 92%);
}
:deep(.md-preview) .md-check input {
  cursor: pointer;
}
:deep(.md-preview) .md-bullet span:first-child { 
  color: var(--primary); 
  font-weight: 700; 
  min-width: 12px; 
  text-align: center; 
}
:deep(.md-preview) .md-check input { 
  margin-top: 4px; 
  accent-color: var(--primary); 
  width: 14px; 
  height: 14px; 
}
:deep(.md-preview) .md-check.is-checked span {
  text-decoration: line-through;
  opacity: 0.6;
}
</style>
