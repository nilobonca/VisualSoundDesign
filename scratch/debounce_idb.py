import re

filepath = "src/utils/indexedDB/index.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Add useRef to React import
if "useRef" not in content[:200]:
    content = content.replace("useMemo, ReactNode", "useMemo, useRef, ReactNode")

# Find updateItemPersisted and replace it
old_code = """    const updateItemPersisted = useCallback((item: unknown, type: string) => {
        if (!db) return;
        const transaction = db.transaction(['persistedCanvas'], 'readwrite');
        const store = transaction.objectStore('persistedCanvas');
        const request = store.put(item);

        request.onsuccess = () => {
            updateDragLog();
        };
        request.onerror = (e: Event) => console.error(`Erro ao salvar ${type}:`, (e.target as IDBRequest).error);
    }, [db, updateDragLog]);"""

new_code = """    const pendingUpdatesRef = useRef<Map<string, any>>(new Map());
    const flushTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const flushUpdates = useCallback(() => {
        if (!db || pendingUpdatesRef.current.size === 0) return;
        const transaction = db.transaction(['persistedCanvas'], 'readwrite');
        const store = transaction.objectStore('persistedCanvas');
        
        pendingUpdatesRef.current.forEach((item) => {
            store.put(item);
        });
        
        transaction.oncomplete = () => {
            updateDragLog();
        };
        transaction.onerror = (e) => console.error("Erro no flush batch:", (e.target as IDBRequest).error);
        
        pendingUpdatesRef.current.clear();
        flushTimeoutRef.current = null;
    }, [db, updateDragLog]);

    const updateItemPersisted = useCallback((item: any, type: string) => {
        pendingUpdatesRef.current.set(item.id, item);
        
        if (flushTimeoutRef.current) clearTimeout(flushTimeoutRef.current);
        flushTimeoutRef.current = setTimeout(flushUpdates, 300); // 300ms debounce
    }, [flushUpdates]);"""

content = content.replace(old_code, new_code)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
print("Debounced updateItemPersisted")
