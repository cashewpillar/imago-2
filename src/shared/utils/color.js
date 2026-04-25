import { COLORS } from '../constants/tableVault';

export function hexToRgba(hex, alpha) {
  let raw = String(hex || '').replace('#', '');
  if (raw.length === 3) raw = raw.split('').map((ch) => ch + ch).join('');
  if (raw.length !== 6) {
    return `rgba(184,255,87,${alpha})`;
  }
  const num = parseInt(raw, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function getColor(name, isLight = false) {
  const named = COLORS.find((color) => color.name === name);
  if (named) {
    const val = isLight ? named.lightVal : named.val;
    return {
      ...named,
      val,
      dim: hexToRgba(val, isLight ? 0.12 : 0.13),
    };
  }

  if (typeof name === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(name)) {
    return { name, val: name, dim: hexToRgba(name, 0.14) };
  }

  const fallback = COLORS[0];
  const val = isLight ? fallback.lightVal : fallback.val;
  return {
    ...fallback,
    val,
    dim: hexToRgba(val, isLight ? 0.12 : 0.13),
  };
}
