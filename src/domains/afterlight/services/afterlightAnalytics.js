export function getTimeOfDay(date = new Date()) {
  const hour = new Date(date).getHours();
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Evening';
  return 'Night';
}

export function getDayType(date = new Date()) {
  const day = new Date(date).getDay();
  return day === 0 || day === 6 ? 'Weekend' : 'WFH';
}

export function toDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatHeaderDate(date = new Date()) {
  return new Date(date).toLocaleDateString('en-PH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatShortDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getEntryTime(entry) {
  const utcValue = entry?.loggedAtUtc || entry?.data?.loggedAtUtc;
  if (utcValue) {
    const time = new Date(utcValue).getTime();
    if (Number.isFinite(time)) return time;
  }
  return Number(entry?.createdAt) || 0;
}

export function formatEntryDateTime(entry) {
  const time = getEntryTime(entry);
  if (!time) return '—';
  return new Date(time).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatRangeLabel(entries) {
  if (!entries.length) return '';
  const sorted = [...entries].sort((a, b) => getEntryTime(a) - getEntryTime(b));
  return `${entries.length} entries · ${formatShortDate(getEntryTime(sorted[0]))} – ${formatShortDate(getEntryTime(sorted[sorted.length - 1]))}`;
}

export function formatDuration(totalMinutes) {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return '—';
  if (totalMinutes >= 1440) return `${(totalMinutes / 1440).toFixed(totalMinutes % 1440 === 0 ? 0 : 1)}d`;
  if (totalMinutes >= 60) return `${(totalMinutes / 60).toFixed(totalMinutes % 60 === 0 ? 0 : 1)}h`;
  return `${Math.round(totalMinutes)}m`;
}

export function filterEntriesByRange(entries, rangeDays) {
  if (!rangeDays) return [...entries];
  const cutoff = Date.now() - rangeDays * 86400000;
  return entries.filter((entry) => getEntryTime(entry) >= cutoff);
}

export function countMulti(entries, key) {
  const counts = {};
  entries.forEach((entry) => {
    (entry[key] || []).forEach((value) => {
      counts[value] = (counts[value] || 0) + 1;
    });
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

export function countSingle(entries, key) {
  const counts = {};
  entries.forEach((entry) => {
    if (!entry[key]) return;
    counts[entry[key]] = (counts[entry[key]] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

export function sumMinutesByMulti(entries, key) {
  const totals = {};
  entries.forEach((entry) => {
    const minutes = Number(entry.minutes) || 0;
    if (!minutes) return;
    (entry[key] || []).forEach((value) => {
      totals[value] = (totals[value] || 0) + minutes;
    });
  });
  return Object.entries(totals).sort((a, b) => b[1] - a[1]);
}

export function sumMinutesBySingle(entries, key) {
  const totals = {};
  entries.forEach((entry) => {
    const minutes = Number(entry.minutes) || 0;
    if (!minutes || !entry[key]) return;
    totals[entry[key]] = (totals[entry[key]] || 0) + minutes;
  });
  return Object.entries(totals).sort((a, b) => b[1] - a[1]);
}

export function countMinuteBuckets(entries) {
  const buckets = {
    '0-15m': 0,
    '16-30m': 0,
    '31-60m': 0,
    '1-2h': 0,
    '2h+': 0,
  };

  entries.forEach((entry) => {
    const minutes = Number(entry.minutes);
    if (!Number.isFinite(minutes) || minutes <= 0) return;
    if (minutes <= 15) buckets['0-15m'] += 1;
    else if (minutes <= 30) buckets['16-30m'] += 1;
    else if (minutes <= 60) buckets['31-60m'] += 1;
    else if (minutes <= 120) buckets['1-2h'] += 1;
    else buckets['2h+'] += 1;
  });

  return Object.entries(buckets).filter(([, count]) => count > 0);
}

export function sumMinutesOverTime(entries) {
  const totals = {};

  entries.forEach((entry) => {
    const minutes = Number(entry.minutes) || 0;
    if (!minutes) return;
    const dateKey = toDateKey(getEntryTime(entry));
    if (!dateKey) return;
    if (!totals[dateKey]) totals[dateKey] = { value: 0, notes: [] };
    totals[dateKey].value += minutes;
    if (entry.notes) totals[dateKey].notes.push(entry.notes);
  });

  return Object.entries(totals)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, info]) => ({
      date,
      label: new Date(`${date}T12:00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
      value: info.value,
      notes: [...new Set(info.notes)].join(' • '),
    }));
}

export function getTrendOutlier(items) {
  if (items.length < 4) return null;
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const top = sorted[0];
  const second = sorted[1];
  if (!second || second.value <= 0) return null;
  return top.value >= second.value * 2 ? top : null;
}

export function buildOverviewStats(entries) {
  const total = entries.length;
  const days = new Set(entries.map((entry) => toDateKey(getEntryTime(entry))).filter(Boolean)).size;
  const topTrigger = countMulti(entries, 'action')[0] || null;
  const topState = countMulti(entries, 'state')[0] || null;
  const topTriggerMinutes = topTrigger
    ? entries.reduce((sum, entry) => sum + ((entry.action || []).includes(topTrigger[0]) ? Number(entry.minutes) || 0 : 0), 0)
    : 0;

  return {
    total,
    days,
    topTrigger,
    topState,
    topTriggerMinutes,
  };
}

export function buildInsights(entries) {
  if (!entries.length) return [];
  const insights = [];
  const topTrigger = countMulti(entries, 'action')[0];
  const topState = countMulti(entries, 'state')[0];
  const topTime = countSingle(entries, 'time')[0];
  const topAgency = countSingle(entries, 'agency')[0];

  if (topTrigger) insights.push(`${topTrigger[0]} is the top trigger at ${topTrigger[1]} entries.`);
  if (topState) insights.push(`${topState[0]} is the most common internal state at ${topState[1]} entries.`);
  if (topTime) insights.push(`${topTime[0]} is the busiest time block with ${topTime[1]} entries.`);
  if (topAgency) insights.push(`${topAgency[0]} is the most common agency type at ${topAgency[1]} entries.`);

  return insights;
}
