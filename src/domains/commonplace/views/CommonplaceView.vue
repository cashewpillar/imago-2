<script setup>
import { inject, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import CommonplaceConnectionsScreen from '../components/CommonplaceConnectionsScreen.vue';
import CommonplaceLibraryScreen from '../components/CommonplaceLibraryScreen.vue';
import CommonplaceMenuSheet from '../components/CommonplaceMenuSheet.vue';
import CommonplaceMediaDetailScreen from '../components/CommonplaceMediaDetailScreen.vue';
import CommonplaceMediaEditorScreen from '../components/CommonplaceMediaEditorScreen.vue';
import CommonplaceMomentEditorScreen from '../components/CommonplaceMomentEditorScreen.vue';
import CommonplaceTagsScreen from '../components/CommonplaceTagsScreen.vue';
import { commonplaceDb as db, ensureCommonplaceCompatibility as ensureCompatibility, makeUuid } from '../services/commonplaceDb';

const { showToast } = inject('appShell', { showToast: () => {} });

const rootRef = ref(null);
const importInput = ref(null);
const storyImportInput = ref(null);
const importInputId = 'commonplace-import-input';
const storyImportInputId = 'commonplace-story-import-input';

const activeView = ref('home');
const activeTab = ref('home');
const brandHtml = ref('');
const searchOpen = ref(false);
const searchValue = ref('');
const homeTags = ref([]);
const homeSections = ref([]);
const homeEmptyStateHtml = ref('');
const tagGroups = ref([]);
const tagsEmptyStateHtml = ref('No tags yet.<br>Add them when creating moments.');
const connectionGroups = ref([]);
const connectionsEmptyStateHtml = ref('No connections yet.<br>Link moments when adding them.');
const mediaDetail = ref({ id: null, typeLabel: '', title: '', creator: '', reasonHtml: '', tags: [], activeTag: null, countSuffix: '', emptyText: '', moments: [] });
const editorMeta = ref('');
const momentMeta = ref('');
const mediaDetailLabel = ref('');
const mediaEditorTitle = ref('New media');
const momentEditorTitle = ref('New moment');
const menuOpen = ref(false);
const showDistortionModal = ref(false);
const distortionSheetTitle = ref('Cognitive distortion');
const distortionSheetLead = ref('');
const distortionGlossaryExpanded = ref(false);
const distortionGlossaryHtml = ref('');
const distortionTipHtml = ref('');
const distortionTipState = ref({ show: false, left: 0, top: 0, place: 'above', align: 'center' });
const mediaForm = ref({ type: 'book', status: 'in-progress', title: '', creator: '', startedAt: fdtInput(Date.now()), finishedAt: '' });
const momentForm = ref({ anchor: '', date: '', tagInput: '' });
const activeTags = ref([]);
const relationRows = ref([]);
const showMediaDelete = ref(false);
const showMomentDelete = ref(false);

watch([mediaForm, momentForm, activeTags, relationRows], () => {
  saveDraft();
}, { deep: true });

const STORAGE_KEYS = {
  activeView: 'cp-draft-active-view',
  mediaForm: 'cp-draft-media-form',
  momentForm: 'cp-draft-moment-form',
  activeTags: 'cp-draft-active-tags',
  relationRows: 'cp-draft-relation-rows',
  cMediaId: 'cp-draft-c-media-id',
  edMomMediaId: 'cp-draft-ed-mom-media-id',
  mediaReason: 'cp-draft-media-reason',
  momentThought: 'cp-draft-moment-thought',
  momentConn: 'cp-draft-moment-conn',
  momentLine: 'cp-draft-moment-line',
};

function clearDrafts() {
  Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
}

function saveDraft() {
  if (activeView.value === 'med' && !edMediaId) {
    localStorage.setItem(STORAGE_KEYS.activeView, 'med');
    localStorage.setItem(STORAGE_KEYS.mediaForm, JSON.stringify(mediaForm.value));
    localStorage.setItem(STORAGE_KEYS.mediaReason, getBlks('me-reason-blks'));
  } else if (activeView.value === 'momed' && !edMomId) {
    localStorage.setItem(STORAGE_KEYS.activeView, 'momed');
    localStorage.setItem(STORAGE_KEYS.momentForm, JSON.stringify(momentForm.value));
    localStorage.setItem(STORAGE_KEYS.activeTags, JSON.stringify(activeTags.value));
    localStorage.setItem(STORAGE_KEYS.relationRows, JSON.stringify(relationRows.value));
    localStorage.setItem(STORAGE_KEYS.cMediaId, String(cMediaId || ''));
    localStorage.setItem(STORAGE_KEYS.edMomMediaId, String(edMomMediaId || ''));
    localStorage.setItem(STORAGE_KEYS.momentThought, getBlks('mo-thought-blks'));
    localStorage.setItem(STORAGE_KEYS.momentConn, getBlks('mo-conn-blks'));
    localStorage.setItem(STORAGE_KEYS.momentLine, getBlks('mo-line-blks'));
  }
}

function loadDraft() {
  const av = localStorage.getItem(STORAGE_KEYS.activeView);
  if (av === 'med') {
    const form = localStorage.getItem(STORAGE_KEYS.mediaForm);
    const reason = localStorage.getItem(STORAGE_KEYS.mediaReason);
    if (form) {
      mediaForm.value = JSON.parse(form);
      openMediaEditor();
      nextTick(() => renderBlks('me-reason-blks', reason || ''));
    }
  } else if (av === 'momed') {
    const form = localStorage.getItem(STORAGE_KEYS.momentForm);
    const tags = localStorage.getItem(STORAGE_KEYS.activeTags);
    const rels = localStorage.getItem(STORAGE_KEYS.relationRows);
    const mid = localStorage.getItem(STORAGE_KEYS.cMediaId);
    const emid = localStorage.getItem(STORAGE_KEYS.edMomMediaId);
    const thought = localStorage.getItem(STORAGE_KEYS.momentThought);
    const conn = localStorage.getItem(STORAGE_KEYS.momentConn);
    const line = localStorage.getItem(STORAGE_KEYS.momentLine);
    if (form) {
      momentForm.value = JSON.parse(form);
      activeTags.value = JSON.parse(tags || '[]');
      relationRows.value = JSON.parse(rels || '[]');
      cMediaId = mid ? Number(mid) : null;
      edMomMediaId = emid ? Number(emid) : null;
      openMomentEditor(null, edMomMediaId);
      nextTick(() => {
        renderBlks('mo-thought-blks', thought || '');
        renderBlks('mo-conn-blks', conn || '');
        renderBlks('mo-line-blks', line || '');
      });
    }
  }
}

let AM = [];
let AMO = [];
let AR = [];
let cFilter = 'all';
let cTag = null;
let cMediaId = null;
let edMediaId = null;
let edMomId = null;
let edMomMediaId = null;
let mdTag = null;
const curMoStg = ref(1);
const vStack = [];

let activeDistortionMark = null;
let pinnedDistortionMark = null;
let activeDistortionCategory = null;
let activeDistortionAnchorPoint = null;
let distortionHoverTimer = null;
let pendingHoverMark = null;

const DISTORTION_RULES = [
  { category: 'All-or-Nothing', tier: 1, regex: /\b(always|never|everyone|nobody|everything|nothing|entirely|completely|perfect|perfectly|total|totally|absolute|absolutely|every single|not once)\b/gi, tooltip: 'potential all-or-nothing thinking — is this always true?' },
  { category: 'Should Statements', tier: 1, regex: /\b(should|shouldn't|must|mustn't|ought to|have to|has to|had to|supposed to|need to|needs to|have no choice|must always|must never)\b/gi, tooltip: 'potential "should" statement — whose rule is this?' },
  { category: 'Labeling', tier: 1, regex: /\b(loser|failure|idiot|stupid|useless|pathetic|worthless|mess|clown|incompetent|broken|damaged|I'm such a|I am such a|I'm a failure|I'm an idiot|he is a|she is a|they are|you're such a|what is wrong with me|why am I like this|what kind of person)\b/gi, tooltip: 'potential labeling — describing a moment, not a person' },
  { category: 'Personalization', tier: 1, regex: /\b(my fault|blame myself|because of me|responsible for|caused this|if I hadn't|I should have stopped|I should have known|I ruined|it's all me)\b/gi, tooltip: 'potential personalization — are you the only cause here?' },
  { category: 'Catastrophizing', tier: 2, regex: /\b(terrible|awful|horrible|disaster|ruined|catastrophe|nightmare|worst|unbearable|devastating|can't handle|the end of|what if everyone|what if I never|what if it all)\b/gi, tooltip: 'potential catastrophizing — what\'s the realistic outcome?' },
  { category: 'Mind Reading', tier: 2, regex: /(they think|they probably think|I could tell they|they must think|they were judging|everyone noticed|everyone could tell|I know they|she thinks he thinks|they don't like|they hate me|nobody cares|they were laughing at|I just know that|I can tell that)/gi, tooltip: 'potential mind reading — do you know this for certain?' },
  { category: 'Fortune Telling', tier: 2, regex: /(it's going to go wrong|I'll probably fail|it won't work|nothing will change|I'll never be able to|it's pointless|there's no point|it'll end badly|I know how this ends|nothing ever changes|this always ends|it won't matter)/gi, tooltip: 'potential fortune telling — is this a prediction or a fact?' },
  { category: 'Minimization', tier: 2, regex: /(it's fine|I'm fine|no big deal|not a big deal|it's nothing|I don't care|who cares|doesn't matter|not worth thinking about|I shouldn't complain|others have it worse|at least I'm not|could be worse|I'm being dramatic|I'm overreacting|too sensitive|stop being so sensitive)/gi, tooltip: 'potential minimization — are you giving this enough weight?' },
  { category: 'Mental Filtering', tier: 2, regex: /(doesn't count|was just luck|not good enough|they were just being nice|probably felt sorry|anyone could have|would've happened anyway|not because of me|only because they|just got lucky|yeah but|not really that|it was nothing|that doesn't mean|not a big deal)/gi, tooltip: 'potential mental filtering — is there something being discounted?' },
  { category: 'Magnification', tier: 2, regex: /\b(massive|enormous|huge|completely ruined|absolute disaster|total failure|the worst possible|beyond repair|irreparable|everyone will know|my whole life|everything is ruined)\b/gi, tooltip: 'potential magnification — is this being mentally zoomed in?' },
  { category: 'Self-Comparison', tier: 2, regex: /(compared to|not as good as|worse than|better than me|ahead of me|more successful than|has it together|unlike me|everyone else can|other people can|normal people|they make it look|why can't I|how come they|at least they|even they managed|I'm the only one who|no one else struggles with)/gi, tooltip: 'potential self-comparison — comparing your inside to their outside?' },
];

const DISTORTION_GLOSSARY = [
  { key: 'All-or-Nothing', title: 'All-or-Nothing Thinking', body: "Seeing things in black-and-white categories; if a performance isn't perfect, you consider it a total failure." },
  { key: 'Overgeneralization', title: 'Overgeneralization', body: 'Seeing a single negative event (like a bad date) as a never-ending pattern of defeat.' },
  { key: 'Mental Filtering', title: 'Mental Filtering', body: 'Dwelling exclusively on a single negative detail while ignoring all the positive things that happened.' },
  { key: 'Disqualifying the Positive', title: 'Disqualifying the Positive', body: 'Rejecting positive experiences by insisting they "don\'t count" for some reason, maintaining a negative belief.' },
  { key: 'Mind Reading', title: 'Mind Reading', body: 'Assuming you know what others are thinking and that they are reacting negatively to you without any evidence.' },
  { key: 'Fortune Telling', title: 'Fortune Telling', body: 'Predicting that things will turn out badly before they even happen.' },
  { key: 'Catastrophizing', title: 'Catastrophizing', body: 'Blowing things out of proportion or expecting the absolute worst-case scenario to occur.' },
  { key: 'Emotional Reasoning', title: 'Emotional Reasoning', body: 'Assuming that because you feel a certain way, it must be the objective truth.' },
  { key: 'Should Statements', title: '"Should" Statements', body: 'Using "should," "must," or "ought" to pressure yourself, leading to guilt and frustration when you fall short.' },
  { key: 'Labeling', title: 'Labeling', body: 'Assigning a global, highly emotional label to yourself or others instead of describing a specific behavior.' },
  { key: 'Personalization', title: 'Personalization', body: "Holding yourself personally responsible for events that aren't entirely under your control." },
  { key: 'Magnification', title: 'Magnification / Minimization', body: 'Exaggerating the importance of flaws and problems, or shrinking the significance of your own strengths and achievements.' },
  { key: 'Minimization', title: 'Magnification / Minimization', body: 'Exaggerating the importance of flaws and problems, or shrinking the significance of your own strengths and achievements.' },
];

const DISTORTION_GLOSSARY_BY_KEY = Object.fromEntries(DISTORTION_GLOSSARY.map((item) => [item.key, item]));

function get(id) {
  return rootRef.value?.querySelector(`#${id}`) || null;
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function smart(t) {
  return t
    .replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018')
    .replace(/'/g, '\u2019')
    .replace(/(^|[-\u2014/(\[{"\s])"/g, '$1\u201c')
    .replace(/"/g, '\u201d')
    .replace(/--/g, '\u2014');
}

function fdt(ts) {
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fdtFull(ts) {
  const d = new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const t = new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${d}, ${t}`;
}

function fdtLocal(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fdtInput(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fdtRef() {
  return `${new Date().toISOString()}: `;
}

function ar(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}

function sortTags(tags) {
  return [...new Set((tags || []).map((t) => String(t || '').trim().toLowerCase()).filter(Boolean))].sort();
}

function normText(v) {
  return String(v || '').trim();
}

function mediaFingerprint(item) {
  return JSON.stringify([normText(item.type).toLowerCase(), normText(item.title).toLowerCase(), normText(item.creator).toLowerCase(), normText(item.reason)]);
}

function momentFingerprint(item, mediaStableKey) {
  return JSON.stringify([mediaStableKey || '', normText(item.anchor), normText(item.thought), normText(item.connection), normText(item.line), sortTags(item.tags), Number(item.createdAt) || 0]);
}

function relationFingerprint(item, fromStableKey, toStableKey) {
  return JSON.stringify([fromStableKey || '', toStableKey || '', normText(item.label)]);
}

function safeNumId(v) {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function stableMediaKey(item) {
  return item && (item.uuid || (safeNumId(item.id) != null ? `legacy-media:${item.id}` : mediaFingerprint(item)));
}

function stableMomentKey(item) {
  return item && (item.uuid || (safeNumId(item.id) != null ? `legacy-moment:${item.id}` : null));
}

function storyTagToCommonplace(tag) {
  const cleaned = String(tag || '').trim().replace(/^#+/, '');
  return cleaned ? cleaned.toLowerCase() : '';
}

function storyStanceLabel(stance) {
  return ({ yes: 'agree', complicated: 'complicated', no: 'disagree' })[stance] || stance;
}

function storyBooksFromImport(data) {
  if (data && Array.isArray(data.books)) return data.books.filter((book) => book && book.title && Array.isArray(book.notes));
  if (data && data.title && Array.isArray(data.notes)) return [data];
  return [];
}

function getStrColor(s) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = s.charCodeAt(i) + ((h << 5) - h);
  return `hsl(${Math.abs(h) % 360}, 55%, 38%)`;
}

function parseRefLabel(label, contextTs = null, absoluteIso = null) {
  if (absoluteIso) {
    const parsedIso = new Date(absoluteIso);
    if (!Number.isNaN(parsedIso.getTime())) return parsedIso;
  }
  const match = String(label || '').trim().match(/^(\d{1,2}) ([A-Za-z]{3}), (\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, dayStr, monthStr, hourStr, minuteStr] = match;
  const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(monthStr);
  if (monthIndex === -1) return null;
  const now = new Date();
  const yearSource = contextTs ? new Date(contextTs) : now;
  const year = yearSource.getFullYear();
  let parsed = new Date(year, monthIndex, Number(dayStr), Number(hourStr), Number(minuteStr));
  if (parsed.getTime() - now.getTime() > 36 * 60 * 60 * 1000) parsed = new Date(year - 1, monthIndex, Number(dayStr), Number(hourStr), Number(minuteStr));
  return parsed;
}

function normalizeLegacyRefsInText(text, baseTs = null) {
  const source = String(text || '');
  if (!source) return { value: source, count: 0 };
  let refAnchorTs = baseTs || null;
  let count = 0;
  const value = source.replace(/\((\d{1,2} [A-Za-z]{3}, \d{2}:\d{2}): (.*?)\)/g, (full, label, body) => {
    const parsed = parseRefLabel(label, refAnchorTs);
    if (!parsed) return full;
    refAnchorTs = parsed.getTime();
    count += 1;
    return `(${parsed.toISOString()}: ${body})`;
  });
  return { value, count };
}

function formatRelativeLater(fromTs, toTs) {
  if (!fromTs || !toTs) return null;
  const delta = Math.max(0, toTs - fromTs);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;
  if (delta < hour) return `${Math.max(1, Math.round(delta / minute))}m later`;
  if (delta < day) return `${Math.max(1, Math.round(delta / hour))}h later`;
  if (delta < week) return `${Math.max(1, Math.round(delta / day))}d later`;
  if (delta < month * 1.5) return `${Math.max(1, Math.round(delta / week))}w later`;
  if (delta < year) return `${Math.max(1, Math.round(delta / month))}mo later`;
  return `${Math.max(1, Math.round(delta / year))}y later`;
}

function formatRefAbsolute(ts) {
  return new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function cleanTextValue(value) {
  return String(value || '').replace(/\r\n/g, '\n').trim();
}

function normalizeForCompare(value) {
  return cleanTextValue(value)
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitParagraphs(value) {
  const text = cleanTextValue(value);
  return text ? text.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean) : [];
}

function tokenSimilarity(a, b) {
  const aTokens = normalizeForCompare(a).split(' ').filter(Boolean);
  const bTokens = normalizeForCompare(b).split(' ').filter(Boolean);
  if (!aTokens.length && !bTokens.length) return 1;
  if (!aTokens.length || !bTokens.length) return 0;
  const aCounts = new Map();
  aTokens.forEach((token) => aCounts.set(token, (aCounts.get(token) || 0) + 1));
  let overlap = 0;
  bTokens.forEach((token) => {
    const count = aCounts.get(token) || 0;
    if (count > 0) {
      overlap += 1;
      aCounts.set(token, count - 1);
    }
  });
  return (2 * overlap) / (aTokens.length + bTokens.length);
}

function buildParagraphConflict(localParagraph, importedParagraph) {
  return [
    '**[Conflict retained below]**',
    '**Import:**',
    importedParagraph,
    '**Local:**',
    localParagraph,
  ].join('\n');
}

function mergeTextPreservingBoth(localValue, importedValue) {
  const localText = cleanTextValue(localValue);
  const importedText = cleanTextValue(importedValue);
  if (!localText) return { value: importedText, changed: Boolean(importedText) };
  if (!importedText) return { value: localText, changed: false };
  if (localText === importedText) return { value: localText, changed: false };
  if (normalizeForCompare(localText) === normalizeForCompare(importedText)) {
    return { value: localText.length >= importedText.length ? localText : importedText, changed: localText.length < importedText.length };
  }
  if (localText.includes(importedText)) return { value: localText, changed: false };
  if (importedText.includes(localText)) return { value: importedText, changed: true };
  if (localText.includes('[Conflict retained below]') || (localText.includes('Imported version:') && localText.includes('Local version:'))) {
    return { value: localText, changed: false };
  }

  const localParagraphs = splitParagraphs(localText);
  const importedParagraphs = splitParagraphs(importedText);
  if (localParagraphs.length && importedParagraphs.length && Math.abs(localParagraphs.length - importedParagraphs.length) <= 1) {
    const mergedParagraphs = [];
    const maxLength = Math.max(localParagraphs.length, importedParagraphs.length);
    let paragraphChanged = false;
    let hardConflict = false;
    for (let index = 0; index < maxLength; index += 1) {
      const localParagraph = localParagraphs[index] || '';
      const importedParagraph = importedParagraphs[index] || '';
      if (!localParagraph && importedParagraph) {
        mergedParagraphs.push(importedParagraph);
        paragraphChanged = true;
        continue;
      }
      if (localParagraph && !importedParagraph) {
        mergedParagraphs.push(localParagraph);
        continue;
      }
      const normalizedLocal = normalizeForCompare(localParagraph);
      const normalizedImported = normalizeForCompare(importedParagraph);
      if (normalizedLocal === normalizedImported) {
        mergedParagraphs.push(localParagraph.length >= importedParagraph.length ? localParagraph : importedParagraph);
        if (localParagraph.length < importedParagraph.length) paragraphChanged = true;
        continue;
      }
      if (normalizedLocal.includes(normalizedImported)) {
        mergedParagraphs.push(localParagraph);
        continue;
      }
      if (normalizedImported.includes(normalizedLocal)) {
        mergedParagraphs.push(importedParagraph);
        paragraphChanged = true;
        continue;
      }
      const similarity = tokenSimilarity(localParagraph, importedParagraph);
      if (similarity >= 0.72) {
        mergedParagraphs.push(buildParagraphConflict(localParagraph, importedParagraph));
        paragraphChanged = true;
      } else {
        hardConflict = true;
        break;
      }
    }
    if (!hardConflict) {
      const mergedParagraphText = mergedParagraphs.join('\n\n');
      return { value: mergedParagraphText, changed: paragraphChanged && mergedParagraphText !== localText };
    }
  }

  const merged = `Imported version:\n${importedText}\n\nLocal version:\n${localText}`;
  if (localText === merged) return { value: localText, changed: false };
  return { value: merged, changed: true };
}

function mergeScalarPreferLocal(localValue, importedValue) {
  const localText = cleanTextValue(localValue);
  const importedText = cleanTextValue(importedValue);
  if (!localText && importedText) return { value: importedText, changed: true };
  return { value: localValue, changed: false };
}

function mergeTagLists(localTags, importedTags) {
  const merged = sortTags([...(localTags || []), ...(importedTags || [])]);
  const current = sortTags(localTags || []);
  return { value: merged, changed: JSON.stringify(merged) !== JSON.stringify(current) };
}

function distortionRegex(rule) {
  return new RegExp(rule.regex.source.replace(/'/g, "['\\u2019]"), rule.regex.flags);
}

function collectDistortionMatches(text) {
  const matches = [];
  DISTORTION_RULES.forEach((rule) => {
    const regex = distortionRegex(rule);
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (!match[0]) {
        regex.lastIndex += 1;
        continue;
      }
      matches.push({ start: match.index, end: match.index + match[0].length, category: rule.category, tier: rule.tier, tooltip: rule.tooltip });
    }
  });
  return matches.sort((a, b) => a.start - b.start || b.end - a.end || a.category.localeCompare(b.category));
}

function buildDistortionFragment(text) {
  const matches = collectDistortionMatches(text);
  if (!matches.length) return null;
  const points = new Set([0, text.length]);
  matches.forEach((match) => { points.add(match.start); points.add(match.end); });
  const cuts = [...points].sort((a, b) => a - b);
  const frag = document.createDocumentFragment();
  for (let i = 0; i < cuts.length - 1; i += 1) {
    const start = cuts[i];
    const end = cuts[i + 1];
    if (start === end) continue;
    const segmentText = text.slice(start, end);
    const covering = matches.filter((match) => match.start < end && match.end > start);
    if (!covering.length) {
      frag.appendChild(document.createTextNode(segmentText));
      continue;
    }
    const unique = [];
    const seen = new Set();
    covering.forEach((match) => {
      const key = `${match.category}|${match.tooltip}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(match);
      }
    });
    const mark = document.createElement('span');
    mark.className = `cdh-mark ${unique.some((match) => match.tier === 1) ? 'cdh-tier1' : 'cdh-tier2'}`;
    mark.tabIndex = 0;
    mark.setAttribute('role', 'button');
    mark.setAttribute('aria-label', unique.map((match) => match.tooltip).join(' '));
    mark.dataset.matches = encodeURIComponent(JSON.stringify(unique.map((match) => ({ category: match.category, tooltip: match.tooltip, tier: match.tier }))));
    mark.appendChild(document.createTextNode(segmentText));
    frag.appendChild(mark);
  }
  return frag;
}

function applyDistortionHighlights(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest('.cdh-mark, .cdh-tip, script, style')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach((node) => {
    const frag = buildDistortionFragment(node.nodeValue);
    if (frag) node.replaceWith(frag);
  });
}

function parseMd(t, baseTs = null, meta = null) {
  let refAnchorTs = baseTs || null;
  const taskAttr = meta ? `data-id="${meta.id}" data-type="${meta.type}" data-field="${meta.field}"` : '';

  const lines = t.split('\n');
  const hLines = lines.map((line, idx) => {
    let hl;
    const taskMatch = line.match(/^- \[([ x])\] (.*)$/);
    if (taskMatch) {
      const checked = taskMatch[1] === 'x';
      const content = esc(smart(taskMatch[2]));
      hl = `<span class="task-item" ${taskAttr} data-line="${idx}" data-state="${checked ? 'checked' : 'unchecked'}"><input type="checkbox" class="task-checkbox" ${checked ? 'checked' : ''} readonly> <span>${content}</span></span>`;
    } else {
      hl = esc(smart(line));
      hl = hl.replace(/^- (.*)$/, '• $1');
    }

    // Ref parsing
    hl = hl.replace(/\(([0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:.]+Z): (.*?)\)/g, (full, absoluteIso, body) => {
      const parsed = parseRefLabel('', refAnchorTs, absoluteIso);
      const label = parsed ? fdtFull(parsed.getTime()) : absoluteIso;
      const rel = parsed && refAnchorTs ? formatRelativeLater(refAnchorTs, parsed.getTime()) : label;
      if (parsed) refAnchorTs = parsed.getTime();
      const title = parsed ? formatRefAbsolute(parsed.getTime()) : absoluteIso;
      return `<span class="note ref"><span class="ref-ts" title="${esc(title)}">${esc(rel)}</span>${body}</span>`;
    });
    hl = hl.replace(/\((\d{1,2} [A-Za-z]{3}, \d{2}:\d{2})(?:\|([0-9TZ:.\-]+))?: (.*?)\)/g, (full, label, absoluteIso, body) => {
      const parsed = parseRefLabel(label, refAnchorTs, absoluteIso || null);
      const rel = parsed && refAnchorTs ? formatRelativeLater(refAnchorTs, parsed.getTime()) : label;
      if (parsed) refAnchorTs = parsed.getTime();
      const title = parsed ? formatRefAbsolute(parsed.getTime()) : label;
      return `<span class="note ref"><span class="ref-ts" title="${esc(title)}">${esc(rel)}</span>${body}</span>`;
    });

    return hl;
  });

  let h = hLines.join('\n');
  h = h.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  h = h.replace(/__(.*?)__/g, '<u>$1</u>');
  h = h.replace(/\*(.*?)\*/g, '<i>$1</i>');
  h = h.replace(/^---$/gm, '<hr>');
  h = h.replace(/\((.*?)\)/g, '<span class="note">($1)</span>');

  const container = document.createElement('div');
  container.innerHTML = h.replace(/\n/g, '<br>');
  applyDistortionHighlights(container);
  return container.innerHTML;
}

function clearTip() {
  distortionTipHtml.value = '';
  distortionTipState.value = { ...distortionTipState.value, show: false };
}

function closeDistortionTips(exceptEl = null) {
  if (distortionHoverTimer) {
    clearTimeout(distortionHoverTimer);
    distortionHoverTimer = null;
  }
  pendingHoverMark = null;
  rootRef.value?.querySelectorAll('.cdh-mark.is-open').forEach((el) => { if (el !== exceptEl) el.classList.remove('is-open'); });
  if (!exceptEl) {
    activeDistortionMark = null;
    pinnedDistortionMark = null;
    activeDistortionAnchorPoint = null;
  }
  if (!exceptEl || activeDistortionMark !== exceptEl) clearTip();
}

function positionDistortionTip(mark, anchorPoint = null) {
  const tip = get('cdh-tip');
  if (!mark || !tip || !distortionTipState.value.show) return;
  const rect = mark.getBoundingClientRect();
  const tipRect = tip.getBoundingClientRect();
  const margin = 12;
  const anchorCenter = anchorPoint?.x ?? (rect.left + rect.width / 2);
  const anchorLeft = Math.max(margin, anchorPoint?.x ?? rect.left);
  const anchorRight = Math.min(window.innerWidth - margin, anchorPoint?.x ?? rect.right);
  const spaceLeft = anchorCenter - margin;
  const spaceRight = window.innerWidth - margin - anchorCenter;
  let left = anchorCenter;
  let align = 'center';
  if (tipRect.width / 2 > spaceLeft) {
    left = anchorLeft;
    align = 'left';
  } else if (tipRect.width / 2 > spaceRight) {
    left = anchorRight;
    align = 'right';
  }
  const anchorTop = anchorPoint?.y ?? rect.top;
  const anchorBottom = anchorPoint?.y ?? rect.bottom;
  const fitsAbove = anchorTop - tipRect.height - 10 >= margin;
  const top = fitsAbove ? anchorTop - 10 : Math.min(window.innerHeight - margin - tipRect.height, anchorBottom + 10);
  distortionTipState.value = { show: true, left, top: Math.max(margin, top), place: fitsAbove ? 'above' : 'below', align };
}

function showDistortionTip(mark, anchorPoint = null) {
  const items = JSON.parse(decodeURIComponent(mark.dataset.matches || '%5B%5D'));
  if (!items.length) return;
  distortionTipHtml.value = items.map((item) => `
    <span class="cdh-tip-item">
      <span class="cdh-tip-copy">${esc(item.tooltip)}</span>
      <button class="cdh-tip-link" data-category="${esc(item.category)}" type="button">Learn more</button>
    </span>
  `).join('');
  distortionTipState.value = { ...distortionTipState.value, show: true };
  activeDistortionMark = mark;
  if (anchorPoint) activeDistortionAnchorPoint = anchorPoint;
  requestAnimationFrame(() => positionDistortionTip(mark, anchorPoint || activeDistortionAnchorPoint));
}

function openDistortionTip(mark, { pinned = false, anchorPoint = null } = {}) {
  if (distortionHoverTimer) clearTimeout(distortionHoverTimer);
  pendingHoverMark = null;
  rootRef.value?.querySelectorAll('.cdh-mark.is-open').forEach((el) => { if (el !== mark) el.classList.remove('is-open'); });
  mark.classList.add('is-open');
  if (pinned) pinnedDistortionMark = mark;
  showDistortionTip(mark, anchorPoint);
}

function renderDistortionGlossary() {
  const current = DISTORTION_GLOSSARY_BY_KEY[activeDistortionCategory] || DISTORTION_GLOSSARY[0];
  distortionSheetTitle.value = current.title;
  distortionSheetLead.value = current.body;
  distortionGlossaryHtml.value = distortionGlossaryExpanded.value
    ? DISTORTION_GLOSSARY.filter((item) => item.key !== current.key).map((item) => `<div class="cdh-sheet-item"><h4>${esc(item.title)}</h4><p>${esc(item.body)}</p></div>`).join('')
    : '';
}

function openDistortionLearnMore(category) {
  activeDistortionCategory = category;
  distortionGlossaryExpanded.value = false;
  renderDistortionGlossary();
  showDistortionModal.value = true;
  closeDistortionTips();
}

function closeDistortionLearnMore() {
  showDistortionModal.value = false;
}

function toggleDistortionGlossary() {
  distortionGlossaryExpanded.value = !distortionGlossaryExpanded.value;
  renderDistortionGlossary();
}

function allTags() {
  const s = new Set();
  AMO.forEach((m) => (m.tags || []).forEach((t) => s.add(t)));
  return [...s].sort();
}

function momsFor(mid) {
  return AMO.filter((m) => m.mediaId === mid);
}

function momsByTag(t) {
  return AMO.filter((m) => (m.tags || []).includes(t));
}

async function loadAll() {
  await ensureCompatibility();
  [AM, AMO, AR] = await Promise.all([db.media.orderBy('createdAt').reverse().toArray(), db.moments.orderBy('createdAt').toArray(), db.relations.toArray()]);
  const now = new Date();
  brandHtml.value = `${now.toLocaleDateString('en-GB', { weekday: 'long' })} <i>${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</i>`;
  renderHome();
  if (activeTab.value === 'tags') renderTags();
  if (activeTab.value === 'connections') renderConns();
  if (activeView.value === 'mdetail' && cMediaId) renderMD(cMediaId);
}

function renderTagRow() {
  const counts = {};
  let untagged = 0;
  AMO.forEach((m) => {
    if (!m.tags || !m.tags.length) untagged += 1;
    else m.tags.forEach((t) => { counts[t] = (counts[t] || 0) + 1; });
  });
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const chips = [];
  if (untagged > 0) chips.push({ key: '_untagged', label: 'Untagged', count: untagged });
  chips.push(...sorted.map(([t, n]) => ({ key: t, label: `#${t}`, count: n })));
  homeTags.value = chips;
}

function renderList() {
  let media = AM;
  if (cFilter !== 'all') media = media.filter((m) => m.type === cFilter);
  if (cTag) {
    const matchMids = new Set(AMO.filter((m) => (cTag === '_untagged' ? !m.tags || !m.tags.length : (m.tags || []).includes(cTag))).map((m) => m.mediaId));
    media = media.filter((m) => matchMids.has(m.id));
  }
  if (searchValue.value.trim()) {
    const q = searchValue.value.toLowerCase();
    const matchMids = new Set(AMO.filter((m) => (m.thought || '').toLowerCase().includes(q) || (m.connection || '').toLowerCase().includes(q) || (m.line || '').toLowerCase().includes(q) || (m.anchor || '').toLowerCase().includes(q) || (m.tags || []).some((t) => t.includes(q))).map((m) => m.mediaId));
    media = media.filter((m) => (m.title || '').toLowerCase().includes(q) || (m.creator || '').toLowerCase().includes(q) || matchMids.has(m.id));
  }
  if (!media.length) {
    homeSections.value = [];
    homeEmptyStateHtml.value = searchValue.value || cTag ? 'Nothing matches.' : 'Nothing yet.<br>Tap + to add your first piece of media.';
    return;
  }
  const TL = { book: 'Book', film: 'Film', tv: 'TV', other: 'Other' };
  const groups = [
    ['Not started', media.filter((m) => m.status === 'not-started')],
    ['In Progress', media.filter((m) => (m.status || 'in-progress') === 'in-progress')],
    ['On hold', media.filter((m) => m.status === 'on-hold')],
    ['Done', media.filter((m) => m.status === 'done')],
  ];
  homeEmptyStateHtml.value = '';
  homeSections.value = groups.map(([title, list]) => {
    if (!list.length) return null;
    return {
      title,
      items: list.map((m) => {
      const moms = momsFor(m.id);
      const reason = m.reason ? m.reason.split('\n')[0] : '';
      return {
        id: m.id,
        title: m.title || 'Untitled',
        typeLabel: TL[m.type] || m.type,
        creator: m.creator || '',
        momentCountLabel: `${moms.length} moment${moms.length !== 1 ? 's' : ''}`,
        preview: reason ? `${reason.slice(0, 100)}${reason.length > 100 ? '…' : ''}` : '',
        borderColor: getStrColor(m.title),
      };
    }),
    };
  }).filter(Boolean);
}

function renderHome() {
  renderTagRow();
  renderList();
}

function renderMomCard(mo) {
  const rels = AR.filter((r) => r.fromId === mo.id || r.toId === mo.id);
  const tags = mo.tags || [];
  const med = AM.find((m) => m.id === mo.mediaId);
  return {
    id: mo.id,
    mediaId: mo.mediaId,
    mediaTitle: med ? med.title : '',
    anchor: mo.anchor || '—',
    dateLabel: fdt(mo.createdAt),
    thoughtHtml: mo.thought ? parseMd(mo.thought, mo.createdAt, { id: mo.id, type: 'moment', field: 'thought' }) : '',
    connectionHtml: mo.connection ? parseMd(mo.connection, mo.createdAt, { id: mo.id, type: 'moment', field: 'connection' }) : '',
    lineHtml: mo.line ? parseMd(mo.line, mo.createdAt, { id: mo.id, type: 'moment', field: 'line' }) : '',
    tags,
    relations: rels.map((r) => relChip(r, mo.id)),
  };
}

function relChip(r, moId) {
  const otherId = r.fromId === moId ? r.toId : r.fromId;
  const other = AMO.find((m) => m.id === otherId);
  const otherM = other ? AM.find((m) => m.id === other.mediaId) : null;
  const lbl = r.fromId === moId ? r.label : `← ${r.label}`;
  return { targetId: otherId, label: lbl, targetTitle: otherM ? otherM.title.slice(0, 18) : '?' };
}

function renderMD(id) {
  const m = AM.find((x) => x.id === id);
  if (!m) return;
  mediaDetailLabel.value = m.title || 'Untitled';
  const allMoms = momsFor(id);
  const counts = {};
  let untagged = 0;
  allMoms.forEach((mo) => {
    if (!mo.tags || !mo.tags.length) untagged += 1;
    else mo.tags.forEach((t) => { counts[t] = (counts[t] || 0) + 1; });
  });
  const sortedTags = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  let moms = [...allMoms].sort((a, b) => b.createdAt - a.createdAt);
  if (mdTag) moms = mdTag === '_untagged' ? moms.filter((mo) => !mo.tags || !mo.tags.length) : moms.filter((mo) => (mo.tags || []).includes(mdTag));
  const TL = { book: 'Book', film: 'Film', tv: 'TV series', other: 'Other' };
  const tags = [];
  if (untagged > 0) tags.push({ key: '_untagged', label: 'Untagged', count: untagged });
  tags.push(...sortedTags.map(([t, n]) => ({ key: t, label: `#${t}`, count: n })));
  mediaDetail.value = {
    id,
    typeLabel: TL[m.type] || m.type,
    title: m.title || 'Untitled',
    creator: m.creator || '',
    startedAtLabel: m.startedAt ? fdt(m.startedAt) : '',
    finishedAtLabel: m.finishedAt ? fdt(m.finishedAt) : '',
    reasonHtml: m.reason ? parseMd(m.reason, m.createdAt, { id: m.id, type: 'media', field: 'reason' }) : '',
    tags,
    activeTag: mdTag,
    countSuffix: mdTag ? `(${moms.length})` : '',
    emptyText: mdTag ? 'No moments match this filter.' : 'No moments yet. Add your first one above.',
    moments: moms.map((mo) => renderMomCard(mo)),
  };
}

function renderTags() {
  renderTagRow();
  let tags = allTags();
  if (cTag) {
    if (cTag === '_untagged') {
      tags = [];
    } else {
      tags = tags.filter((t) => t === cTag);
    }
  }

  if (!tags.length && cTag !== '_untagged') {
    tagGroups.value = [];
    return;
  }

  const groups = tags.map((t) => {
    const moms = momsByTag(t);
    return {
      tag: t,
      count: moms.length,
      items: moms.map((mo) => renderMomCard(mo)),
    };
  });

  if (cTag === '_untagged' || (!cTag && AMO.some((m) => !m.tags || !m.tags.length))) {
    const untagged = AMO.filter((m) => !m.tags || !m.tags.length);
    if (untagged.length) {
      groups.push({
        tag: 'Untagged',
        count: untagged.length,
        items: untagged.map((mo) => renderMomCard(mo)),
      });
    }
  }
  tagGroups.value = groups;
}

function renderConns() {
  if (!AR.length) {
    connectionGroups.value = [];
    return;
  }
  const byLbl = {};
  AR.forEach((r) => {
    const l = r.label || 'related';
    if (!byLbl[l]) byLbl[l] = [];
    byLbl[l].push(r);
  });
  connectionGroups.value = Object.entries(byLbl).map(([lbl, rels]) => ({
    label: lbl,
    items: rels.map((r) => {
    const from = AMO.find((m) => m.id === r.fromId);
    const to = AMO.find((m) => m.id === r.toId);
    const fromM = from ? AM.find((m) => m.id === from.mediaId) : null;
    const toM = to ? AM.find((m) => m.id === to.mediaId) : null;
    const fp = from ? (from.thought || from.connection || from.line || '') : '';
    return {
      id: r.fromId,
      anchor: from && from.anchor ? from.anchor : '—',
      title: fromM ? fromM.title : '?',
      preview: fp ? `${fp.slice(0, 80)}${fp.length > 80 ? '…' : ''}` : '',
      badge: `${lbl} →`,
      toText: `${toM ? toM.title : '?'}${to && to.anchor ? ` / ${to.anchor}` : ''}`,
    };
  }),
  }));
}

function scrollToTop() {
  requestAnimationFrame(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  });
}

function openMedia(id) {
  cMediaId = id;
  mdTag = null;
  renderMD(id);
  activeView.value = 'mdetail';
  vStack.push('mdetail');
  scrollToTop();
}

function setFilter(filter) {
  cFilter = filter;
  cTag = null;
  renderHome();
}

function toggleTag(tag) {
  cTag = cTag === tag ? null : tag;
  if (activeTab.value === 'home') renderHome();
  if (activeTab.value === 'tags') renderTags();
}

function setMdTag(tag) {
  mdTag = mdTag === tag ? null : tag;
  renderMD(cMediaId);
}

function switchTab(tab) {
  activeTab.value = tab;
  activeView.value = tab;
  if (tab === 'home') renderHome();
  if (tab === 'tags') renderTags();
  if (tab === 'connections') renderConns();
  vStack.length = 0;
  vStack.push(tab);
  scrollToTop();
}

function back() {
  vStack.pop();
  const prev = vStack[vStack.length - 1] || 'home';
  activeView.value = prev;
  if (prev === 'home') activeTab.value = 'home';
  if (prev === 'tags') activeTab.value = 'tags';
  if (prev === 'connections') activeTab.value = 'connections';
  if (prev === 'mdetail' && cMediaId) renderMD(cMediaId);
}

function renderBlks(cid, text, baseTs = null) {
  const c = get(cid);
  if (!c) return;
  if (baseTs) c.dataset.baseTs = String(baseTs);
  else delete c.dataset.baseTs;
  c.innerHTML = '';
  const ps = (text || '').split(/\n\n+/);
  ps.forEach((p) => addBlk(cid, p));
  if (!c.children.length) addBlk(cid, '');
}

function addBlk(cid, val = '', focus = false, afterEl = null) {
  const c = get(cid);
  if (!c) return;
  const div = document.createElement('div');
  div.className = 'block-wrap';
  const ta = document.createElement('textarea');
  ta.className = 'ta';
  ta.placeholder = 'Paragraph…';
  ta.value = val;
  const view = document.createElement('div');
  view.className = 'ta-view';
  const remove = document.createElement('button');
  remove.className = 'block-rm';
  remove.type = 'button';
  remove.textContent = '×';
  ta.addEventListener('input', () => taInput(ta));
  ta.addEventListener('blur', () => bView(ta, view, c.dataset.baseTs ? Number(c.dataset.baseTs) : null));
  ta.addEventListener('keydown', (event) => blkKey(event, ta));
  view.addEventListener('click', (event) => {
    if (event.target.closest('.cdh-mark, .cdh-tip-link, a, button, .task-item')) return;
    bEdit(ta, view, event);
  });
  remove.addEventListener('click', () => rmBlk(div));
  div.append(ta, view, remove);
  if (afterEl) afterEl.after(div);
  else c.appendChild(div);
  if (val) bView(ta, view, c.dataset.baseTs ? Number(c.dataset.baseTs) : null);
  else {
    ta.classList.remove('off');
    view.classList.remove('on');
    ar(ta);
  }
  if (focus) {
    ta.focus();
    ta.selectionStart = ta.selectionEnd = ta.value.length;
  }
  return ta;
}

function rmBlk(el) {
  const c = el.parentElement;
  el.remove();
  if (c && !c.children.length) addBlk(c.id, '');
}

function taInput(el) {
  ar(el);
  const start = el.selectionStart;
  const val = el.value;
  const cor = { im: "I'm", dont: "don't", cant: "can't", wont: "won't", wouldnt: "wouldn't", couldnt: "couldn't", shouldnt: "shouldn't", aint: "ain't" };
  let nv = val;
  Object.keys(cor).forEach((key) => { nv = nv.replace(new RegExp(`\\b${key}(\\s)`, 'g'), `${cor[key]}$1`); });
  nv = nv.replace(/\bi(\s)/g, 'I$1');
  if (nv !== val) {
    el.value = nv;
    el.selectionStart = el.selectionEnd = start + (nv.length - val.length);
  }
  saveDraft();
}

function mapOffset(source, rendered, targetOffset) {
  let s = 0;
  let r = 0;
  while (r < targetOffset && s < source.length) {
    const sc = source[s];
    const rc = rendered[r];
    if (sc === rc) { s++; r++; }
    else if (['*', '_', '`', '~'].includes(sc)) { s++; }
    else if (sc === "'" && (rc === '\u2018' || rc === '\u2019')) { s++; r++; }
    else if (sc === '"' && (rc === '\u201c' || rc === '\u201d')) { s++; r++; }
    else if (sc === '-' && source[s + 1] === '-' && rc === '\u2014') { s += 2; r++; }
    else if (sc === '-' && rc === '•') { s++; r++; }
    else { s++; }
  }
  return s;
}

function bEdit(ta, v, event) {
  let startOffset = ta.value.length;
  let endOffset = ta.value.length;

  if (event) {
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (v.contains(range.startContainer)) {
        const preStart = range.cloneRange();
        preStart.selectNodeContents(v);
        preStart.setEnd(range.startContainer, range.startOffset);
        startOffset = mapOffset(ta.value, v.textContent, preStart.toString().length);

        if (!range.collapsed && v.contains(range.endContainer)) {
          const preEnd = range.cloneRange();
          preEnd.selectNodeContents(v);
          preEnd.setEnd(range.endContainer, range.endOffset);
          endOffset = mapOffset(ta.value, v.textContent, preEnd.toString().length);
        } else {
          endOffset = startOffset;
        }
      }
    }
  }

  ta.classList.remove('off');
  v.classList.remove('on');
  ar(ta);
  ta.focus();
  ta.setSelectionRange(startOffset, endOffset);
}

function bView(ta, v, baseTs = null) {
  if (!ta.value.trim()) {
    ta.classList.remove('off');
    v.classList.remove('on');
    return;
  }
  ta.classList.add('off');
  v.innerHTML = parseMd(ta.value, baseTs);
  v.classList.add('on');
}

function blkKey(e, ta) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    const start = ta.selectionStart;
    const val = ta.value;
    const before = val.substring(0, start);
    const after = val.substring(start);
    ta.value = before;
    taInput(ta);
    bView(ta, ta.nextElementSibling, ta.parentElement.parentElement.dataset.baseTs ? Number(ta.parentElement.parentElement.dataset.baseTs) : null);
    const newTa = addBlk(ta.parentElement.parentElement.id, after, true, ta.parentElement);
    if (after) {
      newTa.setSelectionRange(0, 0);
    }
    saveDraft();
  }
  if (e.key === 'Backspace' && !ta.value && ta.parentElement.previousElementSibling) {
    e.preventDefault();
    const prev = ta.parentElement.previousElementSibling;
    ta.parentElement.remove();
    const pTa = prev.querySelector('textarea');
    bEdit(pTa, prev.querySelector('.ta-view'));
  }
  if (e.key === '(') {
    const cid = ta.parentElement.parentElement.id;
    const isMoment = cid.startsWith('mo-');
    if (isMoment) {
      const isFirstEntry = ta.parentElement === ta.parentElement.parentElement.firstElementChild;
      if (!edMomId || isFirstEntry) return;
    }

    e.preventDefault();
    const ts = fdtRef();
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    ta.value = `${ta.value.substring(0, start)}(${ts}${ta.value.substring(end)}`;
    ta.selectionStart = ta.selectionEnd = start + ts.length + 1;
    ar(ta);
  }
}

function getBlks(cid) {
  return [...(get(cid)?.querySelectorAll('textarea') || [])].map((t) => t.value.trim()).filter(Boolean).join('\n\n');
}

function copyBlks(cid) {
  const text = getBlks(cid);
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to clipboard');
  });
}

function apBlock(cid, text) {
  const c = get(cid);
  let act = c?.querySelector('textarea:not(.off)');
  if (!act && c?.lastElementChild) act = c.lastElementChild.querySelector('textarea');
  if (!act) return;
  bEdit(act, act.nextElementSibling);
  if (act.value && !act.value.endsWith('\n')) act.value += '\n';
  act.value += text;
  act.focus();
  act.selectionStart = act.selectionEnd = act.value.length;
  ar(act);
  saveDraft();
}

async function openMediaEditor(id = null) {
  edMediaId = id;
  mediaEditorTitle.value = id ? 'Edit media' : 'New media';
  showMediaDelete.value = Boolean(id);
  let reasonText = '';
  let reasonBaseTs = Date.now();
  if (id) {
    const m = AM.find((x) => x.id === id);
    mediaForm.value = { 
      type: m.type || 'book', 
      status: m.status || 'in-progress', 
      title: m.title || '', 
      creator: m.creator || '',
      startedAt: fdtInput(m.startedAt),
      finishedAt: fdtInput(m.finishedAt),
    };
    editorMeta.value = fdtFull(m.createdAt);
    reasonText = m.reason || '';
    reasonBaseTs = m.createdAt;
  } else {
    mediaForm.value = { type: 'book', status: 'in-progress', title: '', creator: '', startedAt: fdtInput(Date.now()), finishedAt: '' };
    editorMeta.value = '';
  }
  activeView.value = 'med';
  vStack.push('med');
  await nextTick();
  if (!id) saveDraft();
  renderBlks('me-reason-blks', reasonText, reasonBaseTs);
  scrollToTop();
}

async function saveMedia() {
  const title = mediaForm.value.title.trim();
  if (!title) {
    showToast('Add a title first', 'error');
    return;
  }
  const existing = edMediaId ? AM.find((x) => x.id === edMediaId) : null;
  const startedAt = mediaForm.value.startedAt ? new Date(mediaForm.value.startedAt).getTime() : null;
  const finishedAt = mediaForm.value.finishedAt ? new Date(mediaForm.value.finishedAt).getTime() : null;
  const data = { 
    uuid: existing?.uuid || makeUuid(), 
    type: mediaForm.value.type, 
    status: mediaForm.value.status, 
    title, 
    creator: mediaForm.value.creator.trim(), 
    startedAt,
    finishedAt,
    reason: getBlks('me-reason-blks'), 
    createdAt: existing?.createdAt || Date.now(), 
    updatedAt: Date.now() 
  };
  if (edMediaId) {
    await db.media.update(edMediaId, data);
    showToast('Updated', 'success');
    await loadAll();
    back();
  } else {
    const id = await db.media.add(data);
    cMediaId = id;
    showToast('Added', 'success');
    clearDrafts();
    await loadAll();
    openMedia(id);
  }
  edMediaId = null;
}

async function delMedia() {
  if (!window.confirm('Delete this entire piece of media and all its moments?')) return;
  const moments = await db.moments.where('mediaId').equals(edMediaId).toArray();
  const momIds = moments.map((m) => m.id);
  await db.media.delete(edMediaId);
  await db.moments.where('mediaId').equals(edMediaId).delete();
  for (const mid of momIds) {
    await db.relations.where('fromId').equals(mid).delete();
    await db.relations.where('toId').equals(mid).delete();
  }
  edMediaId = null;
  showToast('Media deleted', 'success');
  await loadAll();
  switchTab('home');
}

function setMoStage(s) {
  curMoStg.value = s;
}

function addTagFromInput() {
  const v = momentForm.value.tagInput.trim().replace(/\s+/g, '').toLowerCase();
  if (v && !activeTags.value.includes(v)) activeTags.value = sortTags([...activeTags.value, v]);
  momentForm.value.tagInput = '';
}

function tryCommitTagsFromInput() {
  const raw = String(momentForm.value.tagInput || '');
  if (!raw) return;
  const endsWithSeparator = /[\s,;]$/.test(raw);
  if (!endsWithSeparator) return;
  const parts = raw.split(/[\s,;]+/).map((part) => part.trim().toLowerCase()).filter(Boolean);
  if (!parts.length) {
    momentForm.value.tagInput = '';
    return;
  }
  activeTags.value = sortTags([...activeTags.value, ...parts]);
  momentForm.value.tagInput = '';
}

function commitRemainingTagInput() {
  const raw = String(momentForm.value.tagInput || '').trim();
  if (!raw) return;
  const parts = raw.split(/[\s,;]+/).map((part) => part.trim().toLowerCase()).filter(Boolean);
  if (!parts.length) {
    momentForm.value.tagInput = '';
    return;
  }
  activeTags.value = sortTags([...activeTags.value, ...parts]);
  momentForm.value.tagInput = '';
}

function handleTagKey(e) {
  if ((e.key === ' ' || e.key === 'Enter') && momentForm.value.tagInput.trim()) {
    e.preventDefault();
    addTagFromInput();
  }
}

function removeTag(index) {
  activeTags.value = activeTags.value.filter((_, i) => i !== index);
}

function momentOptions() {
  const currentTags = activeTags.value;
  return AMO.filter((m) => m.id !== edMomId)
    .filter((m) => {
      if (!currentTags.length) return true;
      return (m.tags || []).some((t) => currentTags.includes(t));
    })
    .map((m) => {
      const med = AM.find((x) => x.id === m.mediaId);
      return { id: m.id, label: `${med ? med.title : '?'} / ${m.anchor || fdt(m.createdAt)}` };
    });
}

async function openMomentEditor(momId = null, mediaId = cMediaId) {
  edMomId = momId;
  edMomMediaId = mediaId;
  relationRows.value = [];
  activeTags.value = [];
  momentEditorTitle.value = momId ? 'Edit moment' : 'New moment';
  showMomentDelete.value = Boolean(momId);
  let thoughtText = '';
  let connectionText = '';
  let lineText = '';
  let blockBaseTs = Date.now();
  if (momId) {
    const mo = AMO.find((x) => x.id === momId);
    momentForm.value = { anchor: mo.anchor || '', date: fdtLocal(mo.createdAt), tagInput: '' };
    activeTags.value = [...(mo.tags || [])];
    relationRows.value = AR.filter((r) => r.fromId === momId).map((r) => ({ label: r.label, toId: r.toId, uuid: r.uuid }));
    momentMeta.value = fdtFull(mo.createdAt);
    thoughtText = mo.thought || '';
    connectionText = mo.connection || '';
    lineText = mo.line || '';
    blockBaseTs = mo.createdAt;
    curMoStg.value = 2;
  } else {
    const now = Date.now();
    momentForm.value = { anchor: '', date: fdtLocal(now), tagInput: '' };
    momentMeta.value = '';
    blockBaseTs = now;
    curMoStg.value = 1;
  }
  activeView.value = 'momed';
  vStack.push('momed');
  await nextTick();
  if (!momId) saveDraft();
  renderBlks('mo-thought-blks', thoughtText, blockBaseTs);
  renderBlks('mo-conn-blks', connectionText, blockBaseTs);
  renderBlks('mo-line-blks', lineText, blockBaseTs);
  scrollToTop();
}

async function saveMoment() {
  const existing = edMomId ? AMO.find((x) => x.id === edMomId) : null;
  const media = AM.find((x) => x.id === edMomMediaId);
  const createdAt = momentForm.value.date ? new Date(momentForm.value.date).getTime() : (existing?.createdAt || Date.now());
  const data = { uuid: existing?.uuid || makeUuid(), mediaId: edMomMediaId, mediaUuid: media?.uuid || existing?.mediaUuid || null, anchor: momentForm.value.anchor.trim(), thought: getBlks('mo-thought-blks'), connection: getBlks('mo-conn-blks'), line: getBlks('mo-line-blks'), tags: sortTags(activeTags.value), createdAt, updatedAt: Date.now() };
  let mid = edMomId;
  if (mid) await db.moments.update(mid, data);
  else mid = await db.moments.add(data);
  if (edMomId) {
    const old = await db.relations.where('fromId').equals(edMomId).toArray();
    for (const r of old) await db.relations.delete(r.id);
  }
  for (const r of relationRows.value) {
    if (r.toId && r.label) {
      const target = AMO.find((x) => x.id === r.toId);
      await db.relations.add({ uuid: r.uuid || makeUuid(), fromId: mid, toId: Number(r.toId), fromUuid: data.uuid, toUuid: target?.uuid || null, label: r.label });
    }
  }
  showToast(edMomId ? 'Moment updated' : 'Moment saved', 'success');
  if (!edMomId) clearDrafts();
  await loadAll();
  renderMD(edMomMediaId || cMediaId);
  back();
}

async function delMoment() {
  if (!window.confirm('Delete this moment?')) return;
  await db.moments.delete(edMomId);
  const rels = AR.filter((r) => r.fromId === edMomId || r.toId === edMomId);
  for (const r of rels) await db.relations.delete(r.id);
  showToast('Deleted', 'success');
  await loadAll();
  renderMD(edMomMediaId || cMediaId);
  back();
}

async function jumpTo(mid) {
  await loadAll();
  const mo = AMO.find((m) => m.id === mid);
  if (!mo) return;
  cMediaId = mo.mediaId;
  renderMD(mo.mediaId);
  activeView.value = 'mdetail';
  vStack.length = 0;
  vStack.push('home', 'mdetail');
  requestAnimationFrame(() => {
    const el = get(`mc-${mid}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('hl');
      window.setTimeout(() => el.classList.remove('hl'), 900);
    }
  });
}

async function handleImport(file) {
  const d = JSON.parse(await file.text());
  const media = d.media || [];
  const moments = d.moments || [];
  const rels = d.relations || [];
  await ensureCompatibility();
  const [existingMedia, existingMoments, existingRelations] = await Promise.all([db.media.toArray(), db.moments.toArray(), db.relations.toArray()]);
  const mediaByUuid = new Map(existingMedia.filter((x) => x.uuid).map((x) => [x.uuid, x]));
  const mediaByFingerprint = new Map(existingMedia.map((x) => [mediaFingerprint(x), x]));
  const momentByUuid = new Map(existingMoments.filter((x) => x.uuid).map((x) => [x.uuid, x]));
  const relationByUuid = new Map(existingRelations.filter((x) => x.uuid).map((x) => [x.uuid, x]));
  const momentByFingerprint = new Map();
  existingMoments.forEach((x) => {
    const mediaItem = existingMedia.find((m) => m.id === x.mediaId);
    momentByFingerprint.set(momentFingerprint(x, stableMediaKey(mediaItem)), x);
  });
  const relationByFingerprint = new Map();
  existingRelations.forEach((x) => {
    const from = existingMoments.find((m) => m.id === x.fromId);
    const to = existingMoments.find((m) => m.id === x.toId);
    relationByFingerprint.set(relationFingerprint(x, stableMomentKey(from), stableMomentKey(to)), x);
  });
  const medMap = {};
  const momMap = {};
  let addedMedia = 0; let addedMoments = 0; let addedRelations = 0; let mergedMedia = 0; let mergedMoments = 0; let skippedMedia = 0; let skippedMoments = 0; let skippedRelations = 0;
  for (const item of media) {
    const uuid = item.uuid || null;
    const fp = mediaFingerprint(item);
    let existing = (uuid && mediaByUuid.get(uuid)) || mediaByFingerprint.get(fp);
    if (existing) {
      const updates = {};
      if (uuid && !existing.uuid) updates.uuid = uuid;
      if (!existing.type && item.type) updates.type = item.type;
      if (!existing.status && item.status) updates.status = item.status;
      if (!cleanTextValue(existing.title) && cleanTextValue(item.title)) updates.title = item.title;
      if (!cleanTextValue(existing.creator) && cleanTextValue(item.creator)) updates.creator = item.creator;
      const mergedReason = mergeTextPreservingBoth(existing.reason, item.reason);
      if (mergedReason.changed) updates.reason = mergedReason.value;
      if (Object.keys(updates).length) {
        updates.updatedAt = Date.now();
        await db.media.update(existing.id, updates);
        existing = { ...existing, ...updates };
        mergedMedia += 1;
      } else {
        skippedMedia += 1;
      }
      medMap[item.id] = existing.id;
      mediaByFingerprint.set(mediaFingerprint(existing), existing);
      continue;
    }
    const payload = { uuid: uuid || makeUuid(), type: item.type || 'book', status: item.status || 'in-progress', title: item.title || '', creator: item.creator || '', reason: item.reason || '', createdAt: item.createdAt || Date.now(), updatedAt: item.updatedAt || item.createdAt || Date.now() };
    const newId = await db.media.add(payload);
    const inserted = { ...payload, id: newId };
    medMap[item.id] = newId;
    existingMedia.push(inserted);
    mediaByUuid.set(inserted.uuid, inserted);
    mediaByFingerprint.set(mediaFingerprint(inserted), inserted);
    addedMedia += 1;
  }
  for (const item of moments) {
    const mappedMediaId = medMap[item.mediaId];
    if (!mappedMediaId) continue;
    const parentMedia = existingMedia.find((m) => m.id === mappedMediaId);
    const uuid = item.uuid || null;
    const fp = momentFingerprint(item, stableMediaKey(parentMedia));
    let existing = (uuid && momentByUuid.get(uuid)) || momentByFingerprint.get(fp);
    if (existing) {
      const updates = {};
      if (uuid && !existing.uuid) updates.uuid = uuid;
      if (!existing.mediaUuid && item.mediaUuid) updates.mediaUuid = item.mediaUuid;
      const mergedAnchor = mergeScalarPreferLocal(existing.anchor, item.anchor);
      if (mergedAnchor.changed) updates.anchor = mergedAnchor.value;
      const mergedThought = mergeTextPreservingBoth(existing.thought, item.thought);
      if (mergedThought.changed) updates.thought = mergedThought.value;
      const mergedConnection = mergeTextPreservingBoth(existing.connection, item.connection);
      if (mergedConnection.changed) updates.connection = mergedConnection.value;
      const mergedLine = mergeTextPreservingBoth(existing.line, item.line);
      if (mergedLine.changed) updates.line = mergedLine.value;
      const mergedTags = mergeTagLists(existing.tags, item.tags);
      if (mergedTags.changed) updates.tags = mergedTags.value;
      if (Object.keys(updates).length) {
        updates.updatedAt = Date.now();
        await db.moments.update(existing.id, updates);
        existing = { ...existing, ...updates };
        mergedMoments += 1;
      } else {
        skippedMoments += 1;
      }
      momMap[item.id] = existing.id;
      momentByFingerprint.set(momentFingerprint(existing, stableMediaKey(parentMedia)), existing);
      continue;
    }
    const payload = { uuid: uuid || makeUuid(), mediaId: mappedMediaId, mediaUuid: item.mediaUuid || parentMedia?.uuid || null, anchor: item.anchor || '', thought: item.thought || '', connection: item.connection || '', line: item.line || '', tags: sortTags(item.tags), createdAt: item.createdAt || Date.now(), updatedAt: item.updatedAt || item.createdAt || Date.now() };
    const newId = await db.moments.add(payload);
    const inserted = { ...payload, id: newId };
    momMap[item.id] = newId;
    existingMoments.push(inserted);
    momentByUuid.set(inserted.uuid, inserted);
    momentByFingerprint.set(momentFingerprint(inserted, stableMediaKey(parentMedia)), inserted);
    addedMoments += 1;
  }
  for (const item of rels) {
    const mappedFromId = momMap[item.fromId];
    const mappedToId = momMap[item.toId];
    if (!mappedFromId || !mappedToId) continue;
    const from = existingMoments.find((m) => m.id === mappedFromId);
    const to = existingMoments.find((m) => m.id === mappedToId);
    const fp = relationFingerprint(item, stableMomentKey(from) || '', stableMomentKey(to) || '');
    if ((item.uuid && relationByUuid.get(item.uuid)) || relationByFingerprint.get(fp)) {
      skippedRelations += 1;
      continue;
    }
    await db.relations.add({ uuid: item.uuid || makeUuid(), fromId: mappedFromId, toId: mappedToId, fromUuid: item.fromUuid || from?.uuid || null, toUuid: item.toUuid || to?.uuid || null, label: item.label || '' });
    addedRelations += 1;
  }
  await loadAll();
  showToast(`Imported ${addedMedia} media, ${addedMoments} moments, ${addedRelations} links · merged ${mergedMedia + mergedMoments} · skipped ${skippedMedia + skippedMoments + skippedRelations}`, 'success');
}

async function handleStoryImport(file) {
  const data = JSON.parse(await file.text());
  const books = storyBooksFromImport(data);
  if (!books.length) {
    showToast('No Story books found in file', 'error');
    return;
  }
  await ensureCompatibility();
  const [existingMedia, existingMoments] = await Promise.all([db.media.toArray(), db.moments.toArray()]);
  const mediaByFingerprint = new Map(existingMedia.map((x) => [mediaFingerprint(x), x]));
  const momentByFingerprint = new Map();
  existingMoments.forEach((x) => {
    const mediaItem = existingMedia.find((m) => m.id === x.mediaId);
    momentByFingerprint.set(momentFingerprint(x, stableMediaKey(mediaItem)), x);
  });
  let addedMedia = 0; let addedMoments = 0; let mergedMedia = 0; let mergedMoments = 0; let skippedMoments = 0;
  for (const book of books) {
    const noteDates = (book.notes || []).map((note) => Number(note.date) || 0).filter(Boolean);
    const bookCreatedAt = noteDates.length ? Math.min(...noteDates) : Date.now();
    const mediaPayload = { type: 'book', title: book.title || 'Untitled', creator: book.author || '', reason: '' };
    const mediaFp = mediaFingerprint(mediaPayload);
    let mediaItem = mediaByFingerprint.get(mediaFp);
    if (!mediaItem) {
      const payload = { uuid: makeUuid(), ...mediaPayload, status: 'in-progress', createdAt: bookCreatedAt, updatedAt: Date.now() };
      const newId = await db.media.add(payload);
      mediaItem = { ...payload, id: newId };
      existingMedia.push(mediaItem);
      mediaByFingerprint.set(mediaFp, mediaItem);
      addedMedia += 1;
    } else if (!cleanTextValue(mediaItem.creator) && cleanTextValue(book.author)) {
      const updates = { creator: book.author, updatedAt: Date.now() };
      await db.media.update(mediaItem.id, updates);
      mediaItem = { ...mediaItem, ...updates };
      mediaByFingerprint.set(mediaFp, mediaItem);
      mergedMedia += 1;
    }
    for (const note of (book.notes || [])) {
      const thoughtParts = [];
      if (note.meaning) thoughtParts.push(String(note.meaning).trim());
      if (note.stance) thoughtParts.push(`Take: ${storyStanceLabel(note.stance)}`);
      if (note.stanceNote) thoughtParts.push(String(note.stanceNote).trim());
      const momentPayload = { mediaId: mediaItem.id, mediaUuid: mediaItem.uuid || null, anchor: note.location || '', thought: thoughtParts.filter(Boolean).join('\n\n'), connection: '', line: note.text || '', tags: sortTags((note.tags || []).map(storyTagToCommonplace).filter(Boolean)), createdAt: note.date || Date.now(), updatedAt: note.date || Date.now() };
      const fp = momentFingerprint(momentPayload, stableMediaKey(mediaItem));
      const existing = momentByFingerprint.get(fp);
      if (existing) {
        const updates = {};
        const mergedAnchor = mergeScalarPreferLocal(existing.anchor, momentPayload.anchor);
        if (mergedAnchor.changed) updates.anchor = mergedAnchor.value;
        const mergedThought = mergeTextPreservingBoth(existing.thought, momentPayload.thought);
        if (mergedThought.changed) updates.thought = mergedThought.value;
        const mergedLine = mergeTextPreservingBoth(existing.line, momentPayload.line);
        if (mergedLine.changed) updates.line = mergedLine.value;
        const mergedTags = mergeTagLists(existing.tags, momentPayload.tags);
        if (mergedTags.changed) updates.tags = mergedTags.value;
        if (Object.keys(updates).length) {
          updates.updatedAt = Date.now();
          await db.moments.update(existing.id, updates);
          const mergedExisting = { ...existing, ...updates };
          momentByFingerprint.set(momentFingerprint(mergedExisting, stableMediaKey(mediaItem)), mergedExisting);
          mergedMoments += 1;
        } else {
          skippedMoments += 1;
        }
        continue;
      }
      const insertPayload = { uuid: makeUuid(), ...momentPayload };
      const newId = await db.moments.add(insertPayload);
      const inserted = { ...insertPayload, id: newId };
      existingMoments.push(inserted);
      momentByFingerprint.set(fp, inserted);
      addedMoments += 1;
    }
  }
  await loadAll();
  showToast(`Imported ${addedMedia} books, ${addedMoments} moments · merged ${mergedMedia + mergedMoments} · skipped ${skippedMoments}`, 'success');
}

async function resetData() {
  menuOpen.value = false;
  if (!window.confirm('DANGER: Delete ALL media, moments, and connections? This cannot be undone.')) return;
  await Promise.all([db.media.clear(), db.moments.clear(), db.relations.clear()]);
  await loadAll();
  switchTab('home');
  showToast('All data cleared', 'success');
}

async function normalizeLegacyRefs() {
  closeMenu();
  if (!window.confirm('Normalize legacy inline note references to ISO UTC format? Existing display will stay human-friendly.')) return;

  const [media, moments] = await Promise.all([db.media.toArray(), db.moments.toArray()]);
  let changedRecords = 0;
  let normalizedRefs = 0;

  for (const item of media) {
    const reason = normalizeLegacyRefsInText(item.reason || '', item.createdAt || null);
    if (!reason.count) continue;
    await db.media.update(item.id, { reason: reason.value, updatedAt: Date.now() });
    changedRecords += 1;
    normalizedRefs += reason.count;
  }

  for (const item of moments) {
    const thought = normalizeLegacyRefsInText(item.thought || '', item.createdAt || null);
    const connection = normalizeLegacyRefsInText(item.connection || '', item.createdAt || null);
    const line = normalizeLegacyRefsInText(item.line || '', item.createdAt || null);
    const updates = {};
    if (thought.count) updates.thought = thought.value;
    if (connection.count) updates.connection = connection.value;
    if (line.count) updates.line = line.value;
    const refCount = thought.count + connection.count + line.count;
    if (!refCount) continue;
    updates.updatedAt = Date.now();
    await db.moments.update(item.id, updates);
    changedRecords += 1;
    normalizedRefs += refCount;
  }

  await loadAll();
  showToast(
    normalizedRefs
      ? `Normalized ${normalizedRefs} reference${normalizedRefs === 1 ? '' : 's'} across ${changedRecords} record${changedRecords === 1 ? '' : 's'}`
      : 'No legacy references found',
    'success',
  );
}

async function toggleTask(id, type, field, lineIdx) {
  const table = type === 'moment' ? db.moments : db.media;
  const item = await table.get(Number(id));
  if (item && item[field]) {
    const lines = item[field].split('\n');
    if (lines[lineIdx]) {
      const line = lines[lineIdx];
      if (line.startsWith('- [ ] ')) {
        lines[lineIdx] = `- [x] ${line.slice(6)}`;
      } else if (line.startsWith('- [x] ')) {
        lines[lineIdx] = `- [ ] ${line.slice(6)}`;
      }
      const newText = lines.join('\n');
      if (newText !== item[field]) {
        await table.update(Number(id), { [field]: newText, updatedAt: Date.now() });
        await loadAll();
      }
    }
  }
}

function handleRootClick(e) {
  const taskItem = e.target.closest('.task-item');
  if (taskItem) {
    const editorView = e.target.closest('.ta-view');
    if (editorView) {
      const ta = editorView.parentElement.querySelector('textarea');
      const lineIdx = parseInt(taskItem.dataset.line, 10);
      if (ta && lineIdx !== undefined) {
        const lines = ta.value.split('\n');
        const line = lines[lineIdx];
        if (line.startsWith('- [ ] ')) lines[lineIdx] = `- [x] ${line.slice(6)}`;
        else if (line.startsWith('- [x] ')) lines[lineIdx] = `- [ ] ${line.slice(6)}`;
        ta.value = lines.join('\n');
        bView(ta, editorView, editorView.parentElement.parentElement.dataset.baseTs ? Number(editorView.parentElement.parentElement.dataset.baseTs) : null);
        return;
      }
    }

    const { id, type, field, line } = taskItem.dataset;
    if (id && type && field && line !== undefined) {
      toggleTask(id, type, field, parseInt(line, 10));
      return;
    }
  }
  const learnMore = e.target.closest('.cdh-tip-link');
  if (learnMore) {
    e.preventDefault();
    openDistortionLearnMore(learnMore.dataset.category);
    return;
  }
  const mark = e.target.closest('.cdh-mark');
  if (mark) {
    e.preventDefault();
    if (pinnedDistortionMark === mark) closeDistortionTips();
    else openDistortionTip(mark, { pinned: true, anchorPoint: { x: e.clientX, y: e.clientY } });
    return;
  }
  closeDistortionTips();
}

function openMomentFromTag(tag) {
  cTag = tag;
  mdTag = null;
  switchTab('tags');
}

function handleRootMouseOver(e) {
  const mark = e.target.closest('.cdh-mark');
  if (!mark || pinnedDistortionMark === mark) return;
  if (distortionHoverTimer) clearTimeout(distortionHoverTimer);
  showDistortionTip(mark);
  pendingHoverMark = mark;
  distortionHoverTimer = setTimeout(() => {
    if (pendingHoverMark === mark) openDistortionTip(mark, { pinned: true });
  }, 1000);
}

function isWithinActiveZone(node) {
  const tip = get('cdh-tip');
  return !!((activeDistortionMark && activeDistortionMark.contains(node)) || tip?.contains(node));
}

function handleRootMouseOut(e) {
  const mark = e.target.closest('.cdh-mark');
  if (!mark) return;
  if (pendingHoverMark === mark && !isWithinActiveZone(e.relatedTarget)) {
    clearTimeout(distortionHoverTimer);
    pendingHoverMark = null;
  }
  if (pinnedDistortionMark === mark || isWithinActiveZone(e.relatedTarget)) return;
  if (activeDistortionMark === mark) closeDistortionTips();
}

function handleRootKeyDown(e) {
  if (e.key === 'Escape') {
    if (showDistortionModal.value) closeDistortionLearnMore();
    else closeDistortionTips();
  }
}

function handleSearchToggle() {
  searchOpen.value = !searchOpen.value;
  if (!searchOpen.value) {
    searchValue.value = '';
    renderList();
  }
}

function cancelEditor() {
  clearDrafts();
  back();
}

function updateSearch() {
  renderList();
}

function openMenu() {
  menuOpen.value = true;
}

function closeMenu() {
  menuOpen.value = false;
}

async function performExport() {
  closeMenu();
  const [media, moments, relations] = await Promise.all([db.media.toArray(), db.moments.toArray(), db.relations.toArray()]);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ version: 2, exported: new Date().toISOString(), media, moments, relations }, null, 2)], { type: 'application/json' }));
  a.download = `commonplace-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  showToast('Exported', 'success');
}

function handleImportPick(e) {
  const file = e.target.files?.[0];
  if (file) handleImport(file).catch((error) => {
    console.error(error);
    showToast('Could not read file', 'error');
  });
  closeMenu();
  e.target.value = '';
}

function handleStoryImportPick(e) {
  const file = e.target.files?.[0];
  if (file) handleStoryImport(file).catch((error) => {
    console.error(error);
    showToast('Could not read Story file', 'error');
  });
  closeMenu();
  e.target.value = '';
}

function onWindowMove() {
  if (activeDistortionMark) positionDistortionTip(activeDistortionMark, activeDistortionAnchorPoint);
}

onMounted(async () => {
  rootRef.value.addEventListener('click', handleRootClick, true);
  rootRef.value.addEventListener('mouseover', handleRootMouseOver);
  rootRef.value.addEventListener('mouseout', handleRootMouseOut);
  rootRef.value.addEventListener('keydown', handleRootKeyDown);
  window.addEventListener('scroll', onWindowMove, { passive: true });
  window.addEventListener('resize', onWindowMove);
  vStack.push('home');
  await loadAll();
  loadDraft();
});

onBeforeUnmount(() => {
  rootRef.value?.removeEventListener('click', handleRootClick, true);
  rootRef.value?.removeEventListener('mouseover', handleRootMouseOver);
  rootRef.value?.removeEventListener('mouseout', handleRootMouseOut);
  rootRef.value?.removeEventListener('keydown', handleRootKeyDown);
  window.removeEventListener('scroll', onWindowMove);
  window.removeEventListener('resize', onWindowMove);
});
</script>

<template>
  <div ref="rootRef" class="cp-domain" tabindex="-1">
    <CommonplaceLibraryScreen
      v-if="activeView === 'home'"
      :brand-html="brandHtml"
      :search-open="searchOpen"
      :search-value="searchValue"
      :current-filter="cFilter"
      :home-sections="homeSections"
      :empty-state-html="homeEmptyStateHtml"
      :active-tab="activeTab"
      @toggle-search="handleSearchToggle"
      @update:search-value="searchValue = $event; updateSearch()"
      @set-filter="setFilter"
      @open-menu="openMenu"
      @open-media-editor="openMediaEditor()"
      @open-media="openMedia"
      @switch-tab="switchTab"
    />

    <CommonplaceTagsScreen
      v-else-if="activeView === 'tags'"
      :brand-html="brandHtml"
      :home-tags="homeTags"
      :active-tag="cTag"
      :tag-groups="tagGroups"
      :empty-state-html="tagsEmptyStateHtml"
      :active-tab="activeTab"
      @open-menu="openMenu"
      @open-moment="openMomentEditor($event.id, $event.mediaId)"
      @open-tag="openMomentFromTag"
      @jump="jumpTo"
      @toggle-tag="toggleTag"
      @switch-tab="switchTab"
      @toast="showToast($event)"
    />

    <CommonplaceConnectionsScreen
      v-else-if="activeView === 'connections'"
      :brand-html="brandHtml"
      :connection-groups="connectionGroups"
      :empty-state-html="connectionsEmptyStateHtml"
      :active-tab="activeTab"
      @open-menu="openMenu"
      @open-moment="jumpTo"
      @switch-tab="switchTab"
    />

    <CommonplaceMediaDetailScreen
      v-else-if="activeView === 'mdetail'"
      :media-detail-label="mediaDetailLabel"
      :media-detail="mediaDetail"
      @back="back"
      @edit-media="openMediaEditor(cMediaId)"
      @toggle-tag="setMdTag"
      @add-moment="openMomentEditor(null, $event)"
      @open-moment="openMomentEditor($event.id, $event.mediaId)"
      @open-tag="openMomentFromTag"
      @jump="jumpTo"
    />

    <CommonplaceMediaEditorScreen
      v-else-if="activeView === 'med'"
      :title="mediaEditorTitle"
      :meta="editorMeta"
      :media-form="mediaForm"
      :show-media-delete="showMediaDelete"
      @back="cancelEditor"
      @delete-media="delMedia"
      @save-media="saveMedia"
      @copy-blocks="copyBlks"
    />

    <CommonplaceMomentEditorScreen
      v-else-if="activeView === 'momed'"
      :title="momentEditorTitle"
      :meta="momentMeta"
      :cur-mo-stg="curMoStg"
      :moment-form="momentForm"
      :active-tags="activeTags"
      :all-tags="allTags()"
      :relation-rows="relationRows"
      :show-moment-delete="showMomentDelete"
      :moment-options="momentOptions()"
      @back="cancelEditor"
      @delete-moment="delMoment"
      @save-moment="saveMoment"
      @set-stage="setMoStage"
      @handle-tag-input="tryCommitTagsFromInput"
      @handle-tag-key="handleTagKey"
      @commit-tag-input="commitRemainingTagInput"
      @remove-tag="removeTag"
      @copy-blocks="copyBlks"
      @add-relation="relationRows.push({ label: '', toId: null })"
      @remove-relation="relationRows.splice($event, 1)"
    />

    <CommonplaceMenuSheet
      :open="menuOpen"
      :import-input-id="importInputId"
      :story-import-input-id="storyImportInputId"
      @close="closeMenu"
      @export="performExport"
      @normalize-refs="normalizeLegacyRefs"
      @reset="resetData"
    />

    <input :id="importInputId" ref="importInput" type="file" accept=".json" class="cp-file-input" @change="handleImportPick">
    <input :id="storyImportInputId" ref="storyImportInput" type="file" accept=".json" class="cp-file-input" @change="handleStoryImportPick">

    <div
      id="cdh-tip"
      class="cdh-tip"
      :class="{ show: distortionTipState.show }"
      :data-place="distortionTipState.place"
      :data-align="distortionTipState.align"
      :style="{ left: `${distortionTipState.left}px`, top: `${distortionTipState.top}px` }"
      v-html="distortionTipHtml"
    ></div>

    <div class="cdh-modal" :class="{ open: showDistortionModal }" @click.self="closeDistortionLearnMore">
      <div class="cdh-sheet">
        <div class="handle"></div>
        <div class="cdh-sheet-head">
          <div><div class="cdh-sheet-k">Learn more</div><div class="cdh-sheet-title">{{ distortionSheetTitle }}</div></div>
          <button class="cdh-sheet-close" @click="closeDistortionLearnMore">×</button>
        </div>
        <div class="cdh-sheet-lead">{{ distortionSheetLead }}</div>
        <div class="cdh-sheet-actions"><button class="cdh-sheet-btn" @click="toggleDistortionGlossary">{{ distortionGlossaryExpanded ? 'Show less' : 'See all' }}</button></div>
        <div class="cdh-sheet-all" :style="{ display: distortionGlossaryExpanded ? 'block' : 'none' }"><div class="cdh-sheet-list" v-html="distortionGlossaryHtml"></div></div>
      </div>
    </div>
  </div>
</template>

<style>
@import '../styles/commonplace.css';

.cp-file-input {
  position: fixed;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
  left: -9999px;
  top: -9999px;
}
</style>
