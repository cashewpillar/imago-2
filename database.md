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
Stores the definition and metadata for a collection of records.
- `id`: Auto-incrementing primary key.
- `name`: String name of the vault.
- `fields`: Array of field definitions (schema for the entries).
- `meta`: Object containing UI preferences (tags, colors, icons).
- `sourceTrackerId`: (Optional) Used for external data synchronization.

### `entries` (Records)
Stores the actual data rows.
- `id`: Auto-incrementing primary key.
- `tableId`: Foreign key matching a `vaults.id`.
- `data`: Object containing the actual record values (keys match the `fields` defined in the vault).
- `createdAt`: Timestamp.

### `appmeta` (Configuration)
Global key-value settings.
- `key`: Primary key (e.g., `'tableMetaSchema'`).
- `value`: The configuration data.

## Implementation Notes
1. **Filtering:** Always query entries using `.where('tableId').equals(id)` for performance, as `tableId` is indexed.
2. **Reactivity:** If using Vue/React, use `liveQuery` from Dexie to automatically update the UI when the other app writes to the database.
3. **Primary Keys:** When adding records, omit the `id` field to let Dexie generate the auto-incrementing value.
