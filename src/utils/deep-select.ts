import { useCanvasGlobalStore } from '@/store/canvasStore';

export const handleDeepSelectCycle = (clientX: number, clientY: number, clickedItemId: string, isCurrentlySelected: boolean): boolean => {
    // Only trigger deep select if the clicked item is ALREADY selected
    if (!isCurrentlySelected) {
        return false;
    }

    // Temporarily remove z-50 from all selected items to let elementsFromPoint pierce through
    const selectedEls = document.querySelectorAll('.draggable-item.z-50');
    const restored: { el: HTMLElement, oldZ: string, hasZ50: boolean }[] = [];
    selectedEls.forEach((el) => {
        const htmlEl = el as HTMLElement;
        restored.push({ el: htmlEl, oldZ: htmlEl.style.zIndex, hasZ50: htmlEl.classList.contains('z-50') });
        htmlEl.style.zIndex = htmlEl.getAttribute('data-original-zindex') || 'auto';
        htmlEl.classList.remove('z-50');
    });

    const elementsUnder = document.elementsFromPoint(clientX, clientY);
    
    // Restore z-indexes immediately
    restored.forEach(({ el, oldZ, hasZ50 }) => {
        el.style.zIndex = oldZ;
        if (hasZ50) el.classList.add('z-50');
    });

    const itemIds = elementsUnder
        .map(el => el.closest('.draggable-item'))
        .filter(el => el !== null)
        .map(el => el!.getAttribute('data-item-id'));
    
    const uniqueIds = Array.from(new Set(itemIds)).filter((elId): elId is string => elId !== null);
    
    const now = Date.now();
    const sortedIdsStr = [...uniqueIds].sort().join(',');

    if (uniqueIds.length > 1) {
        // Make sure lastDeepSelect exists globally on window since we are outside component
        if (!(window as any).lastDeepSelect) {
            (window as any).lastDeepSelect = { items: [], currentIndex: 0, time: 0, sortedStr: '' };
        }
        const lastDeepSelect = (window as any).lastDeepSelect;

        if (lastDeepSelect.sortedStr === sortedIdsStr && (now - lastDeepSelect.time < 5000)) {
            lastDeepSelect.currentIndex = (lastDeepSelect.currentIndex + 1) % lastDeepSelect.items.length;
        } else {
            const myIndex = uniqueIds.indexOf(clickedItemId);
            lastDeepSelect.items = [...uniqueIds];
            lastDeepSelect.sortedStr = sortedIdsStr;
            lastDeepSelect.currentIndex = (myIndex !== -1 ? myIndex + 1 : 1) % uniqueIds.length;
        }
        lastDeepSelect.time = now;
        const nextId = lastDeepSelect.items[lastDeepSelect.currentIndex];
        
        useCanvasGlobalStore.getState().setSelectedItemIds(new Set([nextId]));
        return true;
    }

    return false;
};
