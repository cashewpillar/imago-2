import {
  exportAll,
  exportTable,
  importTableBackup,
  replaceAll,
  replaceWithSnapshotPayload,
} from './tableVaultDb';
import { buildImportPayload } from '../../../shared/utils/tableVault';

function triggerDownload(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.style.display = 'none';
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 100);
}

function pickJsonFile() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.style.display = 'none';
    input.onchange = (event) => {
      const [file] = event.target.files || [];
      input.remove();
      resolve(file || null);
    };
    document.body.appendChild(input);
    input.click();
  });
}

export async function exportAllData() {
  const payload = await exportAll();
  triggerDownload(`tablevault-full-backup-${new Date().toISOString().slice(0, 10)}.json`, payload);
}

export async function importAllData() {
  const file = await pickJsonFile();
  if (!file) return { imported: false };

  const backup = JSON.parse(await file.text());
  if (backup.type !== 'imago-tablevault-backup' && !backup.tables) {
    return importSnapshotFile(file);
  }

  await replaceAll(backup);
  return { imported: true, mode: 'full-backup' };
}

export async function exportTableData(vault) {
  const payload = await exportTable(vault.id);
  if (!payload) return;
  triggerDownload(`table-${vault.name.toLowerCase().replace(/\s+/g, '-')}-backup.json`, payload);
}

export async function importTableData() {
  const file = await pickJsonFile();
  if (!file) return { imported: false };
  const backup = JSON.parse(await file.text());
  if (backup.type !== 'imago-tablevault-table-backup' || !backup.vault) {
    throw new Error('Invalid table backup file');
  }

  const newId = await importTableBackup(backup);
  return { imported: true, tableName: backup.vault.name, newId };
}

export async function importSnapshotFile(file) {
  const snapshot = JSON.parse(await file.text());
  const payload = buildImportPayload(snapshot);
  await replaceWithSnapshotPayload(payload);
  return { imported: true, mode: 'snapshot', payload };
}
