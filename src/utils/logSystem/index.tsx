import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { v4 as uuidv4 } from 'uuid';

interface LogSystemContextProps {
    lastLog: string | undefined;
    updateDragLog: () => void;
    loadLog: (database?: IDBDatabase) => void;
    deleteAllLogs: () => void;
    getLastLog: () => string | undefined;
    usageLog: string | undefined;
    setUsageLog: (log: string) => void;
}

const LogSystemContext = createContext<LogSystemContextProps | undefined>(undefined);

export function LogSystemProvider({ children }: { children: ReactNode }) {
    const [db, setDb] = useState<IDBDatabase | null>(null);
    const [lastLog, setLastLog] = useState<string>();
    const [usageLog, setUsageLog] = useState<string>();

    const loadLog = useCallback((database?: IDBDatabase) => {
        const dbInstance = database || db;
        if (!dbInstance) return;

        const transaction = dbInstance.transaction(['logHistoryDB'], 'readwrite');
        const store = transaction.objectStore('logHistoryDB');
        const index = store.index('date');
        const getAllRequest = index.getAll();

        getAllRequest.onsuccess = () => {
            const result = getAllRequest.result;
            if (result.length > 999) {
                const cursorRequest = store.openCursor();
                cursorRequest.onsuccess = (e: Event) => {
                    const cursor = (e.target as IDBRequest).result as IDBCursor;
                    if (cursor) {
                        cursor.delete();
                    }
                };
            }

            if (result.length > 0) {
                const lastItem = result[result.length - 1];
                setLastLog(new Date(lastItem.date).toLocaleString());
            }
        };

        getAllRequest.onerror = (event: Event) => {
            console.error("Erro ao carregar log:", (event.target as IDBRequest).error);
        };
    }, [db]);

    const getLastLog = useCallback(() => {
        return lastLog;
    }, [lastLog]);

    const updateDragLog = useCallback(() => {
        if (!db) return;

        const transaction = db.transaction(['logHistoryDB'], 'readwrite');
        const store = transaction.objectStore('logHistoryDB');

        const logRecord = {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? uuidv4() : (Math.random().toString(36).substring(2) + Date.now().toString(36)),
            type: "drag",
            date: new Date()
        };
        const addRequest = store.put(logRecord);

        addRequest.onsuccess = () => {
            const date = new Date(logRecord.date).toLocaleString();
            setLastLog(date);
            loadLog(db);
        };

        addRequest.onerror = (event: Event) => {
            console.error("Erro ao salvar log:", (event.target as IDBRequest).error);
        };
    }, [db, loadLog]);

    const deleteAllLogs = useCallback(() => {
        if (!db) return;
        const transaction = db.transaction(['logHistoryDB'], 'readwrite');
        const store = transaction.objectStore('logHistoryDB');
        const request = store.clear();

        request.onsuccess = () => {
            setLastLog(undefined);
        };

        request.onerror = (event: Event) => {
            console.error("Erro ao limpar logs:", (event.target as IDBRequest).error);
        };
    }, [db]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const request = indexedDB.open('logHistoryDB', 1);

        request.onerror = (event: Event) => {
            console.error("Erro ao abrir o IndexedDB:", (event.target as IDBOpenDBRequest).error);
        };

        request.onsuccess = (event: Event) => {
            const database = (event.target as IDBOpenDBRequest).result;
            setDb(database);
            loadLog(database);
        };

        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
            const database = (event.target as IDBOpenDBRequest).result;
            if (!database.objectStoreNames.contains('logHistoryDB')) {
                const store = database.createObjectStore('logHistoryDB', { keyPath: 'id' });
                store.createIndex('date', 'date', { unique: false });
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const value = useMemo(() => ({
        lastLog,
        updateDragLog,
        loadLog,
        deleteAllLogs,
        getLastLog,
        usageLog,
        setUsageLog
    }), [lastLog, updateDragLog, loadLog, deleteAllLogs, getLastLog, usageLog]);

    return <LogSystemContext.Provider value={value}>{children}</LogSystemContext.Provider>;
}

export function useLogSystem() {
    const context = useContext(LogSystemContext);
    if (!context) {
        throw new Error('useLogSystem deve ser usado dentro de um LogSystemProvider');
    }
    return context;
}