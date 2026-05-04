import Dexie from 'dexie';

export const commonplaceDb = new Dexie('cp3');

commonplaceDb.version(1).stores({
  media: '++id,type,title,createdAt',
  moments: '++id,mediaId,createdAt',
  relations: '++id,fromId,toId',
});

commonplaceDb.version(2).stores({
  media: '++id,&uuid,type,title,createdAt,updatedAt',
  moments: '++id,&uuid,mediaId,mediaUuid,createdAt,updatedAt',
  relations: '++id,&uuid,fromId,toId,fromUuid,toUuid,label',
}).upgrade(async (tx) => {
  const mediaTable = tx.table('media');
  const momentTable = tx.table('moments');
  const relationTable = tx.table('relations');
  const media = await mediaTable.toArray();
  const mediaById = new Map();

  for (const item of media) {
    const uuid = item.uuid || makeUuid();
    mediaById.set(item.id, uuid);
    await mediaTable.update(item.id, {
      uuid,
      updatedAt: item.updatedAt || item.createdAt || Date.now(),
    });
  }

  const moments = await momentTable.toArray();
  const momentById = new Map();
  for (const item of moments) {
    const uuid = item.uuid || makeUuid();
    momentById.set(item.id, uuid);
    await momentTable.update(item.id, {
      uuid,
      mediaUuid: item.mediaUuid || mediaById.get(item.mediaId) || null,
      updatedAt: item.updatedAt || item.createdAt || Date.now(),
    });
  }

  const relations = await relationTable.toArray();
  for (const item of relations) {
    await relationTable.update(item.id, {
      uuid: item.uuid || makeUuid(),
      fromUuid: item.fromUuid || momentById.get(item.fromId) || null,
      toUuid: item.toUuid || momentById.get(item.toId) || null,
    });
  }
});

let compatibilityEnsured = false;

export function makeUuid() {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }

  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}

export async function ensureCommonplaceCompatibility() {
  if (compatibilityEnsured) return;
  compatibilityEnsured = true;

  const [media, moments, relations] = await Promise.all([
    commonplaceDb.media.toArray(),
    commonplaceDb.moments.toArray(),
    commonplaceDb.relations.toArray(),
  ]);

  const mediaUuidById = new Map();
  for (const item of media) {
    const patch = {};
    if (!item.uuid) patch.uuid = makeUuid();
    if (!item.updatedAt) patch.updatedAt = item.createdAt || Date.now();
    if (Object.keys(patch).length) await commonplaceDb.media.update(item.id, patch);
    mediaUuidById.set(item.id, patch.uuid || item.uuid);
  }

  const momentUuidById = new Map();
  for (const item of moments) {
    const patch = {};
    if (!item.uuid) patch.uuid = makeUuid();
    if (!item.mediaUuid) patch.mediaUuid = mediaUuidById.get(item.mediaId) || null;
    if (!item.updatedAt) patch.updatedAt = item.createdAt || Date.now();
    if (Object.keys(patch).length) await commonplaceDb.moments.update(item.id, patch);
    momentUuidById.set(item.id, patch.uuid || item.uuid);
  }

  for (const item of relations) {
    const patch = {};
    if (!item.uuid) patch.uuid = makeUuid();
    if (!item.fromUuid) patch.fromUuid = momentUuidById.get(item.fromId) || null;
    if (!item.toUuid) patch.toUuid = momentUuidById.get(item.toId) || null;
    if (Object.keys(patch).length) await commonplaceDb.relations.update(item.id, patch);
  }
}
