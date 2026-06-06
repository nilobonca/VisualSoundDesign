const fs = require('fs');

let content = fs.readFileSync('src/utils/indexedDB/index.tsx', 'utf-8');

// 1. Add to DatabaseContextType
const contextTypeTarget = 'activeSoundboardItems: any[];';
const contextTypeReplacement = \ctiveSoundboardItems: any[];
    activeGlobalAudios: any[];
    addGlobalAudioPersisted: (globalAudio: any, projectId: number) => void;
    updateGlobalAudioPersisted: (globalAudio: any) => void;
    deleteGlobalAudioPersisted: (id: string) => void;\;
content = content.replace(contextTypeTarget, contextTypeReplacement);

// 2. Add object store in initDB
const initDBTarget = 'if (!db.objectStoreNames.contains(\\'activeSoundboardItems\\')) {';
const initDBReplacement = \if (!db.objectStoreNames.contains('activeGlobalAudios')) {
                    const store = db.createObjectStore('activeGlobalAudios', { keyPath: 'id' });
                    store.createIndex('projectId', 'projectId', { unique: false });
                }
                if (!db.objectStoreNames.contains('activeSoundboardItems')) {\;
content = content.replace(initDBTarget, initDBReplacement);

// 3. Add to DatabaseProvider state
const stateTarget = 'const [activeSoundboardItems, setActiveSoundboardItems] = useState<any[]>([]);';
const stateReplacement = \const [activeSoundboardItems, setActiveSoundboardItems] = useState<any[]>([]);
    const [activeGlobalAudios, setActiveGlobalAudios] = useState<any[]>([]);\;
content = content.replace(stateTarget, stateReplacement);

// 4. Load in loadProjectData
const loadTarget = 'const activeSoundboardItemsStore = transaction.objectStore(\\'activeSoundboardItems\\');';
const loadReplacement = \const activeGlobalAudiosStore = transaction.objectStore('activeGlobalAudios');
            const activeGlobalAudiosIndex = activeGlobalAudiosStore.index('projectId');
            const activeGlobalAudiosReq = activeGlobalAudiosIndex.getAll(projectId);

            activeGlobalAudiosReq.onsuccess = () => {
                setActiveGlobalAudios(activeGlobalAudiosReq.result || []);
            };
            
            const activeSoundboardItemsStore = transaction.objectStore('activeSoundboardItems');\;
content = content.replace(loadTarget, loadReplacement);

// 5. Add methods
const methodsTarget = 'const addSoundboardItemPersisted = useCallback((item: any, projectId: number) => {';
const methodsReplacement = \const addGlobalAudioPersisted = useCallback((globalAudio: any, projectId: number) => {
        const itemWithProjectId = { ...globalAudio, projectId };
        setActiveGlobalAudios((prev) => [...prev, itemWithProjectId]);

        try {
            if (!dbInstance) return;
            const transaction = dbInstance.transaction('activeGlobalAudios', 'readwrite');
            const store = transaction.objectStore('activeGlobalAudios');
            store.add(itemWithProjectId);
        } catch (error) {
            console.error('Error adding global audio:', error);
        }
    }, [dbInstance]);

    const updateGlobalAudioPersisted = useCallback((globalAudio: any) => {
        setActiveGlobalAudios((prev) => prev.map((a) => a.id === globalAudio.id ? globalAudio : a));

        try {
            if (!dbInstance) return;
            const transaction = dbInstance.transaction('activeGlobalAudios', 'readwrite');
            const store = transaction.objectStore('activeGlobalAudios');
            store.put(globalAudio);
        } catch (error) {
            console.error('Error updating global audio:', error);
        }
    }, [dbInstance]);

    const deleteGlobalAudioPersisted = useCallback((id: string) => {
        setActiveGlobalAudios((prev) => prev.filter((a) => a.id !== id));

        try {
            if (!dbInstance) return;
            const transaction = dbInstance.transaction('activeGlobalAudios', 'readwrite');
            const store = transaction.objectStore('activeGlobalAudios');
            store.delete(id);
        } catch (error) {
            console.error('Error deleting global audio:', error);
        }
    }, [dbInstance]);

    const addSoundboardItemPersisted = useCallback((item: any, projectId: number) => {\;
content = content.replace(methodsTarget, methodsReplacement);

// 6. Return values in Provider
const returnTarget = 'activeSoundboardItems,';
const returnReplacement = \ctiveSoundboardItems,
        activeGlobalAudios,
        addGlobalAudioPersisted,
        updateGlobalAudioPersisted,
        deleteGlobalAudioPersisted,\;
content = content.replace(returnTarget, returnReplacement);

fs.writeFileSync('src/utils/indexedDB/index.tsx', content);
console.log('Database index updated successfully.');
