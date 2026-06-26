import JSZip from 'jszip';
import { saveAs } from 'file-saver';

const DB_NAME = 'VisualSoundDesignDB';
const DB_VERSION = 3;
const STORES = ['audios', 'images', 'persistedCanvas', 'soundboard', 'polls', 'poll_responses'];

// Helper to open DB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Helper to get all data from a store
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAllFromStore(db: IDBDatabase, storeName: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains(storeName)) {
      return resolve([]);
    }
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Full Export
export const exportAllProjects = async (onProgress?: (progress: number) => void) => {
  try {
    const db = await openDB();
    const zip = new JSZip();
    
    const exportData: Record<string, any[]> = {};
    
    // Fetch JSON data for all stores except media files
    for (const store of STORES) {
      const data = await getAllFromStore(db, store);
      exportData[store] = data;
    }

    const audioFolder = zip.folder("media/audios");
    const imageFolder = zip.folder("media/images");

    // Process Audios (extract files)
    const audioDataClean = [];
    if (exportData.audios) {
      for (const item of exportData.audios) {
        if (item.file) {
          const extension = item.file.name.split('.').pop() || 'mp3';
          const filename = `${item.id}.${extension}`;
          audioFolder?.file(filename, item.file, { compression: "DEFLATE", compressionOptions: { level: 6 } });
        }
        // Save metadata without the actual File object to JSON
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { file, url, ...metadata } = item;
        audioDataClean.push({ ...metadata, _fileName: item.file ? `${item.id}.${item.file.name.split('.').pop()}` : null });
      }
    }
    exportData.audios = audioDataClean;

    // Process Images
    const imageDataClean = [];
    if (exportData.images) {
      for (const item of exportData.images) {
        if (item.file) {
          const extension = item.file.name.split('.').pop() || 'png';
          const filename = `${item.id}.${extension}`;
          imageFolder?.file(filename, item.file, { compression: "DEFLATE", compressionOptions: { level: 6 } });
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { file, url, ...metadata } = item;
        imageDataClean.push({ ...metadata, _fileName: item.file ? `${item.id}.${item.file.name.split('.').pop()}` : null });
      }
    }
    exportData.images = imageDataClean;

    // Remove URLs from other objects just in case to keep JSON clean
    // The URLs are blob URLs anyway, which are useless when exported
    
    zip.file("data.json", JSON.stringify(exportData, null, 2));

    if (onProgress) onProgress(50); // DB extraction done, zipping begins

    const content = await zip.generateAsync({ 
      type: "blob", 
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    }, (meta) => {
      if (onProgress) {
        onProgress(50 + (meta.percent / 2)); // 50 to 100%
      }
    });

    saveAs(content, `VisualSoundDesign_FullBackup_${new Date().toISOString().split('T')[0]}.zip`);
    return true;
  } catch (error) {
    console.error("Export failed", error);
    throw error;
  }
};

// Export Specific Project / Pages
export const exportSpecificPages = async (projectId: string, pageIds: string[], onProgress?: (progress: number) => void) => {
  try {
    const db = await openDB();
    const zip = new JSZip();
    
    const allData: Record<string, any[]> = {};
    for (const store of STORES) {
      allData[store] = await getAllFromStore(db, store);
    }

    // Filter Canvas Data
    const canvasData = allData.persistedCanvas || [];
    
    // We need to keep:
    // 1. The Project layer
    // 2. The selected Page layers
    // 3. Any item that belongs to the selected Page layers
    
    // Find items that belong to the selected pages.
    // In our system, elements like Pins, Areas have a corresponding `layer` where `parentId` is the pageId.
    
    const validLayerIds = new Set<string>();
    validLayerIds.add(projectId);
    pageIds.forEach(id => validLayerIds.add(id));
    
    const validItemIds = new Set<string>();
    
    // Simple hierarchy search for items
    const checkParent = (layerId: string): boolean => {
      if (validLayerIds.has(layerId)) return true;
      const layer = canvasData.find(l => l.id === layerId);
      if (layer && layer.parentId) {
        const isValid = checkParent(layer.parentId);
        if (isValid) validLayerIds.add(layerId);
        return isValid;
      }
      return false;
    };

    const finalCanvasData = canvasData.filter(item => {
      if (item.id === projectId) return true;
      if (pageIds.includes(item.id)) return true;
      
      // If it's a layer, check if its parent is in validLayerIds
      if (item.parentId) {
        if (checkParent(item.parentId)) {
          if (item.itemId) validItemIds.add(item.itemId); // Collect itemId (e.g. Pin ID, Area ID)
          return true;
        }
      }
      return false;
    });

    // Now filter actual items (ActivePin, ActiveArea) which are also in persistedCanvas, but they use `id` matching `itemId` of layer
    // Let's add them to finalCanvasData
    const itemsData = canvasData.filter(item => {
      if (validItemIds.has(item.id)) return true;
      return false;
    });
    
    // Combine layers and items ensuring no duplicates
    const finalSet = new Set(finalCanvasData.map(i => i.id));
    itemsData.forEach(item => {
      if (!finalSet.has(item.id)) {
        finalCanvasData.push(item);
        finalSet.add(item.id);
      }
    });

    // Determine which Audios and Images are used
    const usedAudioIds = new Set<number>();
    const usedImageIds = new Set<number>();
    
    finalCanvasData.forEach(item => {
      if (item.linkedAudioId) usedAudioIds.add(item.linkedAudioId); // Area
      if (item.audioFileId) usedAudioIds.add(item.audioFileId); // GlobalTrack
      if (item.audio && item.audio.id) usedAudioIds.add(item.audio.id); // Player
      if (item.image && item.image.id) usedImageIds.add(item.image.id); // ActiveImage
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exportData: Record<string, any[]> = {
      persistedCanvas: finalCanvasData,
      soundboard: [], // Optional: Should soundboard be included? Let's leave empty for page exports unless requested
      polls: [],
      poll_responses: []
    };

    const audioFolder = zip.folder("media/audios");
    const imageFolder = zip.folder("media/images");

    const audioDataClean = [];
    if (allData.audios) {
      for (const item of allData.audios) {
        if (usedAudioIds.has(item.id)) {
          if (item.file) {
            const extension = item.file.name.split('.').pop() || 'mp3';
            audioFolder?.file(`${item.id}.${extension}`, item.file, { compression: "DEFLATE", compressionOptions: { level: 6 } });
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { file, url, ...metadata } = item;
          audioDataClean.push({ ...metadata, _fileName: item.file ? `${item.id}.${item.file.name.split('.').pop()}` : null });
        }
      }
    }
    exportData.audios = audioDataClean;

    const imageDataClean = [];
    if (allData.images) {
      for (const item of allData.images) {
        if (usedImageIds.has(item.id)) {
          if (item.file) {
            const extension = item.file.name.split('.').pop() || 'png';
            imageFolder?.file(`${item.id}.${extension}`, item.file, { compression: "DEFLATE", compressionOptions: { level: 6 } });
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { file, url, ...metadata } = item;
          imageDataClean.push({ ...metadata, _fileName: item.file ? `${item.id}.${item.file.name.split('.').pop()}` : null });
        }
      }
    }
    exportData.images = imageDataClean;

    zip.file("data.json", JSON.stringify(exportData, null, 2));

    if (onProgress) onProgress(50);

    const content = await zip.generateAsync({ 
      type: "blob", 
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    }, (meta) => {
      if (onProgress) {
        onProgress(50 + (meta.percent / 2));
      }
    });

    saveAs(content, `VisualSoundDesign_Export_${new Date().toISOString().split('T')[0]}.zip`);
    return true;
  } catch (error) {
    console.error("Export failed", error);
    throw error;
  }
};
