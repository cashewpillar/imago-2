import Dexie from 'dexie';
import { normalizeVault } from '../../../shared/utils/tableVault';

const db = new Dexie('TableVaultDB');
db.version(1).stores({ vaults: '++id,name', entries: '++id,tableId,createdAt' });
db.version(2).stores({ vaults: '++id,name,sourceTrackerId', entries: '++id,tableId,createdAt,sourceRowUid,sourceTrackerId' });

export async function listVaults() {
  const vaults = (await db.vaults.toArray()).map(normalizeVault);
  const counts = await Promise.all(
    vaults.map(async (vault) => ({
      id: vault.id,
      count: await db.entries.where('tableId').equals(vault.id).count(),
    })),
  );

  return vaults.map((vault) => ({
    ...vault,
    _count: counts.find((count) => count.id === vault.id)?.count || 0,
  }));
}

export async function getVault(vaultId) {
  const vault = await db.vaults.get(Number(vaultId));
  return vault ? normalizeVault(vault) : null;
}

export async function createVault(payload) {
  return db.vaults.add(payload);
}

export async function updateVault(vaultId, payload) {
  await db.vaults.update(Number(vaultId), payload);
}

export async function deleteVault(vaultId) {
  await db.entries.where('tableId').equals(Number(vaultId)).delete();
  await db.vaults.delete(Number(vaultId));
}

export async function listEntries(vaultId) {
  const entries = await db.entries.where('tableId').equals(Number(vaultId)).toArray();
  return entries.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getEntry(entryId) {
  return db.entries.get(Number(entryId));
}

export async function createEntry(vaultId, data) {
  return db.entries.add({
    tableId: Number(vaultId),
    data,
    createdAt: Date.now(),
  });
}

export async function updateEntry(entryId, data) {
  await db.entries.update(Number(entryId), { data });
}

export async function deleteEntry(entryId) {
  await db.entries.delete(Number(entryId));
}

export async function exportAll() {
  return {
    type: 'imago-tablevault-backup',
    version: 1,
    timestamp: Date.now(),
    vaults: await db.vaults.toArray(),
    entries: await db.entries.toArray(),
  };
}

export async function replaceAll(backup) {
  await db.transaction('rw', db.vaults, db.entries, async () => {
    await db.vaults.clear();
    await db.vaults.clear();
    await db.entries.clear();
    if (backup.vaults) await db.vaults.bulkAdd(backup.vaults);
    if (backup.entries) await db.entries.bulkAdd(backup.entries);
  });
}

export async function exportTable(vaultId) {
  const vault = await db.vaults.get(Number(vaultId));
  if (!vault) return null;

  return {
    type: 'imago-tablevault-table-backup',
    version: 1,
    timestamp: Date.now(),
    vault,
    entries: await db.entries.where('tableId').equals(Number(vaultId)).toArray(),
  };
}

export async function importTableBackup(backup) {
  const { id, ...vaultRecord } = backup.vault;
  const newId = await db.vaults.add(vaultRecord);
  const entries = (backup.entries || []).map((entry) => {
    const { id: oldId, ...entryRecord } = entry;
    return { ...entryRecord, tableId: newId };
  });

  if (entries.length) {
    await db.entries.bulkAdd(entries);
  }

  return newId;
}

export async function replaceWithSnapshotPayload(payload) {
  await db.transaction('rw', db.vaults, db.entries, async () => {
    await db.entries.clear();
    await db.vaults.clear();

    for (const vault of payload.vaults) {
      const { _sourceTrackerId, ...vaultRecord } = vault;
      const newId = await db.vaults.add(vaultRecord);
      const entries = (payload.entriesByTracker.get(vault._sourceTrackerId) || []).map((entry) => ({
        ...entry,
        tableId: newId,
      }));

      if (entries.length) {
        await db.entries.bulkAdd(entries);
      }
    }
  });
}
