import { createContext, useContext, useState, useEffect } from 'react';
import { useLogSystem } from '@/utils/logSystem';


const IndexedDBContext = createContext(null);

export function IDBProvider({ children }) {
    const [db, setDb] = useState(null);
    const [isOn, setIsOn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [savedAudios, setSavedAudios] = useState([]);
    const [activePlayers, setActivePlayers] = useState([]);
    const [activeAudios, setActiveAudios] = useState([]);
    const [message, setMessage] = useState('');
    const [usageLog, setUsageLog] = useState();

    const {
        lastLog,
        updateDragLog,
        deleteAllLogs
    } = useLogSystem()


    async function verificarEspacoDeArmazenamento() {

        if ('storage' in navigator && 'estimate' in navigator.storage) {
            try {
                const { usage, quota } = await navigator.storage.estimate();

                const usageMB = (usage / 1024 / 1024).toFixed(2);
                const quotaMB = (quota / 1024 / 1024).toFixed(2);

                setUsageLog(usageMB);

            } catch (error) {
                console.error('Não foi possível estimar o espaço:', error);
            }
        } else {
            console.error('A API navigator.storage não é suportada neste navegador.');
        }
    }

    const loadAudios = (database: any) => {
        const dbInstance = database || db;
        if (!dbInstance) return;

        setIsLoading(true);
        const transaction = dbInstance.transaction(['audios'], 'readonly');
        const store = transaction.objectStore('audios');
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
            const audiosWithUrls = getAllRequest.result.map(audioRecord => ({
                ...audioRecord,
                url: URL.createObjectURL(audioRecord.file)
            }));
            setSavedAudios(audiosWithUrls);
            setIsLoading(false);
            setIsOn(true);
        };

        getAllRequest.onerror = (event: Event) => {
            console.error("Erro ao carregar áudios:", event.target?.error);
            setMessage('Não foi possível carregar os áudios salvos.');
            setIsLoading(false);
        };
        return (true);
    };

    const findaudio = (id) => {
        const caudio = savedAudios.find(a => a.id === id);
        return (caudio)
    }

    const findPlayer = (id) => {

        const dbInstance = db;
        if (!dbInstance) return;
        const transaction = db.transaction(['persistedCanvas'], 'readwrite');
        const store = transaction.objectStore('persistedCanvas', { keyPath: 'id' });
        const foundPlayer = store.get(id)

        return (foundPlayer)
    }

    const removePlayerByAudioId = (id) => {
        console.log(id)
        setActivePlayers(prevPlayers => prevPlayers.filter(p => p.audio.id !== id));
    }

    const loadCanvas = (database) => {
        const dbInstance = database || db;
        if (!dbInstance) return;

        setIsLoading(true);
        const transaction = dbInstance.transaction(['persistedCanvas'], 'readonly');
        const store = transaction.objectStore('persistedCanvas');
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
            const playersWithUrl = getAllRequest.result.map(player => {

                const holder = findaudio(player.audio.id);

                player.audio.url = holder?.url
                return player
            });
            setActivePlayers(playersWithUrl)
            setIsLoading(false);
        };

        getAllRequest.onerror = (event) => {
            console.error("Erro ao carregar áudios:", event.target.error);
            setMessage('Não foi possível carregar os áudios salvos.');
            setIsLoading(false);
        };
    };

    const saveAudio = (file) => {
        if (!db || !file) {
            setMessage('Selecione um arquivo de áudio antes de salvar.');
            return;
        }

        const transaction = db.transaction(['audios'], 'readwrite');
        const store = transaction.objectStore('audios');
        const audioRecord = {
            name: file.name,
            type: file.type,
            file: file,
            createdAt: new Date()
        };

        const addRequest = store.add(audioRecord);

        addRequest.onsuccess = () => {
            setMessage(`Áudio "${file.name}" salvo com sucesso!`);
            document.getElementById('audio-input').value = '';
            loadAudios(db);
        };

        addRequest.onerror = (event) => {
            console.error("Erro ao salvar áudio:", event.target.error);
            setMessage('Ocorreu um erro ao salvar o áudio.');
        };
    };

    const deleteAll = () => {
        if (!db) return;

        const transaction = db.transaction(['audios'], 'readwrite');
        const deleteRequest = transaction.objectStore('audios').clear();

        const transaction2 = db.transaction(['persistedCanvas'], 'readwrite');
        const deleteRequest2 = transaction2.objectStore('persistedCanvas').clear();

        deleteAllLogs();



        deleteRequest.onsuccess = () => {
            setMessage('Áudio deletado com sucesso.');
            loadAudios(db);
            removeAllPlayers();
        };

    };

    const deleteAudio = (id) => {
        if (!db) return;

        const transaction = db.transaction(['audios'], 'readwrite');
        const store = transaction.objectStore('audios');
        const deleteRequest = store.delete(id);

        deleteRequest.onsuccess = () => {
            setMessage('Áudio deletado com sucesso.');
            removePlayerByAudioId(id)
            loadAudios(db);
        };

        deleteRequest.onerror = (event) => {
            console.error("Erro ao deletar áudio:", event.target.error);
            setMessage('Erro ao deletar o áudio.');
        };
    };

    const handleSetActivePlayers = (newPlayer) => {
        console.log(newPlayer)
        const arrayHolder = [...activePlayers, newPlayer]
        console.log(arrayHolder)
        setActivePlayers(arrayHolder)
        console.log(activePlayers)

        addPlayerPersisted(newPlayer)
    }

    const addPlayerPersisted = (player) => {
        const dbInstance = db;
        if (!dbInstance) return;
        const transaction = db.transaction(['persistedCanvas'], 'readwrite');
        const store = transaction.objectStore('persistedCanvas', { keyPath: 'id' });
        const addRequest = store.add(player);

        addRequest.onsuccess = () => {
            setMessage(`canvas foi salvo`);
        };

        addRequest.onerror = (event) => {
            console.error("Erro ao salvar áudio:", event.target.error);
            setMessage('Ocorreu um erro ao salvar o canvas.');
        };
    }

    const updatePlayerPersisted = (player) => {

        const dbInstance = db;
        if (!dbInstance) return;

        const transaction = db.transaction(['persistedCanvas'], 'readwrite');
        const store = transaction.objectStore('persistedCanvas', { keyPath: 'id' });

        console.log(player)

        const addRequest = store.put(player)
        addRequest.onsuccess = () => {
            updateDragLog();
            setMessage(`canvas foi salvo`);
        };

        addRequest.onerror = (event) => {
            console.error("Erro ao salvar canvas:", event.target.error);
            setMessage('Ocorreu um erro ao salvar o canvas.');
        };
    };

    const removeAllPlayers = () => {
        setActivePlayers([]);
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const request = indexedDB.open('canvasDatabase', 1);

        request.onerror = (event) => {
            console.error("Erro ao abrir o IndexedDB:", event.target?.error);
            setMessage('Erro ao carregar o banco de dados local.');
            setIsLoading(false);
        };

        request.onsuccess = (event) => {
            const database = event.target?.result;
            setDb(database);

            loadAudios(database);

            if (savedAudios.length !== 0) loadCanvas(database);

        }
        request.onupgradeneeded = (event) => {
            const database = event.target?.result;
            if (!database.objectStoreNames.contains('audios')) {
                database.createObjectStore('audios', { keyPath: 'id', autoIncrement: true });
            }
            if (!database.objectStoreNames.contains('persistedCanvas')) {
                database.createObjectStore('persistedCanvas', { keyPath: 'id' });
            }
        };
    }, []);




    useEffect(() => {

        if (isOn) {
            loadCanvas(db)
            setIsOn(false)
        }

    }, [loadCanvas])

      useEffect(() => {

        verificarEspacoDeArmazenamento()

    }, [loadAudios])

    const value = {
        db,
        findaudio,
        deleteAudio,
        deleteAll,
        isLoading,
        savedAudios,
        findPlayer,
        activePlayers,
        addPlayerPersisted,
        updatePlayerPersisted,
        setMessage,
        saveAudio,
        handleSetActivePlayers,
        setActiveAudios,
        usageLog
    };

    return <IndexedDBContext.Provider value={value}>{children}</IndexedDBContext.Provider>;
}

export function useIDB() {
    const context = useContext(IndexedDBContext);
    if (!context) {
        throw new Error('useIDB deve ser usado dentro de um IDBProvider');
    }
    return context;
}