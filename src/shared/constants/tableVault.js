export const COLORS = [
  { name: 'Lime', val: '#b8ff57', lightVal: '#61a300', dim: 'rgba(184,255,87,.13)' },
  { name: 'Sky', val: '#57c4ff', lightVal: '#0077b6', dim: 'rgba(87,196,255,.13)' },
  { name: 'Pink', val: '#ff7eb3', lightVal: '#c9184a', dim: 'rgba(255,126,179,.13)' },
  { name: 'Amber', val: '#ffb84d', lightVal: '#b5651d', dim: 'rgba(255,184,77,.13)' },
  { name: 'Violet', val: '#b57bff', lightVal: '#6a0dad', dim: 'rgba(181,123,255,.13)' },
  { name: 'Teal', val: '#3fe0c5', lightVal: '#008080', dim: 'rgba(63,224,197,.13)' },
  { name: 'Coral', val: '#ff6b6b', lightVal: '#d00000', dim: 'rgba(255,107,107,.13)' },
  { name: 'Ice', val: '#ddeeff', lightVal: '#4682b4', dim: 'rgba(221,238,255,.10)' },
];

export const FIELD_TYPES = [
  'text',
  'number',
  'date',
  'url',
  'boolean',
  'select',
  'multiselect',
  'progress',
  'textarea',
  'icon',
  'color',
];
export const THEME_KEY = 'tablevault-theme';
export const HOME_TAG_FILTERS_KEY = 'tablevault-home-tag-filters';
export const RECORD_TAG_FILTERS_KEY_PREFIX = 'tablevault-record-tag-filters:';
export const HOME_FILTER_PREFERENCES_META_KEY = 'homeFilterPreferences';
