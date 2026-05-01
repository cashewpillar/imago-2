export function parseSelectOptions(value) {
  const list = Array.isArray(value) ? value : String(value || '').split(',');
  return [...new Set(list.map((item) => String(item).trim()).filter(Boolean))];
}

export const EMPTY_FILTER_VALUE = '__empty__';
export const IMPORT_TARGET_SKIP = '__skip__';
export const IMPORT_TARGET_CREATE = '__create__';

function normalizeMaxlength(value) {
  const next = Number.parseInt(value, 10);
  return Number.isFinite(next) && next > 0 ? next : undefined;
}

function getEmptyFilterLabel(label) {
  return `No ${label || 'value'}`;
}

export function getDefaultTableMetaFields() {
  return [
    { key: 'name', label: 'Name', type: 'text', row: 'identity', locked: true },
    { key: 'icon', label: 'Icon', type: 'icon', compact: true, row: 'identity', locked: true },
    { key: 'color', label: 'Color', type: 'color', locked: true },
  ];
}

export function sanitizeTableMetaSchema(fields) {
  return (fields || []).map((field, index) => {
    const base = {
      ...field,
      key: field?.key || `meta_${Date.now()}_${index}`,
      label: field?.label || 'Field',
      type: field?.type || 'text',
      row: field?.row ? String(field.row).trim() || null : null,
      compact: !!field?.compact,
      locked: !!field?.locked,
      maxlength: normalizeMaxlength(field?.maxlength),
    };
    return {
      ...base,
      type: base.type === 'tags' ? 'multiselect' : base.type,
      options: ['select', 'multiselect'].includes(base.type)
        ? parseSelectOptions(
            typeof field?.optionsText === 'string' ? field.optionsText : base.options || '',
          )
        : [],
    };
  });
}

export function normalizeField(field, index = 0) {
  const incomingType = field?.type === 'status' ? 'select' : field?.type;
  const coercedType = incomingType === 'tags' ? 'multiselect' : incomingType;
  const safeType = coercedType === 'rating' ? 'number' : coercedType || 'text';
  const next = {
    ...field,
    key: field?.key || (index === 0 ? 'title' : `f_${Date.now()}_${index}`),
    label: field?.label || (index === 0 ? 'Title' : 'Field'),
    type: safeType,
    row: field?.row ? String(field.row).trim() || null : null,
    compact: !!field?.compact,
    maxlength: normalizeMaxlength(field?.maxlength),
    options: Array.isArray(field?.options)
      ? parseSelectOptions(field.options.join(','))
      : parseSelectOptions(field?.options || ''),
  };

  if (!['select', 'multiselect'].includes(next.type)) next.options = [];
  return next;
}

function slugifyFieldKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function ensureUniqueFieldKey(fields, desiredKey, fallbackLabel = 'field') {
  const taken = new Set((fields || []).map((field) => field.key));
  const base = slugifyFieldKey(desiredKey || fallbackLabel) || 'field';
  if (!taken.has(base)) return base;

  let index = 2;
  while (taken.has(`${base}_${index}`)) index += 1;
  return `${base}_${index}`;
}

export function createImportedField(sourceField, existingFields) {
  const normalized = normalizeField(sourceField, existingFields.length);
  return {
    ...normalized,
    key: ensureUniqueFieldKey(existingFields, normalized.key || normalized.label, normalized.label),
  };
}

export function getDefaultImportTarget(sourceField, targetFields, index = 0) {
  const list = targetFields || [];
  if (!list.length) return IMPORT_TARGET_SKIP;

  if (index === 0 && list[0]?.key) return list[0].key;

  const byKey = list.find((field) => field.key === sourceField?.key);
  if (byKey) return byKey.key;

  const label = String(sourceField?.label || '').trim().toLowerCase();
  const byLabel = list.find((field) => String(field.label || '').trim().toLowerCase() === label);
  if (byLabel) return byLabel.key;

  return IMPORT_TARGET_CREATE;
}

function normalizeBoolean(value) {
  if (value === true || value === false) return value;
  if (typeof value === 'number') return value !== 0;
  const text = String(value || '').trim().toLowerCase();
  if (!text) return false;
  return ['true', 'yes', 'y', '1', 'done'].includes(text);
}

export function coerceValueForField(rawValue, targetField) {
  if (!targetField) return undefined;

  if (targetField.type === 'multiselect') {
    if (Array.isArray(rawValue)) return rawValue.map(String).filter(Boolean);
    return parseSelectOptions(rawValue || []);
  }

  if (targetField.type === 'select') {
    if (Array.isArray(rawValue)) return rawValue.find(Boolean) ? String(rawValue.find(Boolean)) : '';
    return rawValue === undefined || rawValue === null || rawValue === '' ? '' : String(rawValue);
  }

  if (targetField.type === 'boolean') {
    if (rawValue === undefined || rawValue === null || rawValue === '') return undefined;
    return normalizeBoolean(rawValue);
  }

  if (targetField.type === 'number' || targetField.type === 'progress') {
    if (rawValue === undefined || rawValue === null || rawValue === '') return '';
    const next = Number(rawValue);
    return Number.isFinite(next) ? next : '';
  }

  if (targetField.type === 'color' || targetField.type === 'icon') {
    return rawValue === undefined || rawValue === null ? '' : String(rawValue);
  }

  if (targetField.type === 'date') {
    if (!rawValue) return '';
    if (typeof rawValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawValue)) return rawValue;
    const date = new Date(rawValue);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  }

  if (targetField.type === 'url' || targetField.type === 'textarea' || targetField.type === 'text') {
    return rawValue === undefined || rawValue === null ? '' : String(rawValue);
  }

  return rawValue;
}

export function mergeFieldOptions(field, values) {
  if (!field || !['select', 'multiselect'].includes(field.type)) return field;
  return {
    ...field,
    options: parseSelectOptions([...(field.options || []), ...(values || [])]),
  };
}

export function getFieldSampleValues(entries, fieldKey, limit = 3) {
  const values = [];
  for (const entry of entries || []) {
    const raw = entry?.data?.[fieldKey];
    if (raw === undefined || raw === null || raw === '') continue;
    if (Array.isArray(raw)) {
      const label = raw.filter(Boolean).join(', ');
      if (label) values.push(label);
    } else {
      values.push(String(raw));
    }
    if (values.length >= limit) break;
  }
  return values;
}

export function sanitizeFilterPreference(item) {
  if (!item || typeof item !== 'object') return null;
  const id = String(item.id || '').trim();
  const name = String(item.name || '').trim();
  if (!id || !name) return null;

  const filters = Object.fromEntries(
    Object.entries(item.filters || {})
      .map(([key, value]) => [
        String(key),
        Array.isArray(value) ? value.map(String).filter(Boolean) : [],
      ])
      .filter(([, value]) => value.length),
  );

  return {
    id,
    name,
    filters,
  };
}

export function sanitizeFilterPreferences(list) {
  return (Array.isArray(list) ? list : [])
    .map((item) => sanitizeFilterPreference(item))
    .filter(Boolean);
}

export function normalizeVault(vault) {
  return {
    ...vault,
    meta: typeof vault.meta === 'object' && vault.meta !== null ? vault.meta : {},
    metaFields: sanitizeTableMetaSchema(vault.metaFields || getDefaultTableMetaFields()),
    fields: (vault.fields || []).map((field, index) => normalizeField(field, index)),
    recordFilterPreferences: sanitizeFilterPreferences(vault.recordFilterPreferences),
    tags: Array.isArray(vault.tags) ? vault.tags.filter(Boolean) : [],
  };
}

export function getTableMetaField(schema, key) {
  return (schema || []).find((field) => field.key === key) || null;
}

export function getTableMetaValue(table, key) {
  if (!table) return undefined;
  if (key === 'name' || key === 'icon' || key === 'color') return table[key];
  if (key === 'tags') return table.meta?.tags ?? table.tags;
  return table.meta?.[key];
}

export function getTableMetaValues(table, key) {
  const value = getTableMetaValue(table, key);
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (value === undefined || value === null || value === '') return [];
  return [String(value)];
}

export function getTableFormData(table, schema) {
  const data = {};
  (schema || []).forEach((field) => {
    const value = getTableMetaValue(table, field.key);
    if (field.type === 'multiselect') data[field.key] = Array.isArray(value) ? [...value] : [];
    else if (field.type === 'boolean') data[field.key] = value ?? false;
    else data[field.key] = value ?? '';
  });
  return data;
}

export function splitTableFormData(data) {
  const { name, icon, color, ...meta } = data || {};
  return {
    name,
    icon: icon || '📋',
    color,
    meta,
  };
}

export function getTableMetaGroups(schema, table) {
  return (schema || [])
    .filter((field) => field.type === 'select' || field.type === 'multiselect')
    .flatMap((field) => {
      const values = getTableMetaValues(table, field.key);
      if (!values.length) return [];
      return [{ key: field.key, label: field.label, values }];
    });
}

function buildFilterGroups(schema, items, getGroups) {
  return (schema || [])
    .filter((field) => field.type === 'select' || field.type === 'multiselect')
    .map((field) => {
      const tags = new Set(parseSelectOptions(field.options || []));

      (items || []).forEach((item) => {
        (getGroups(item).find((group) => group.key === field.key)?.values || []).forEach((value) => tags.add(value));
      });

      return {
        key: field.key,
        label: field.label,
        type: field.type,
        tags: [
          { value: EMPTY_FILTER_VALUE, label: getEmptyFilterLabel(field.label) },
          ...[...tags].sort((a, b) => String(a).localeCompare(String(b))).map((tag) => ({ value: tag, label: tag })),
        ],
      };
    })
    .filter((group) => group.tags.length);
}

export function getTableFilterGroups(schema, tables) {
  return buildFilterGroups(schema, tables, (table) => getTableMetaGroups(schema, table));
}

export function getRecordFilterGroups(fields, records) {
  return buildFilterGroups(fields, records, (record) => getRecordMetaGroups(fields, record));
}

export function matchesActiveGroupFilters(activeFilters, groups) {
  return Object.entries(activeFilters || {}).every(([groupKey, selection]) => {
    const activeValues = Array.isArray(selection) ? selection.filter(Boolean).map(String) : [];
    if (!activeValues.length) return true;
    const groupValues = (groups.find((group) => group.key === groupKey)?.values || []).map(String);
    return activeValues.every((value) => {
      if (value === EMPTY_FILTER_VALUE) return groupValues.length === 0;
      return groupValues.includes(value);
    });
  });
}

export function sanitizeGroupFilters(activeFilters, groups) {
  const groupMap = new Map(
    (groups || []).map((group) => [
      group.key,
      new Set((group.tags || []).map((tag) => (typeof tag === 'object' ? tag.value : tag)).filter(Boolean)),
    ]),
  );

  return Object.fromEntries(
    Object.entries(activeFilters || {})
      .map(([groupKey, selection]) => {
        const allowed = groupMap.get(groupKey);
        if (!allowed) return [groupKey, []];
        const values = Array.isArray(selection) ? selection.filter((value) => allowed.has(value)) : [];
        return [groupKey, values];
      })
      .filter(([, selection]) => selection.length),
  );
}

export function buildDataFromActiveFilters(activeFilters, schema) {
  const data = {};

  (schema || []).forEach((field) => {
    const selected = Array.isArray(activeFilters?.[field.key]) ? activeFilters[field.key] : [];
    if (!selected.length) return;

    const values = selected.filter((value) => value !== EMPTY_FILTER_VALUE);

    if (field.type === 'multiselect') {
      data[field.key] = values;
      return;
    }

    if (field.type === 'select') {
      data[field.key] = values[0] || '';
    }
  });

  return data;
}

export function safeJson(value, fallback) {
  if (typeof value !== 'string') return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function parseSnapshotTime(...values) {
  for (const value of values) {
    if (!value) continue;
    const time = new Date(value).getTime();
    if (Number.isFinite(time)) return time;
  }
  return Date.now();
}

export function mapSnapshotFieldType(type) {
  if (type === 'status') return 'select';
  if (['text', 'number', 'date', 'url', 'boolean', 'select', 'multiselect', 'progress', 'textarea', 'icon', 'color'].includes(type)) {
    return type;
  }
  return null;
}

export function mapSnapshotColumn(column, index) {
  if (column.linked_tracker_id) return null;
  const mappedType = mapSnapshotFieldType(column.field_type);
  if (!mappedType) return null;
  return normalizeField(
    {
      key: column.field_key || `f_${Date.now()}_${index}`,
      label: column.label || 'Field',
      type: mappedType,
      options: ['select', 'multiselect'].includes(mappedType) ? safeJson(column.options_json, []) : [],
    },
    index,
  );
}

export function buildImportPayload(snapshot) {
  const tables = Array.isArray(snapshot?.tables) ? snapshot.tables : [];
  const columns = Array.isArray(snapshot?.tracker_columns) ? snapshot.tracker_columns : [];
  const rows = Array.isArray(snapshot?.rows) ? snapshot.rows : [];
  const columnsByTracker = new Map();
  const rowsByTracker = new Map();

  columns.forEach((column) => {
    const list = columnsByTracker.get(column.tracker_id) || [];
    list.push(column);
    columnsByTracker.set(column.tracker_id, list);
  });

  rows.forEach((row) => {
    const list = rowsByTracker.get(row.tracker_id) || [];
    list.push(row);
    rowsByTracker.set(row.tracker_id, list);
  });

  let entryCount = 0;
  const vaults = tables.map((table) => {
    const meta = safeJson(table.table_meta_json, {});
    const fields = (columnsByTracker.get(table.id) || [])
      .slice()
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((column, index) => mapSnapshotColumn(column, index))
      .filter(Boolean);
    const safeFields = fields.length ? fields : [{ key: 'title', label: 'Title', type: 'text', options: [] }];
    const entries = (rowsByTracker.get(table.id) || []).map((row) => {
      const values = safeJson(row.values_json, {});
      const data = {};

      safeFields.forEach((field) => {
        const raw = values[field.key];
        if (field.type === 'boolean') data[field.key] = raw === true || raw === 'true';
        else if (field.type === 'multiselect') data[field.key] = Array.isArray(raw) ? raw : parseSelectOptions(raw || []);
        else if (field.type === 'number' || field.type === 'progress') data[field.key] = raw ?? '';
        else data[field.key] = raw ?? '';
      });

      return {
        data,
        createdAt: parseSnapshotTime(row.created_at, row.updated_at),
      };
    });

    entryCount += entries.length;
    rowsByTracker.set(table.id, entries);

    return {
      _sourceTrackerId: table.id,
      name: table.name || 'Untitled',
      icon: meta.icon || '📋',
      color: meta.color || 'Lime',
      fields: safeFields,
      tags: table.tag ? [table.tag] : [],
      createdAt: parseSnapshotTime(table.created_at),
    };
  });

  return { vaults, entriesByTracker: rowsByTracker, entryCount };
}

export function getRecordMetaGroups(fields, record) {
  return fields
    .filter((field) => field.type === 'select' || field.type === 'multiselect')
    .flatMap((field) => {
      const value = record?.data?.[field.key];
      if (value === undefined || value === null || value === '') return [];
      const values = Array.isArray(value) ? value.map(String).filter(Boolean) : [String(value)];
      if (!values.length) return [];
      return [{ key: field.key, label: field.label, values }];
    });
}

export function getGroupValue(fields, record, groupKey) {
  const field = fields.find((item) => item.key === groupKey && item.type === 'select');
  if (!field) return '';
  const value = record?.data?.[field.key];
  return value !== undefined && value !== null && value !== '' ? String(value) : 'Ungrouped';
}
