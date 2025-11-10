import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Interface } from "readline";

interface LogInterface {
    id: string
    type: string
    date: string
}

const LogSystemContext = createContext(null);

export function LogSystemProvider({ children }) {
    const [db, setDb] = useState<any>(null);
    const [isOn, setIsOn] = useState<boolean>(false);
    const [lastLog, setLastLog] = useState<string>();
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [message, setMessage] = useState('');
    const [logHistory, setLogHistory] = useState([]);
    const [iniciarEfeito, setIniciarEfeito] = useState(false);

    const efeitoJaRodou = useRef(false);

    const loadLog = useCallback((database) => {
        const dbInstance = database || db;
        if (!dbInstance) return;

        setIsLoading(true);
        const transaction = dbInstance.transaction(['logHistoryDB'], 'readwrite');
        const store = transaction.objectStore('logHistoryDB');
        const index = store.index('date');
        const getAllRequest = index.getAll();

        getAllRequest.onsuccess = () => {
            setIniciarEfeito(true);
            if (getAllRequest.result.length > 999) {
                console.log("deletado")
                const cursorRequest = store.openCursor();
                cursorRequest.onsuccess = (e) => {
                    const cursor = e.target.result;

                    if (cursor) {
                        const deleteRequest = cursor.delete();

                        deleteRequest.onsuccess = () => {
                        };
                    }
                }
            }
            setLogHistory(getAllRequest.result)
            setIsLoading(false);
        }
        getAllRequest.onerror = (event: Event) => {
            console.error("Erro ao carregar log:", event.target?.error);
            setMessage('Não foi possível carregar o histórico de mudanças.');
            setIsLoading(false);
        }
    }, [db, setIsLoading, setLogHistory, setMessage])

    const getLastLog = () => {
        return lastLog;
    }

    const updateDragLog = () => {

        if (!db) {
            setMessage('Selecione um arquivo de áudio antes de salvar.');
            return;
        }

        const transaction = db.transaction(['logHistoryDB'], 'readwrite');
        const store = transaction.objectStore('logHistoryDB');
        const logRecord = {
            id: crypto.randomUUID(),
            type: "drag",
            date: new Date()
        };
        const addRequest = store.put(logRecord)
        
        addRequest.onsuccess = () => {
            const date = new Date(logRecord?.date).toLocaleString()
            setLastLog(date)
            loadLog(db);
            
            setMessage(`canvas foi salvo`);
        };

        addRequest.onerror = (event) => {
            console.error("Erro ao salvar log:", event.target.error);
            setMessage('Ocorreu um erro ao salvar o log.');
        };


        return (true);
    }

    const updateArchiveLog = (up: LogInterface) => {



    }

    const deleteAllLogs = () => {
        if (!db) return;

        const transaction = db.transaction(['logHistoryDB'], 'readwrite');
        const deleteRequest = transaction.objectStore('logHistoryDB').clear();


        deleteRequest.onsuccess = () => {
            
            setMessage('Logs deletado com sucesso.');
            loadLog(db);
            setLastLog(null);
        };

    };

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const request = indexedDB.open('logHistoryDB', 1);

        request.onerror = (event) => {
            console.error("Erro ao abrir o IndexedDB:", event.target?.error);
            setMessage('Erro ao carregar o banco de dados local.');
            setIsLoading(false);
        };

        request.onsuccess = (event) => {
            const database = event.target?.result;
            setDb(database);
            loadLog(database);

        }
        request.onupgradeneeded = (event) => {
            const database = event.target?.result;
            if (!database.objectStoreNames.contains('logHistoryDB')) {
                const store = database.createObjectStore('logHistoryDB', { keyPath: 'id'});
                store.createIndex('date', 'date', {unique: false})
            }

        };
    }, []);

   

    useEffect(() => {

        loadLog(db)
         
    }, [])
    

    useEffect(() => {

        if (logHistory.length > 0) {
            const lastItem = logHistory[logHistory.length - 1];
            const date = new Date(lastItem?.date).toLocaleString()
            setLastLog(date)
        }
        

    }, [iniciarEfeito])

    const value = {
        lastLog,
        updateDragLog,
        loadLog,
        deleteAllLogs,
        getLastLog
    }

    return <LogSystemContext.Provider value={value}>{children}</LogSystemContext.Provider>;
}



export function useLogSystem() {
    const context = useContext(LogSystemContext);
    if (!context) {
        throw new Error('useLogSystem deve ser usado dentro de um logSystemProvider');
    }
    return context;
}