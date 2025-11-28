import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { useLogSystem } from '@/utils/logSystem';
import { Players, Audios, Images, ActiveImage, ActiveArea, ActivePin, Layer } from '@/interfaces/utils/indexedDB';

interface IDBContextProps {
    db: IDBDatabase | null;
    findaudio: (id: number) => Audios | undefined;
    deleteAudio: (id: number) => void;
    deleteAll: () => void;
    isLoading: boolean;
    savedImages: Images[];
    deleteImage: (id: number) => void;
    activeImages: ActiveImage[];
    addImagePersisted: (image: ActiveImage) => void;
    updateImagePersisted: (image: ActiveImage) => void;
    deleteImagePersisted: (id: string) => void;
    handleSetActiveImages: (images: ActiveImage[]) => void;
    // Areas
    activeAreas: ActiveArea[];
    addAreaPersisted: (area: ActiveArea) => void;
    updateAreaPersisted: (area: ActiveArea) => void;
    handleSetActiveAreas: (areas: ActiveArea[]) => void;
    deleteArea: (id: string) => void;
    // Pins
    activePins: ActivePin[];
    addPinPersisted: (pin: ActivePin) => void;
    updatePinPersisted: (pin: ActivePin) => void;
    deletePinPersisted: (id: string) => void;
    handleSetActivePins: (pins: ActivePin[]) => void;
    // Layers
    activeLayers: Layer[];
    addLayer: (layer: Layer) => void;
    updateLayer: (layer: Layer) => void;
    deleteLayer: (id: string) => void;
    reorderLayers: (layers: Layer[]) => void;
    reorderAudios: (audios: Audios[]) => void;
    reorderImages: (images: Images[]) => void;
    reorderPins: (pins: ActivePin[]) => void;
    exportCanvasState: () => Promise<void>;
    importCanvasState: (file: File) => Promise<void>;
    restoreCanvasState: (state: {
        activePlayers: Players[];
        activeImages: ActiveImage[];
        activeAreas: ActiveArea[];
        activePins: ActivePin[];
        activeLayers: Layer[];
    }) => Promise<void>;
    // Players (Missing from interface in previous steps, adding for completeness)
    findPlayer: (id: string) => Players | undefined;
    activePlayers: Players[];
    deletePlayer: (id: string) => void;
    addPlayerPersisted: (player: Players) => void;
    updatePlayerPersisted: (player: Players) => void;
    setMessage: (msg: string) => void;
    saveAudio: (file: File) => Promise<Audios | undefined>;
    handleSetActivePlayers: (players: Players[]) => void;
    setActiveAudios: (audios: Audios[]) => void;
    usageLog: string | undefined;
    saveImage: (file: File) => Promise<Images | undefined>;
    savedAudios: Audios[];
}

const IndexedDBContext = createContext<IDBContextProps | undefined>(undefined);

export const IDBProvider = ({ children }: { children: ReactNode }) => {
    const [db, setDb] = useState<IDBDatabase | null>(null);
    const [isOn, setIsOn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [savedAudios, setSavedAudios] = useState<Audios[]>([]);
    const [savedImages, setSavedImages] = useState<Images[]>([]);
    const [activePlayers, setActivePlayers] = useState<Players[]>([]);
    const [activeImages, setActiveImages] = useState<ActiveImage[]>([]);
    const [activeAreas, setActiveAreas] = useState<ActiveArea[]>([]);
    const [activePins, setActivePins] = useState<ActivePin[]>([]);
    const [activeLayers, setActiveLayers] = useState<Layer[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [activeAudios, setActiveAudios] = useState<Audios[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [message, setMessage] = useState('');
    const [usageLog, setUsageLog] = useState<string>();

    const {
        updateDragLog,
    } = useLogSystem();

    const verificarEspacoDeArmazenamento = useCallback(async () => {
        if (typeof navigator !== 'undefined' && 'storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const estimate = await navigator.storage.estimate();
                const used = estimate.usage || 0;
                const quota = estimate.quota || 1;
                const percentage = (used / quota) * 100;
                setUsageLog(`${(used / 1024 / 1024).toFixed(2)}MB / ${(quota / 1024 / 1024).toFixed(2)}MB (${percentage.toFixed(2)}%)`);
            } catch (error) {
                console.error('Não foi possível estimar o espaço:', error);
            }
        }
    }, []);

    const loadAudios = useCallback((database: IDBDatabase) => {
        if (!database) return;
        setIsLoading(true);
        const transaction = database.transaction(['audios'], 'readonly');
        const store = transaction.objectStore('audios');
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
            const audiosWithUrls = getAllRequest.result.map((audioRecord: Audios) => ({
                ...audioRecord,
                url: URL.createObjectURL(audioRecord.file)
            })).sort((a: Audios, b: Audios) => (a.order || 0) - (b.order || 0));
            setSavedAudios(audiosWithUrls);
            setIsLoading(false);
            setIsOn(true);
        };

        getAllRequest.onerror = (event: Event) => {
            console.error("Erro ao carregar áudios:", (event.target as IDBRequest).error);
            setIsLoading(false);
        };
    }, []);

    const loadImages = useCallback((database: IDBDatabase) => {
        if (!database) return;
        const transaction = database.transaction(['images'], 'readonly');
        const store = transaction.objectStore('images');
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
            const imagesWithUrls = getAllRequest.result.map((imageRecord: Images) => ({
                ...imageRecord,
                url: URL.createObjectURL(imageRecord.file)
            })).sort((a: Images, b: Images) => (a.order || 0) - (b.order || 0));
            setSavedImages(imagesWithUrls);
        };

        getAllRequest.onerror = (event: Event) => {
            console.error("Erro ao carregar imagens:", (event.target as IDBRequest).error);
        };
    }, []);

    const loadCanvas = useCallback((database: IDBDatabase) => {
        if (!database) return;
        const transaction = database.transaction(['persistedCanvas'], 'readonly');
        const store = transaction.objectStore('persistedCanvas');
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
            const items = getAllRequest.result;
            const players: Players[] = [];
            const images: ActiveImage[] = [];
            const areas: ActiveArea[] = [];
            const pins: ActivePin[] = [];
            const layers: Layer[] = [];

            items.forEach((item: Players | ActiveImage | ActiveArea | ActivePin | Layer) => {
                if ('audio' in item) {
                    players.push(item as Players);
                } else if ('image' in item) {
                    images.push(item as ActiveImage);
                } else if ('points' in item) {
                    areas.push(item as ActiveArea);
                } else if ('enabled' in item) {
                    pins.push(item as ActivePin);
                } else if ('type' in item && ('group' === item.type || 'item' === item.type)) {
                    layers.push(item as Layer);
                }
            });

            setActivePlayers(players);
            setActiveImages(images);
            setActiveAreas(areas);
            setActivePins(pins.sort((a, b) => (a.order || 0) - (b.order || 0)));
            setActiveLayers(layers.sort((a, b) => (a.order || 0) - (b.order || 0)));
        };

        getAllRequest.onerror = (event: Event) => {
            console.error("Erro ao carregar canvas:", (event.target as IDBRequest).error);
        };
    }, []);

    const findaudio = useCallback((id: number) => {
        return savedAudios.find(a => a.id === id);
    }, [savedAudios]);

    const findPlayer = useCallback((id: string) => {
        return activePlayers.find(p => p.id === id);
    }, [activePlayers]);

    const handleSetActivePlayers = useCallback((players: Players[]) => {
        setActivePlayers(players);
    }, []);

    const handleSetActiveImages = useCallback((images: ActiveImage[]) => {
        setActiveImages(images);
    }, []);

    const handleSetActiveAreas = useCallback((areas: ActiveArea[]) => {
        setActiveAreas(areas);
    }, []);

    const handleSetActivePins = useCallback((pins: ActivePin[]) => {
        setActivePins(pins);
    }, []);

    const updateItemPersisted = useCallback((item: unknown, type: string) => {
        if (!db) return;
        const transaction = db.transaction(['persistedCanvas'], 'readwrite');
        const store = transaction.objectStore('persistedCanvas');
        const request = store.put(item);

        request.onsuccess = () => {
            updateDragLog();
        };
        request.onerror = (e: Event) => console.error(`Erro ao salvar ${type}:`, (e.target as IDBRequest).error);
    }, [db, updateDragLog]);

    const deleteItemPersisted = useCallback((id: string) => {
        if (!db) return;
        const transaction = db.transaction(['persistedCanvas'], 'readwrite');
        const store = transaction.objectStore('persistedCanvas');
        store.delete(id);
    }, [db]);

    // Layer Management
    const addLayer = useCallback((layer: Layer) => {
        const newLayer = { ...layer, order: activeLayers.length };
        setActiveLayers(prev => [...prev, newLayer]);
        updateItemPersisted(newLayer, 'Layer');
    }, [updateItemPersisted, activeLayers.length]);

    const updateLayer = useCallback((layer: Layer) => {
        setActiveLayers(prev => prev.map(l => l.id === layer.id ? layer : l));
        updateItemPersisted(layer, 'Layer');
    }, [updateItemPersisted]);

    const deleteLayer = useCallback((id: string) => {
        deleteItemPersisted(id);
        setActiveLayers(prev => prev.filter(l => l.id !== id));
    }, [deleteItemPersisted]);

    const reorderLayers = useCallback((layers: Layer[]) => {
        const updatedLayers = layers.map((l, index) => ({ ...l, order: index }));
        setActiveLayers(updatedLayers);
        updatedLayers.forEach(l => updateItemPersisted(l, 'Layer'));
    }, [updateItemPersisted]);

    const reorderAudios = useCallback((audios: Audios[]) => {
        const updatedAudios = audios.map((a, index) => ({ ...a, order: index }));
        setSavedAudios(updatedAudios);

        if (!db) return;
        const transaction = db.transaction(['audios'], 'readwrite');
        const store = transaction.objectStore('audios');
        updatedAudios.forEach(audio => {
            // We need to store the file object, not the URL
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { url, ...audioData } = audio;
            store.put(audioData);
        });
    }, [db]);

    const reorderImages = useCallback((images: Images[]) => {
        const updatedImages = images.map((i, index) => ({ ...i, order: index }));
        setSavedImages(updatedImages);

        if (!db) return;
        const transaction = db.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');
        updatedImages.forEach(image => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { url, ...imageData } = image;
            store.put(imageData);
        });
    }, [db]);

    const reorderPins = useCallback((pins: ActivePin[]) => {
        const updatedPins = pins.map((p, index) => ({ ...p, order: index }));
        setActivePins(updatedPins);
        updatedPins.forEach(p => updateItemPersisted(p, 'Pin'));
    }, [updateItemPersisted]);

    const deletePlayer = useCallback((id: string) => {
        deleteItemPersisted(id);
        setActivePlayers(prev => prev.filter(p => p.id !== id));
    }, [deleteItemPersisted]);

    const addPlayerPersisted = useCallback((player: Players) => {
        setActivePlayers(prev => [...prev, player]);
        updateItemPersisted(player, 'Player');
    }, [updateItemPersisted]);

    const updatePlayerPersisted = useCallback((player: Players) => {
        setActivePlayers(prev => prev.map(p => p.id === player.id ? player : p));
        updateItemPersisted(player, 'Player');
    }, [updateItemPersisted]);

    const deleteImagePersisted = useCallback((id: string) => {
        deleteItemPersisted(id);
        setActiveImages(prev => prev.filter(i => i.id !== id));
        // Delete corresponding layer
        const layer = activeLayers.find(l => l.itemId === id);
        if (layer) deleteLayer(layer.id);
    }, [deleteItemPersisted, activeLayers, deleteLayer]);

    const saveAudio = useCallback((file: File): Promise<Audios | undefined> => {
        console.log('[saveAudio] Iniciando salvamento:', file.name);
        return new Promise((resolve) => {
            if (!db) {
                console.log('[saveAudio] DB não disponível');
                resolve(undefined);
                return;
            }
            const transaction = db.transaction(['audios'], 'readwrite');
            const store = transaction.objectStore('audios');
            const request = store.add({
                file,
                name: file.name,
                createdAt: new Date(),
                order: savedAudios.length
            });

            request.onsuccess = () => {
                const id = request.result as number;
                console.log('[saveAudio] Áudio salvo com ID:', id);
                const newAudio = {
                    id,
                    file,
                    name: file.name,
                    createdAt: new Date(),
                    order: savedAudios.length,
                    url: URL.createObjectURL(file)
                };
                setSavedAudios(prev => {
                    console.log('[saveAudio] Atualizando lista. Antes:', prev.length, 'Depois:', prev.length + 1);
                    return [...prev, newAudio];
                });
                setMessage('Áudio salvo com sucesso!');
                resolve(newAudio);
            };
            request.onerror = (e) => {
                console.error('[saveAudio] Erro:', (e.target as IDBRequest).error);
                setMessage('Erro ao salvar áudio.');
                resolve(undefined);
            };
        });
    }, [db, savedAudios.length]);

    const deleteAudio = useCallback((id: number) => {
        console.log('[deleteAudio] Iniciando exclusão do ID:', id);
        if (!db) return;
        const transaction = db.transaction(['audios'], 'readwrite');
        const store = transaction.objectStore('audios');
        store.delete(id);

        transaction.oncomplete = () => {
            console.log('[deleteAudio] Exclusão concluída');
            setSavedAudios(prev => {
                const filtered = prev.filter(a => a.id !== id);
                console.log('[deleteAudio] Lista atualizada. Antes:', prev.length, 'Depois:', filtered.length);
                return filtered;
            });
            setMessage('Áudio excluído.');

            setActivePlayers(prev => {
                const playersToRemove = prev.filter(p => p.audio.id === id);
                console.log('[deleteAudio] Players removidos do canvas:', playersToRemove.length);
                playersToRemove.forEach(p => deleteItemPersisted(p.id));
                return prev.filter(p => p.audio.id !== id);
            });
        };

        transaction.onerror = (e) => {
            console.error('[deleteAudio] Erro:', (e.target as IDBRequest).error);
            setMessage('Erro ao excluir áudio.');
        };
    }, [db, deleteItemPersisted]);

    const saveImage = useCallback((file: File): Promise<Images | undefined> => {
        return new Promise((resolve) => {
            if (!db) {
                resolve(undefined);
                return;
            }
            const transaction = db.transaction(['images'], 'readwrite');
            const store = transaction.objectStore('images');
            const request = store.add({
                file,
                name: file.name,
                createdAt: new Date(),
                order: savedImages.length
            });

            request.onsuccess = () => {
                const id = request.result as number;
                const newImage = {
                    id,
                    file,
                    name: file.name,
                    createdAt: new Date(),
                    order: savedImages.length,
                    url: URL.createObjectURL(file)
                };
                setSavedImages(prev => [...prev, newImage]);
                setMessage('Imagem salva com sucesso!');
                resolve(newImage);
            };
            request.onerror = () => {
                setMessage('Erro ao salvar imagem.');
                resolve(undefined);
            };
        });
    }, [db, savedImages.length]);

    const deleteImage = useCallback((id: number) => {
        if (!db) return;
        const transaction = db.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');
        store.delete(id);

        transaction.oncomplete = () => {
            setSavedImages(prev => prev.filter(i => i.id !== id));
            setMessage('Imagem excluída.');

            setActiveImages(prev => {
                const imagesToRemove = prev.filter(i => i.image.id === id);
                imagesToRemove.forEach(i => deleteItemPersisted(i.id));
                return prev.filter(i => i.image.id !== id);
            });
        };

        transaction.onerror = () => {
            setMessage('Erro ao excluir imagem.');
        };
    }, [db, deleteItemPersisted]);

    const addImagePersisted = useCallback((image: ActiveImage) => {
        setActiveImages(prev => [...prev, image]);
        updateItemPersisted(image, 'Image');
        // Create corresponding layer
        const newLayer: Layer = {
            id: crypto.randomUUID(),
            type: 'item',
            name: image.image.name,
            visible: true,
            locked: false,
            parentId: null,
            depth: 0,
            itemId: image.id,
            itemType: 'image'
        };
        addLayer(newLayer);
    }, [updateItemPersisted, addLayer]);

    const updateImagePersisted = useCallback((image: ActiveImage) => {
        setActiveImages(prev => prev.map(i => i.id === image.id ? image : i));
        updateItemPersisted(image, 'Image');
    }, [updateItemPersisted]);

    const addAreaPersisted = useCallback((area: ActiveArea) => {
        setActiveAreas(prev => [...prev, area]);
        updateItemPersisted(area, 'Area');
        // Create corresponding layer
        const newLayer: Layer = {
            id: crypto.randomUUID(),
            type: 'item',
            name: area.name,
            visible: true,
            locked: false,
            parentId: null,
            depth: 0,
            itemId: area.id,
            itemType: 'area'
        };
        addLayer(newLayer);
    }, [updateItemPersisted, addLayer]);

    const updateAreaPersisted = useCallback((area: ActiveArea) => {
        setActiveAreas(prev => prev.map(a => a.id === area.id ? area : a));
        updateItemPersisted(area, 'Area');
        // Update layer name if area name changed
        const layer = activeLayers.find(l => l.itemId === area.id);
        if (layer && layer.name !== area.name) {
            updateLayer({ ...layer, name: area.name });
        }
    }, [updateItemPersisted, activeLayers, updateLayer]);

    const deleteArea = useCallback((id: string) => {
        deleteItemPersisted(id);
        setActiveAreas(prev => prev.filter(a => a.id !== id));
        // Delete corresponding layer
        const layer = activeLayers.find(l => l.itemId === id);
        if (layer) deleteLayer(layer.id);
    }, [deleteItemPersisted, activeLayers, deleteLayer]);

    const addPinPersisted = useCallback((pin: ActivePin) => {
        const newPin = { ...pin, order: activePins.length };
        setActivePins(prev => [...prev, newPin]);
        updateItemPersisted(newPin, 'Pin');
        // Create corresponding layer
        const newLayer: Layer = {
            id: crypto.randomUUID(),
            type: 'item',
            name: pin.name,
            visible: true,
            locked: false,
            parentId: null,
            depth: 0,
            itemId: pin.id,
            itemType: 'pin'
        };
        addLayer(newLayer);
    }, [updateItemPersisted, addLayer, activePins.length]);

    const updatePinPersisted = useCallback((pin: ActivePin) => {
        setActivePins(prev => prev.map(p => p.id === pin.id ? pin : p));
        updateItemPersisted(pin, 'Pin');
        // Update layer name if pin name changed
        const layer = activeLayers.find(l => l.itemId === pin.id);
        if (layer && layer.name !== pin.name) {
            updateLayer({ ...layer, name: pin.name });
        }
    }, [updateItemPersisted, activeLayers, updateLayer]);

    const deletePinPersisted = useCallback((id: string) => {
        deleteItemPersisted(id);
        setActivePins(prev => prev.filter(p => p.id !== id));
        // Delete corresponding layer
        const layer = activeLayers.find(l => l.itemId === id);
        if (layer) deleteLayer(layer.id);
    }, [deleteItemPersisted, activeLayers, deleteLayer]);

    const deleteAll = useCallback(() => {
        if (!db) return;
        const transaction = db.transaction(['audios', 'images', 'persistedCanvas'], 'readwrite');
        transaction.objectStore('audios').clear();
        transaction.objectStore('images').clear();
        transaction.objectStore('persistedCanvas').clear();
        setSavedAudios([]);
        setSavedImages([]);
        setActivePlayers([]);
        setActiveImages([]);
        setActiveAreas([]);
        setActivePins([]);
        setActiveLayers([]);
        setMessage('Tudo foi apagado.');
    }, [db]);

    // Export/Import functions
    const exportCanvasState = useCallback(async () => {
        if (!db) {
            setMessage('Banco de dados não disponível');
            return;
        }

        try {
            // Helper function to convert File to base64
            const fileToBase64 = (file: File): Promise<string> => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            };

            // Convert audios with files to base64
            const audiosToExport = await Promise.all(
                savedAudios.map(async (audio) => {
                    const fileData = await fileToBase64(audio.file);
                    return {
                        id: audio.id,
                        name: audio.name,
                        fileData,
                        fileName: audio.file.name,
                        fileType: audio.file.type,
                        createdAt: audio.createdAt,
                        order: audio.order
                    };
                })
            );

            // Convert images with files to base64
            const imagesToExport = await Promise.all(
                savedImages.map(async (image) => {
                    const fileData = await fileToBase64(image.file);
                    return {
                        id: image.id,
                        name: image.name,
                        fileData,
                        fileName: image.file.name,
                        fileType: image.file.type,
                        createdAt: image.createdAt,
                        order: image.order
                    };
                })
            );

            const exportData = {
                version: '1.0',
                timestamp: new Date().toISOString(),
                savedAudios: audiosToExport,
                savedImages: imagesToExport,
                activePlayers,
                activeImages,
                activeAreas,
                activePins,
                activeLayers
            };

            // Create and download JSON file
            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `canvas-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setMessage('Canvas exportado com sucesso!');
        } catch (error) {
            console.error('Erro ao exportar canvas:', error);
            setMessage('Erro ao exportar canvas.');
        }
    }, [db, savedAudios, savedImages, activePlayers, activeImages, activeAreas, activePins, activeLayers]);

    const importCanvasState = useCallback(async (file: File) => {
        if (!db) {
            setMessage('Banco de dados não disponível');
            return;
        }

        try {
            const jsonText = await file.text();
            const importData = JSON.parse(jsonText);

            // Helper function to convert base64 to File
            const base64ToFile = (base64: string, fileName: string, fileType: string): File => {
                const arr = base64.split(',');
                const mime = arr[0].match(/:(.*?);/)?.[1] || fileType;
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                return new File([u8arr], fileName, { type: mime });
            };

            // Clear existing data
            const clearTransaction = db.transaction(['audios', 'images', 'persistedCanvas'], 'readwrite');
            clearTransaction.objectStore('audios').clear();
            clearTransaction.objectStore('images').clear();
            clearTransaction.objectStore('persistedCanvas').clear();

            await new Promise((resolve, reject) => {
                clearTransaction.oncomplete = () => resolve(undefined);
                clearTransaction.onerror = () => reject(clearTransaction.error);
            });

            // Import audios
            const audioTransaction = db.transaction(['audios'], 'readwrite');
            const audioStore = audioTransaction.objectStore('audios');

            for (const audioData of importData.savedAudios || []) {
                const file = base64ToFile(audioData.fileData, audioData.fileName, audioData.fileType);
                await new Promise((resolve, reject) => {
                    const request = audioStore.add({
                        file,
                        name: audioData.name,
                        createdAt: new Date(audioData.createdAt),
                        order: audioData.order
                    });
                    request.onsuccess = () => resolve(undefined);
                    request.onerror = () => reject(request.error);
                });
            }

            // Import images
            const imageTransaction = db.transaction(['images'], 'readwrite');
            const imageStore = imageTransaction.objectStore('images');

            for (const imageData of importData.savedImages || []) {
                const file = base64ToFile(imageData.fileData, imageData.fileName, imageData.fileType);
                await new Promise((resolve, reject) => {
                    const request = imageStore.add({
                        file,
                        name: imageData.name,
                        createdAt: new Date(imageData.createdAt),
                        order: imageData.order
                    });
                    request.onsuccess = () => resolve(undefined);
                    request.onerror = () => reject(request.error);
                });
            }

            // Import canvas items
            const canvasTransaction = db.transaction(['persistedCanvas'], 'readwrite');
            const canvasStore = canvasTransaction.objectStore('persistedCanvas');

            const allItems = [
                ...(importData.activePlayers || []),
                ...(importData.activeImages || []),
                ...(importData.activeAreas || []),
                ...(importData.activePins || []),
                ...(importData.activeLayers || [])
            ];

            for (const item of allItems) {
                await new Promise((resolve, reject) => {
                    const request = canvasStore.add(item);
                    request.onsuccess = () => resolve(undefined);
                    request.onerror = () => reject(request.error);
                });
            }

            // Reload data from database
            loadAudios(db);
            loadImages(db);
            loadCanvas(db);

            setMessage('Canvas importado com sucesso!');
        } catch (error) {
            console.error('Erro ao importar canvas:', error);
            setMessage('Erro ao importar canvas.');
        }
    }, [db, loadAudios, loadImages, loadCanvas]);

    const restoreCanvasState = useCallback(async (state: {
        activePlayers: Players[];
        activeImages: ActiveImage[];
        activeAreas: ActiveArea[];
        activePins: ActivePin[];
        activeLayers: Layer[];
    }) => {
        if (!db) return;

        // Update React State
        setActivePlayers(state.activePlayers);
        setActiveImages(state.activeImages);
        setActiveAreas(state.activeAreas);
        setActivePins(state.activePins);
        setActiveLayers(state.activeLayers);

        // Update IndexedDB
        const transaction = db.transaction(['persistedCanvas'], 'readwrite');
        const store = transaction.objectStore('persistedCanvas');

        // Clear existing canvas state
        await new Promise<void>((resolve, reject) => {
            const clearRequest = store.clear();
            clearRequest.onsuccess = () => resolve();
            clearRequest.onerror = () => reject(clearRequest.error);
        });

        // Add all items back
        const allItems = [
            ...state.activePlayers,
            ...state.activeImages,
            ...state.activeAreas,
            ...state.activePins,
            ...state.activeLayers
        ];

        for (const item of allItems) {
            store.put(item);
        }
    }, [db]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const request = indexedDB.open('canvasDatabase', 2);

        request.onerror = (event: Event) => {
            console.error("Erro ao abrir o IndexedDB:", (event.target as IDBOpenDBRequest).error);
            setMessage('Erro ao carregar o banco de dados local.');
            setIsLoading(false);
        };

        request.onsuccess = (event: Event) => {
            const database = (event.target as IDBOpenDBRequest).result;
            setDb(database);
            loadAudios(database);
            loadImages(database);
        };

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
            const database = (event.target as IDBOpenDBRequest).result;
            if (!database.objectStoreNames.contains('audios')) {
                database.createObjectStore('audios', { keyPath: 'id', autoIncrement: true });
            }
            if (!database.objectStoreNames.contains('images')) {
                database.createObjectStore('images', { keyPath: 'id', autoIncrement: true });
            }
            if (!database.objectStoreNames.contains('persistedCanvas')) {
                database.createObjectStore('persistedCanvas', { keyPath: 'id' });
            }
        };
    }, [loadAudios, loadImages]);

    useEffect(() => {
        if (isOn && db) {
            loadCanvas(db);
            setIsOn(false);
        }
    }, [isOn, db, loadCanvas]);

    useEffect(() => {
        verificarEspacoDeArmazenamento();
    }, [savedAudios, savedImages, verificarEspacoDeArmazenamento]);

    const value = useMemo(() => ({
        db,
        findaudio,
        deleteAudio,
        deleteAll,
        isLoading,
        savedAudios,
        findPlayer,
        activePlayers,
        deletePlayer,
        addPlayerPersisted,
        updatePlayerPersisted,
        setMessage,
        saveAudio,
        handleSetActivePlayers,
        setActiveAudios,
        usageLog,
        saveImage,
        savedImages,
        deleteImage,
        activeImages,
        addImagePersisted,
        updateImagePersisted,
        deleteImagePersisted,
        handleSetActiveImages,
        activeAreas,
        addAreaPersisted,
        updateAreaPersisted,
        handleSetActiveAreas,
        deleteArea,
        activePins,
        addPinPersisted,
        updatePinPersisted,
        deletePinPersisted,
        handleSetActivePins,
        activeLayers,
        addLayer,
        updateLayer,
        deleteLayer,
        reorderLayers,
        reorderAudios,
        reorderImages,
        reorderPins,
        exportCanvasState,
        importCanvasState,
        restoreCanvasState
    }), [
        db,
        findaudio,
        deleteAudio,
        deleteAll,
        isLoading,
        savedAudios,
        findPlayer,
        activePlayers,
        deletePlayer,
        addPlayerPersisted,
        updatePlayerPersisted,
        setMessage,
        saveAudio,
        handleSetActivePlayers,
        usageLog,
        saveImage,
        savedImages,
        deleteImage,
        activeImages,
        addImagePersisted,
        updateImagePersisted,
        deleteImagePersisted,
        handleSetActiveImages,
        activeAreas,
        addAreaPersisted,
        updateAreaPersisted,
        handleSetActiveAreas,
        deleteArea,
        activePins,
        addPinPersisted,
        updatePinPersisted,
        deletePinPersisted,
        handleSetActivePins,
        activeLayers,
        addLayer,
        updateLayer,
        deleteLayer,
        reorderLayers,
        reorderAudios,
        reorderImages,
        reorderPins,
        exportCanvasState,
        importCanvasState,
        restoreCanvasState
    ]);

    return <IndexedDBContext.Provider value={value}>{children}</IndexedDBContext.Provider>;
}

export function useIDB() {
    const context = useContext(IndexedDBContext);
    if (!context) {
        throw new Error('useIDB deve ser usado dentro de um IDBProvider');
    }
    return context;
}