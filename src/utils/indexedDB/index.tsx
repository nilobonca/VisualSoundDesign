import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Audios, Images, Players, ActiveImage, ActiveArea, ActivePin, Layer, SoundboardItem, ActiveSoundboardItem, ActiveNote } from '../../interfaces/utils/indexedDB';
import { useLogSystem } from '../logSystem';

interface IDBContextProps {
    db: IDBDatabase | null;
    findaudio: (id: number) => Audios | undefined;
    deleteAudio: (id: number) => void;
    deleteAll: () => void;
    isLoading: boolean;
    savedAudios: Audios[];
    findPlayer: (id: string) => Players | undefined;
    activePlayers: Players[];
    deletePlayer: (id: string) => void;
    addPlayerPersisted: (player: Players) => void;
    updatePlayerPersisted: (player: Players) => void;
    setMessage: (msg: string) => void;
    saveAudio: (file: File) => Promise<Audios | undefined>;
    handleSetActivePlayers: (players: Players[]) => void;
    setActiveAudios: React.Dispatch<React.SetStateAction<Audios[]>>;
    usageLog: string | undefined;
    saveImage: (file: File) => Promise<Images | undefined>;
    savedImages: Images[];
    deleteImage: (id: number) => void;
    activeImages: ActiveImage[];
    addImagePersisted: (image: ActiveImage, parentId?: string | null) => void;
    updateImagePersisted: (image: ActiveImage) => void;
    deleteImagePersisted: (id: string) => void;
    handleSetActiveImages: (images: ActiveImage[]) => void;
    activeAreas: ActiveArea[];
    addAreaPersisted: (area: ActiveArea, parentId?: string | null) => void;
    updateAreaPersisted: (area: ActiveArea) => void;
    handleSetActiveAreas: (areas: ActiveArea[]) => void;
    deleteArea: (id: string) => void;
    activePins: ActivePin[];
    addPinPersisted: (pin: ActivePin, parentId?: string | null) => void;
    updatePinPersisted: (pin: ActivePin) => void;
    deletePinPersisted: (id: string) => void;
    handleSetActivePins: (pins: ActivePin[]) => void;
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
        activeSoundboardItems: ActiveSoundboardItem[];
        activeNotes: ActiveNote[];
    }) => Promise<void>;
    soundboardItems: SoundboardItem[];
    addSoundboardItem: (item: SoundboardItem) => void;
    updateSoundboardItem: (item: SoundboardItem) => void;
    deleteSoundboardItem: (id: string) => void;
    activeSoundboardItems: ActiveSoundboardItem[];
    addSoundboardItemPersisted: (item: ActiveSoundboardItem, parentId?: string | null) => void;
    updateSoundboardItemPersisted: (item: ActiveSoundboardItem) => void;
    deleteSoundboardItemPersisted: (id: string) => void;
    handleSetActiveSoundboardItems: (items: ActiveSoundboardItem[]) => void;
    activeNotes: ActiveNote[];
    addNotePersisted: (note: ActiveNote, parentId?: string | null) => void;
    updateNotePersisted: (note: ActiveNote) => void;
    deleteNotePersisted: (id: string) => void;
    handleSetActiveNotes: (notes: ActiveNote[]) => void;
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
    const [soundboardItems, setSoundboardItems] = useState<SoundboardItem[]>([]);
    const [activeSoundboardItems, setActiveSoundboardItems] = useState<ActiveSoundboardItem[]>([]);
    const [activeNotes, setActiveNotes] = useState<ActiveNote[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [activeAudios, setActiveAudios] = useState<Audios[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [message, setMessage] = useState('');

    const {
        updateDragLog,
        setUsageLog,
        usageLog
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
                console.error('Error estimating storage:', error);
            }
        }
    }, [setUsageLog]);

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

    const findPlayer = useCallback((id: string) => {
        return activePlayers.find(p => p.id === id);
    }, [activePlayers]);

    const findaudio = useCallback((id: number) => {
        return savedAudios.find(a => a.id === id);
    }, [savedAudios]);

    const saveAudio = useCallback((file: File): Promise<Audios | undefined> => {
        return new Promise((resolve) => {
            if (!db) {
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
                const newAudio = {
                    id,
                    file,
                    name: file.name,
                    createdAt: new Date(),
                    order: savedAudios.length,
                    url: URL.createObjectURL(file)
                };
                setSavedAudios(prev => [...prev, newAudio]);
                setMessage('Áudio salvo com sucesso!');
                resolve(newAudio);
            };
            request.onerror = () => {
                setMessage('Erro ao salvar áudio.');
                resolve(undefined);
            };
        });
    }, [db, savedAudios.length]);

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

    const handleSetActiveSoundboardItems = useCallback((items: ActiveSoundboardItem[]) => {
        setActiveSoundboardItems(items);
    }, []);

    const handleSetActiveNotes = useCallback((notes: ActiveNote[]) => {
        setActiveNotes(notes);
    }, []);

    // Layer Management
    const addLayer = useCallback((layer: Layer) => {
        // Find max order to ensure new layer is on top
        const maxOrder = activeLayers.length > 0 ? Math.max(...activeLayers.map(l => l.order || 0)) : -1;
        const newLayer = { ...layer, order: maxOrder + 1 };
        setActiveLayers(prev => [newLayer, ...prev]);
        updateItemPersisted(newLayer, 'Layer');
    }, [updateItemPersisted, activeLayers]);

    const updateLayer = useCallback((layer: Layer) => {
        setActiveLayers(prev => prev.map(l => l.id === layer.id ? layer : l));
        updateItemPersisted(layer, 'Layer');
    }, [updateItemPersisted]);

    const deleteLayer = useCallback((id: string) => {
        deleteItemPersisted(id);
        setActiveLayers(prev => prev.filter(l => l.id !== id));
    }, [deleteItemPersisted]);

    const reorderLayers = useCallback((layers: Layer[]) => {
        // layers is [Top, ..., Bottom] from UI
        // Assign decreasing order: Top gets Max Order, Bottom gets 0
        const updatedLayers = layers.map((l, index) => ({ ...l, order: layers.length - 1 - index }));
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

    const addPlayerPersisted = useCallback((player: Players) => {
        setActivePlayers(prev => [...prev, player]);
        updateItemPersisted(player, 'Player');
    }, [updateItemPersisted]);

    const updatePlayerPersisted = useCallback((player: Players) => {
        setActivePlayers(prev => prev.map(p => p.id === player.id ? player : p));
        updateItemPersisted(player, 'Player');
    }, [updateItemPersisted]);

    const deletePlayer = useCallback((id: string) => {
        deleteItemPersisted(id);
        setActivePlayers(prev => prev.filter(p => p.id !== id));
    }, [deleteItemPersisted]);

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

    const addImagePersisted = useCallback((image: ActiveImage, parentId?: string | null) => {
        setActiveImages(prev => [...prev, image]);
        updateItemPersisted(image, 'Image');
        // Create corresponding layer
        const newLayer: Layer = {
            id: crypto.randomUUID(),
            type: 'item',
            name: image.image.name,
            visible: true,
            locked: false,
            parentId: parentId || null,
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

    const deleteImagePersisted = useCallback((id: string) => {
        deleteItemPersisted(id);
        setActiveImages(prev => prev.filter(i => i.id !== id));
        // Delete corresponding layer
        const layer = activeLayers.find(l => l.itemId === id);
        if (layer) deleteLayer(layer.id);
    }, [deleteItemPersisted, activeLayers, deleteLayer]);

    const addAreaPersisted = useCallback((area: ActiveArea, parentId?: string | null) => {
        setActiveAreas(prev => [...prev, area]);
        updateItemPersisted(area, 'Area');
        // Create corresponding layer
        const newLayer: Layer = {
            id: crypto.randomUUID(),
            type: 'item',
            name: area.name,
            visible: true,
            locked: false,
            parentId: parentId || null,
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
        // Stop linked player if exists
        const area = activeAreas.find(a => a.id === id);
        if (area && area.linkedPlayerId) {
            deletePlayer(area.linkedPlayerId);
        }

        deleteItemPersisted(id);
        setActiveAreas(prev => prev.filter(a => a.id !== id));
        // Delete corresponding layer
        const layer = activeLayers.find(l => l.itemId === id);
        if (layer) deleteLayer(layer.id);
    }, [deleteItemPersisted, activeLayers, deleteLayer, activeAreas, deletePlayer]);

    const addPinPersisted = useCallback((pin: ActivePin, parentId?: string | null) => {
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
            parentId: parentId || null,
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

    // Soundboard Management
    const addSoundboardItem = useCallback((item: SoundboardItem) => {
        if (!db) return;
        const transaction = db.transaction(['soundboard'], 'readwrite');
        const store = transaction.objectStore('soundboard');
        store.add(item);
        setSoundboardItems(prev => [...prev, item]);
    }, [db]);

    const updateSoundboardItem = useCallback((item: SoundboardItem) => {
        if (!db) return;
        const transaction = db.transaction(['soundboard'], 'readwrite');
        const store = transaction.objectStore('soundboard');
        store.put(item);
        setSoundboardItems(prev => prev.map(i => i.id === item.id ? item : i));
    }, [db]);

    const deleteSoundboardItem = useCallback((id: string) => {
        if (!db) return;
        const transaction = db.transaction(['soundboard'], 'readwrite');
        const store = transaction.objectStore('soundboard');
        store.delete(id);
        setSoundboardItems(prev => prev.filter(i => i.id !== id));
    }, [db]);

    const addSoundboardItemPersisted = useCallback((item: ActiveSoundboardItem, parentId?: string | null) => {
        setActiveSoundboardItems(prev => [...prev, item]);
        updateItemPersisted(item, 'SoundboardItem');
        // Create corresponding layer
        const newLayer: Layer = {
            id: crypto.randomUUID(),
            type: 'item',
            name: 'Soundboard Button',
            visible: true,
            locked: false,
            parentId: parentId || null,
            depth: 0,
            itemId: item.id,
            itemType: 'soundboard'
        };
        addLayer(newLayer);
    }, [updateItemPersisted, addLayer]);

    const updateSoundboardItemPersisted = useCallback((item: ActiveSoundboardItem) => {
        setActiveSoundboardItems(prev => prev.map(i => i.id === item.id ? item : i));
        updateItemPersisted(item, 'SoundboardItem');
    }, [updateItemPersisted]);

    const deleteSoundboardItemPersisted = useCallback((id: string) => {
        deleteItemPersisted(id);
        setActiveSoundboardItems(prev => prev.filter(i => i.id !== id));
        // Delete corresponding layer
        const layer = activeLayers.find(l => l.itemId === id);
        if (layer) deleteLayer(layer.id);
    }, [deleteItemPersisted, activeLayers, deleteLayer]);

    // Note Management
    const addNotePersisted = useCallback((note: ActiveNote, parentId?: string | null) => {
        setActiveNotes(prev => [...prev, note]);
        updateItemPersisted(note, 'Note');
        // Create corresponding layer
        const newLayer: Layer = {
            id: crypto.randomUUID(),
            type: 'item',
            name: 'Note',
            visible: true,
            locked: false,
            parentId: parentId || null,
            depth: 0,
            itemId: note.id,
            itemType: 'note'
        };
        addLayer(newLayer);
    }, [updateItemPersisted, addLayer]);

    const updateNotePersisted = useCallback((note: ActiveNote) => {
        setActiveNotes(prev => prev.map(n => n.id === note.id ? note : n));
        updateItemPersisted(note, 'Note');
    }, [updateItemPersisted]);

    const deleteNotePersisted = useCallback((id: string) => {
        deleteItemPersisted(id);
        setActiveNotes(prev => prev.filter(n => n.id !== id));
        // Delete corresponding layer
        const layer = activeLayers.find(l => l.itemId === id);
        if (layer) deleteLayer(layer.id);
    }, [deleteItemPersisted, activeLayers, deleteLayer]);

    const loadAudios = useCallback((database: IDBDatabase) => {
        return new Promise<void>((resolve) => {
            const transaction = database.transaction(['audios'], 'readonly');
            const store = transaction.objectStore('audios');
            const request = store.getAll();
            request.onsuccess = () => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const audiosWithUrls = request.result.map((audio: any) => ({
                    ...audio,
                    url: URL.createObjectURL(audio.file)
                }));
                setSavedAudios(audiosWithUrls);
                resolve();
            };
        });
    }, []);

    const loadImages = useCallback((database: IDBDatabase) => {
        return new Promise<void>((resolve) => {
            const transaction = database.transaction(['images'], 'readonly');
            const store = transaction.objectStore('images');
            const request = store.getAll();
            request.onsuccess = () => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const imagesWithUrls = request.result.map((image: any) => ({
                    ...image,
                    url: URL.createObjectURL(image.file)
                }));
                setSavedImages(imagesWithUrls);
                resolve();
            };
        });
    }, []);

    const loadSoundboardItems = useCallback((database: IDBDatabase) => {
        return new Promise<void>((resolve) => {
            if (!database.objectStoreNames.contains('soundboard')) {
                resolve();
                return;
            }
            const transaction = database.transaction(['soundboard'], 'readonly');
            const store = transaction.objectStore('soundboard');
            const request = store.getAll();
            request.onsuccess = () => {
                setSoundboardItems(request.result);
                resolve();
            };
        });
    }, []);

    const loadCanvas = useCallback((database: IDBDatabase) => {
        return new Promise<void>((resolve) => {
            const transaction = database.transaction(['persistedCanvas'], 'readonly');
            const store = transaction.objectStore('persistedCanvas');
            const request = store.getAll();

            request.onsuccess = () => {
                const items = request.result;
                const players: Players[] = [];
                const images: ActiveImage[] = [];
                const areas: ActiveArea[] = [];
                const pins: ActivePin[] = [];
                const layers: Layer[] = [];
                const sbItems: ActiveSoundboardItem[] = [];
                const notes: ActiveNote[] = [];

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                items.forEach((item: any) => {
                    if (item.type === 'player') {
                        if (item.audio && item.audio.file) {
                            item.audio.url = URL.createObjectURL(item.audio.file);
                        }
                        players.push(item);
                    }
                    else if (item.type === 'image') {
                        if (item.image && item.image.file) {
                            item.image.url = URL.createObjectURL(item.image.file);
                        }
                        images.push(item);
                    }
                    else if (item.type === 'area') areas.push(item);
                    else if (item.type === 'pin') pins.push(item);
                    else if (item.type === 'layer' || item.type === 'group' || item.type === 'item') layers.push(item);
                    else if (item.type === 'soundboard') sbItems.push(item);
                    else if (item.type === 'note') notes.push(item);
                    // Legacy support: infer type if missing
                    else if (item.file) {
                        const player = item as Players;
                        if (player.audio && player.audio.file) {
                            player.audio.url = URL.createObjectURL(player.audio.file);
                        }
                        players.push(player);
                    }
                    else if (item.image) {
                        const img = item as ActiveImage;
                        if (img.image && img.image.file) {
                            img.image.url = URL.createObjectURL(img.image.file);
                        }
                        images.push(img);
                    }
                    else if (item.points) areas.push(item as ActiveArea); // Likely area
                });

                // Sort layers by order descending (High order = Top = Index 0)
                layers.sort((a, b) => (b.order || 0) - (a.order || 0));

                setActivePlayers(players);
                setActiveImages(images);
                setActiveAreas(areas);
                setActivePins(pins);
                setActiveLayers(layers);
                setActiveSoundboardItems(sbItems);
                setActiveNotes(notes);
                resolve();
            };
        });
    }, []);

    const exportCanvasState = useCallback(async () => {
        if (!db) return;
        const exportData = {
            savedAudios,
            savedImages,
            soundboardItems,
            activePlayers,
            activeImages,
            activeAreas,
            activePins,
            activeLayers,
            activeSoundboardItems,
            activeNotes
        };
        const blob = new Blob([JSON.stringify(exportData)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `canvas-backup-${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [db, savedAudios, savedImages, soundboardItems, activePlayers, activeImages, activeAreas, activePins, activeLayers, activeSoundboardItems, activeNotes]);

    const deleteAll = useCallback(() => {
        if (!db) return;
        const transaction = db.transaction(['audios', 'images', 'persistedCanvas', 'soundboard'], 'readwrite');
        transaction.objectStore('audios').clear();
        transaction.objectStore('images').clear();

        const canvasStore = transaction.objectStore('persistedCanvas');
        const canvasRequest = canvasStore.openCursor();

        canvasRequest.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
            if (cursor) {
                const value = cursor.value;
                let isGroupLayer = false;
                if ('type' in value && value.type === 'group') {
                    isGroupLayer = true;
                }

                if (!isGroupLayer) {
                    cursor.delete();
                }

                cursor.continue();
            }
        };

        if (transaction.objectStoreNames.contains('soundboard')) {
            transaction.objectStore('soundboard').clear();
        }

        setSavedAudios([]);
    }, [db]);

    const importCanvasState = useCallback(async (file: File) => {
        if (!db) return;

        try {
            const text = await file.text();
            const importData = JSON.parse(text);

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

            // Maps for ID remapping
            const audioIdMap = new Map<number, number>();
            const imageIdMap = new Map<number, number>();
            const entityIdMap = new Map<string, string>();

            // Import audios and remap IDs
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
                    request.onsuccess = () => {
                        audioIdMap.set(audioData.id, request.result as number);
                        resolve(undefined);
                    };
                    request.onerror = () => reject(request.error);
                });
            }

            // Import images and remap IDs
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
                    request.onsuccess = () => {
                        imageIdMap.set(imageData.id, request.result as number);
                        resolve(undefined);
                    };
                    request.onerror = () => reject(request.error);
                });
            }


            // Prepare entity ID remapping
            const allItems = [
                ...(importData.activePlayers || []),
                ...(importData.activeImages || []),
                ...(importData.activeAreas || []),
                ...(importData.activePins || []),
                ...(importData.activeLayers || []),
                ...(importData.activeSoundboardItems || []),
                ...(importData.activeNotes || [])
            ];

            // First pass: Generate new IDs
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            allItems.forEach((item: any) => {
                if (item.id) {
                    entityIdMap.set(item.id, crypto.randomUUID());
                }
            });

            // Import canvas items with remapped IDs
            const canvasTransaction = db.transaction(['persistedCanvas'], 'readwrite');
            const canvasStore = canvasTransaction.objectStore('persistedCanvas');

            for (const item of allItems) {
                const newItem = { ...item };

                // Remap ID
                if (newItem.id && entityIdMap.has(newItem.id)) {
                    newItem.id = entityIdMap.get(newItem.id);
                }

                // Remap References
                if (newItem.parentId && entityIdMap.has(newItem.parentId)) {
                    newItem.parentId = entityIdMap.get(newItem.parentId);
                }
                if (newItem.projectId && entityIdMap.has(newItem.projectId)) {
                    newItem.projectId = entityIdMap.get(newItem.projectId);
                }
                if (newItem.linkedPlayerId && entityIdMap.has(newItem.linkedPlayerId)) {
                    newItem.linkedPlayerId = entityIdMap.get(newItem.linkedPlayerId);
                }
                if (newItem.itemId && entityIdMap.has(newItem.itemId)) {
                    newItem.itemId = entityIdMap.get(newItem.itemId);
                }

                // Remap Asset References
                if (newItem.audio && newItem.audio.id && audioIdMap.has(newItem.audio.id)) {
                    newItem.audio = { ...newItem.audio, id: audioIdMap.get(newItem.audio.id) };
                }
                if (newItem.image && newItem.image.id && imageIdMap.has(newItem.image.id)) {
                    newItem.image = { ...newItem.image, id: imageIdMap.get(newItem.image.id) };
                }

                await new Promise((resolve, reject) => {
                    const request = canvasStore.add(newItem);
                    request.onsuccess = () => resolve(undefined);
                    request.onerror = () => reject(request.error);
                });
            }

            // Import Soundboard
            if (importData.soundboardItems && db.objectStoreNames.contains('soundboard')) {
                const sbTransaction = db.transaction(['soundboard'], 'readwrite');
                const sbStore = sbTransaction.objectStore('soundboard');

                for (const item of importData.soundboardItems || []) {
                    const newItem = { ...item };
                    // Remap ID if needed
                    if (newItem.id && entityIdMap.has(newItem.id)) {
                        newItem.id = entityIdMap.get(newItem.id);
                    }
                    // Remap Audio ID
                    if (newItem.audioId && audioIdMap.has(newItem.audioId)) {
                        newItem.audioId = audioIdMap.get(newItem.audioId);
                    }

                    await new Promise((resolve, reject) => {
                        const request = sbStore.add(newItem);
                        request.onsuccess = () => resolve(undefined);
                        request.onerror = () => reject(request.error);
                    });
                }
            }

            await loadAudios(db);
            await loadImages(db);
            await loadSoundboardItems(db);
            await loadCanvas(db);
            setMessage('Estado importado com sucesso!');
        } catch (error) {
            console.error('Erro ao importar estado:', error);
            setMessage('Erro ao importar estado.');
        }
    }, [db, loadAudios, loadImages, loadSoundboardItems, loadCanvas]);

    const restoreCanvasState = useCallback(async (state: {
        activePlayers: Players[];
        activeImages: ActiveImage[];
        activeAreas: ActiveArea[];
        activePins: ActivePin[];
        activeLayers: Layer[];
        activeSoundboardItems: ActiveSoundboardItem[];
        activeNotes: ActiveNote[];
    }) => {
        if (!db) return;
        const transaction = db.transaction(['persistedCanvas'], 'readwrite');
        const store = transaction.objectStore('persistedCanvas');
        store.clear();

        const allItems = [
            ...state.activePlayers,
            ...state.activeImages,
            ...state.activeAreas,
            ...state.activePins,
            ...state.activeLayers,
            ...state.activeSoundboardItems,
            ...state.activeNotes
        ];

        for (const item of allItems) {
            store.add(item);
        }

        setActivePlayers(state.activePlayers);
        setActiveImages(state.activeImages);
        setActiveAreas(state.activeAreas);
        setActivePins(state.activePins);
        setActiveLayers(state.activeLayers);
        setActiveSoundboardItems(state.activeSoundboardItems);
        setActiveNotes(state.activeNotes);
    }, [db]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const request = window.indexedDB.open('VisualSoundDesignDB', 2);

        request.onerror = (event) => {
            console.error('Erro ao abrir IndexedDB:', (event.target as IDBOpenDBRequest).error);
        };

        request.onsuccess = (event) => {
            const database = (event.target as IDBOpenDBRequest).result;
            setDb(database);
            setIsOn(true);

            Promise.all([
                loadAudios(database),
                loadImages(database),
                loadSoundboardItems(database),
                loadCanvas(database)
            ]).then(() => {
                setIsLoading(false);
                verificarEspacoDeArmazenamento();
            });
        };

        request.onupgradeneeded = (event) => {
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
            if (!database.objectStoreNames.contains('soundboard')) {
                database.createObjectStore('soundboard', { keyPath: 'id' });
            }
        };
    }, [loadAudios, loadImages, loadSoundboardItems, loadCanvas, verificarEspacoDeArmazenamento]);

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
        restoreCanvasState,
        soundboardItems,
        addSoundboardItem,
        updateSoundboardItem,
        deleteSoundboardItem,
        activeSoundboardItems,
        addSoundboardItemPersisted,
        updateSoundboardItemPersisted,
        deleteSoundboardItemPersisted,
        handleSetActiveSoundboardItems,
        activeNotes,
        addNotePersisted,
        updateNotePersisted,
        deleteNotePersisted,
        handleSetActiveNotes
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
        restoreCanvasState,
        soundboardItems,
        addSoundboardItem,
        updateSoundboardItem,
        deleteSoundboardItem,
        activeSoundboardItems,
        addSoundboardItemPersisted,
        updateSoundboardItemPersisted,
        deleteSoundboardItemPersisted,
        handleSetActiveSoundboardItems,
        activeNotes,
        addNotePersisted,
        updateNotePersisted,
        deleteNotePersisted,
        handleSetActiveNotes
    ]);

    return (
        <IndexedDBContext.Provider value={value}>
            {children}
        </IndexedDBContext.Provider>
    );
};

export const useIDB = () => {
    const context = useContext(IndexedDBContext);
    if (context === undefined) {
        throw new Error('useIDB must be used within an IDBProvider');
    }
    return context;
};