import Dexie from 'dexie';

export const tableVaultDb = new Dexie('ImagoTableVault');

tableVaultDb.version(1).stores({
  vaults: '++id,name,createdAt',
  entries: '++id,tableId,createdAt',
});
