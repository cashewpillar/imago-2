export function parseSelectOptions(value) {
  const list = Array.isArray(value) ? value : String(value || '').split(',');
  return [...new Set(list.map((item) => String(item).trim()).filter(Boolean))];
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
      row: field?.row || null,
      compact: !!field?.compact,
      locked: !!field?.locked,
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
    options: Array.isArray(field?.options)
      ? parseSelectOptions(field.options.join(','))
      : parseSelectOptions(field?.options || ''),
  };

  if (!['select', 'multiselect'].includes(next.type)) next.options = [];
  return next;
}

export function normalizeVault(vault) {
  return {
    ...vault,
    meta: typeof vault.meta === 'object' && vault.meta !== null ? vault.meta : {},
    metaFields: sanitizeTableMetaSchema(vault.metaFields || getDefaultTableMetaFields()),
    fields: (vault.fields || []).map((field, index) => normalizeField(field, index)),
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
      options: mappedType === 'select' ? safeJson(column.options_json, []) : [],
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
