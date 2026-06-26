import JSZip from 'jszip';
import { Layer, Audios, Images } from '@/interfaces/utils/indexedDB';
import { v4 as uuidv4 } from 'uuid';

const DB_NAME = 'VisualSoundDesignDB';
const DB_VERSION = 3;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function getAllFromStore(db: IDBDatabase, storeName: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains(storeName)) return resolve([]);
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
  });
}

export type ConflictAction = 'replace' | 'duplicate' | 'rename' | 'ignore';

export interface ConflictResolution {
  projectId: string;
  action: ConflictAction;
  newName?: string;
}

export interface ParsedImportData {
  dataJson: any;
  zip: JSZip;
  conflictingProjects: Layer[];
  allImportedProjects: Layer[];
}

export const parseBackupFile = async (file: File): Promise<ParsedImportData> => {
  const zip = await JSZip.loadAsync(file);
  const dataJsonFile = zip.file("data.json");
  if (!dataJsonFile) throw new Error("Invalid backup: data.json not found");

  const dataJsonString = await dataJsonFile.async("string");
  const dataJson = JSON.parse(dataJsonString);

  const importedCanvas = dataJson.persistedCanvas || [];
  const importedProjects = importedCanvas.filter((item: any) => item.isProject);

  const db = await openDB();
  const localCanvas = await getAllFromStore(db, 'persistedCanvas');
  const localProjectIds = new Set(localCanvas.filter(item => item.isProject).map(item => item.id));

  const conflictingProjects = importedProjects.filter((p: Layer) => localProjectIds.has(p.id));

  return {
    dataJson,
    zip,
    conflictingProjects,
    allImportedProjects: importedProjects
  };
};

export const executeImport = async (
  parsedData: ParsedImportData,
  resolutions: Record<string, ConflictResolution>,
  onProgress?: (progress: number) => void
) => {
  const { dataJson, zip } = parsedData;
  const db = await openDB();

  // 1. Determine which projects to import and build ID maps for duplicating projects
  const projectIdMap = new Map<string, string>(); // oldId -> newId
  const itemsToImport = new Set<string>(); // IDs of persistedCanvas to import

  const importedCanvas = dataJson.persistedCanvas || [];
  
  // Find project resolutions
  for (const item of importedCanvas) {
    if (item.isProject) {
      const res = resolutions[item.id];
      if (!res) {
        // No conflict, import normally
        itemsToImport.add(item.id);
        projectIdMap.set(item.id, item.id);
      } else if (res.action === 'replace') {
        itemsToImport.add(item.id);
        projectIdMap.set(item.id, item.id);
      } else if (res.action === 'duplicate' || res.action === 'rename') {
        itemsToImport.add(item.id);
        const newId = uuidv4();
        projectIdMap.set(item.id, newId);
        if (res.action === 'rename' && res.newName) {
          item.name = res.newName;
        }
      } else if (res.action === 'ignore') {
        // Skip
      }
    }
  }

  // Now determine which non-project items to import based on the allowed projects
  // Helper to trace parent project
  const getProjectRoot = (itemId: string, itemsMap: Map<string, any>): string | null => {
    let current = itemsMap.get(itemId);
    while (current) {
      if (current.isProject) return current.id;
      if (current.projectId) return current.projectId;
      if (!current.parentId) return null;
      current = itemsMap.get(current.parentId);
    }
    return null;
  };

  const canvasMap = new Map<string, any>();
  importedCanvas.forEach((item: any) => canvasMap.set(item.id, item));

  // Determine what canvas items we keep and remap their hierarchy IDs if duplicated
  const finalCanvasItems: any[] = [];
  const layerIdMap = new Map<string, string>(); // oldLayerId -> newLayerId
  
  // First pass: generate new IDs for everything inside a duplicated project
  for (const item of importedCanvas) {
    const rootProjectId = getProjectRoot(item.id, canvasMap);
    if (rootProjectId && projectIdMap.has(rootProjectId)) {
      const isDuplicated = projectIdMap.get(rootProjectId) !== rootProjectId;
      if (isDuplicated) {
        layerIdMap.set(item.id, item.isProject ? projectIdMap.get(item.id)! : uuidv4());
      } else {
        layerIdMap.set(item.id, item.id);
      }
    }
  }

  // Second pass: apply new IDs and parentIds
  for (const item of importedCanvas) {
    const rootProjectId = getProjectRoot(item.id, canvasMap);
    if (rootProjectId && projectIdMap.has(rootProjectId)) {
      const newItem = { ...item };
      newItem.id = layerIdMap.get(item.id) || item.id;
      if (newItem.projectId) newItem.projectId = projectIdMap.get(newItem.projectId) || newItem.projectId;
      if (newItem.parentId) newItem.parentId = layerIdMap.get(newItem.parentId) || newItem.parentId;
      if (newItem.itemId) newItem.itemId = layerIdMap.get(newItem.itemId) || newItem.itemId; // pins/areas
      finalCanvasItems.push(newItem);
    }
  }

  // 2. Handle Audios and Images (Numeric ID conflict resolution via hashing/signature)
  // We compare file signature (size + name) with local to reuse IDs or create new ones.
  const localAudios = await getAllFromStore(db, 'audios');
  const localImages = await getAllFromStore(db, 'images');

  const localAudioSigs = new Map<string, number>();
  localAudios.forEach(a => localAudioSigs.set(`${a.name}_${a.file?.size || 0}`, a.id));

  const localImageSigs = new Map<string, number>();
  localImages.forEach(i => localImageSigs.set(`${i.name}_${i.file?.size || 0}`, i.id));

  const audioIdMap = new Map<number, number>();
  const imageIdMap = new Map<number, number>();

  const importedAudios = dataJson.audios || [];
  const importedImages = dataJson.images || [];

  if (onProgress) onProgress(20);

  // We need to write a helper to save items that generate auto-increment keys
  const insertWithAutoIncrement = (storeName: string, item: any): Promise<number> => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result as number);
    });
  };

  // Process Audios
  let audioProgress = 0;
  for (const audio of importedAudios) {
    // We actually need the actual file size to be safe. We'll read the blob first.
    let blob: Blob | null = null;
    if (audio._fileName) {
      const zipFile = zip.file(`media/audios/${audio._fileName}`);
      if (zipFile) blob = await zipFile.async("blob");
    }
    
    const trueSig = `${audio.name}_${blob ? blob.size : 0}`;
    
    if (localAudioSigs.has(trueSig)) {
      audioIdMap.set(audio.id, localAudioSigs.get(trueSig)!);
    } else {
      // Need to insert as new
      const fileObj = blob ? new File([blob], audio._fileName || audio.name, { type: blob.type || 'audio/mpeg' }) : undefined;
      const newId = await insertWithAutoIncrement('audios', { ...audio, file: fileObj, id: undefined });
      audioIdMap.set(audio.id, newId);
    }
    audioProgress++;
    if (onProgress) onProgress(20 + (audioProgress / importedAudios.length) * 20);
  }

  // Process Images
  let imageProgress = 0;
  for (const img of importedImages) {
    let blob: Blob | null = null;
    if (img._fileName) {
      const zipFile = zip.file(`media/images/${img._fileName}`);
      if (zipFile) blob = await zipFile.async("blob");
    }
    const trueSig = `${img.name}_${blob ? blob.size : 0}`;
    
    if (localImageSigs.has(trueSig)) {
      imageIdMap.set(img.id, localImageSigs.get(trueSig)!);
    } else {
      const fileObj = blob ? new File([blob], img._fileName || img.name, { type: blob.type || 'image/png' }) : undefined;
      const newId = await insertWithAutoIncrement('images', { ...img, file: fileObj, id: undefined });
      imageIdMap.set(img.id, newId);
    }
    imageProgress++;
    if (onProgress) onProgress(40 + (imageProgress / importedImages.length) * 20);
  }

  // 3. Update canvas items with remapped numeric IDs
  for (const item of finalCanvasItems) {
    if (item.linkedAudioId && audioIdMap.has(item.linkedAudioId)) {
      item.linkedAudioId = audioIdMap.get(item.linkedAudioId);
    }
    if (item.audioFileId && audioIdMap.has(item.audioFileId)) {
      item.audioFileId = audioIdMap.get(item.audioFileId);
    }
    if (item.audio && item.audio.id && audioIdMap.has(item.audio.id)) {
      item.audio.id = audioIdMap.get(item.audio.id);
    }
    if (item.image && item.image.id && imageIdMap.has(item.image.id)) {
      item.image.id = imageIdMap.get(item.image.id);
    }
  }

  if (onProgress) onProgress(80);

  // 4. Save Canvas Items
  const saveAllItems = (storeName: string, items: any[]) => {
    return new Promise<void>((resolve, reject) => {
      if (items.length === 0) return resolve();
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      items.forEach(i => store.put(i));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  };

  await saveAllItems('persistedCanvas', finalCanvasItems);

  if (onProgress) onProgress(100);
};
