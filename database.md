# Prototyping Shared Database Access

To prototype new apps that share the same data as this project, use the following Dexie.js configuration. Since IndexedDB is shared across the same origin, any app hosted on the same domain/port can access this database directly.

## Database Configuration

**Database Name:** `TableVaultDB`  
**Current Version:** `4`

### Schema Definition
```javascript
import Dexie from 'dexie';

const db = new Dexie('TableVaultDB');

db.version(4).stores({
  vaults: '++id, name, sourceTrackerId',
  entries: '++id, tableId, createdAt, sourceRowUid, sourceTrackerId',
  appmeta: '&key'
});
```

## Data Structures

### `vaults` (Tables)
Stores the definition, table-level metadata values, and table-owned preferences for a collection of records.
- `id`: Auto-incrementing primary key.
- `name`: String name of the vault.
- `icon`: Table icon.
- `color`: Table color token.
- `fields`: Array of field definitions (schema for the entries).
- `meta`: Object containing the values for the shared table-meta schema.
- `recordFilterPreferences`: Array of saved filter presets for that table's record view.
- `createdAt`: Timestamp.
- `sourceTrackerId`: (Optional) Used for external data synchronization.

Example:
```javascript
{
  id: 12,
  name: 'Roadmap',
  icon: '📋',
  color: 'Lime',
  fields: [
    { key: 'title', label: 'Title', type: 'text', options: [] },
    { key: 'priority', label: 'Priority', type: 'select', options: ['Low', 'High'] }
  ],
  meta: {
    status: 'Active',
    team: ['Product', 'Design']
  },
  recordFilterPreferences: [
    {
      id: 'urgent',
      name: 'Urgent',
      filters: {
        priority: ['High']
      }
    }
  ],
  createdAt: 1710000000000
}
```

### `entries` (Records)
Stores the actual data rows.
- `id`: Auto-incrementing primary key.
- `tableId`: Foreign key matching a `vaults.id`.
- `data`: Object containing the actual record values (keys match the `fields` defined in the vault).
- `createdAt`: Timestamp.

Example:
```javascript
{
  id: 44,
  tableId: 12,
  data: {
    title: 'Fix onboarding bug',
    priority: 'High'
  },
  createdAt: 1710000001000
}
```

### `appmeta` (Configuration)
Global key-value settings.
- `key`: Primary key (e.g., `'tableMetaSchema'`, `'homeFilterPreferences'`).
- `value`: The configuration data.

Current important keys:
- `tableMetaSchema`: Global schema for table-level metadata fields. Each vault stores its actual values for these fields inside `vault.meta`.
- `homeFilterPreferences`: Saved filter presets for the home/tables screen.

Examples:
```javascript
{ key: 'tableMetaSchema', value: [
  { key: 'name', label: 'Name', type: 'text', locked: true },
  { key: 'icon', label: 'Icon', type: 'icon', locked: true },
  { key: 'color', label: 'Color', type: 'color', locked: true },
  { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Archived'] }
] }

{ key: 'homeFilterPreferences', value: [
  {
    id: 'work',
    name: 'Work',
    filters: {
      status: ['Active']
    }
  }
] }
```

## Mental Model

- `appmeta.tableMetaSchema` defines which metadata fields every table can have.
- `vault.meta` stores one table's values for that schema.
- `vault.fields` defines the schema for records inside that table.
- `entries.data` stores one record's values for those `vault.fields`.
- `appmeta.homeFilterPreferences` stores home-screen saved presets.
- `vault.recordFilterPreferences` stores record-screen saved presets for that specific table.

Current transient sticky filters are not stored in Dexie. They still live in `localStorage` and represent current UI state, not saved presets.

## Implementation Notes
1. **Filtering:** Always query entries using `.where('tableId').equals(id)` for performance, as `tableId` is indexed.
2. **Reactivity:** If using Vue/React, use `liveQuery` from Dexie to automatically update the UI when the other app writes to the database.
3. **Primary Keys:** When adding records, omit the `id` field to let Dexie generate the auto-incrementing value.
