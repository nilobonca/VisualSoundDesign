import React from 'react';
import { Players, ActiveImage, ActiveArea, ActivePin, Layer } from '@/interfaces/utils/indexedDB';

interface HistoryState {
    description: string;
    timestamp: number;
    state: {
        activePlayers: Players[];
        activeImages: ActiveImage[];
        activeAreas: ActiveArea[];
        activePins: ActivePin[];
        activeLayers: Layer[];
    };
}

interface HistoryMenuProps {
    history: HistoryState[];
    future: HistoryState[];
    onRestore: (state: HistoryState['state'], index: number, type: 'history' | 'future') => void;
    onClose: () => void;
    isDocked?: boolean;
    onDock?: () => void;
}

export default function HistoryMenu({ history, future, onRestore, onClose, isDocked = false, onDock }: HistoryMenuProps) {
    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    if (isDocked) {
        return (
            <div className="bg-white dark:bg-neutral-900 h-full flex flex-col w-full">
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {/* Future (Redo) */}
                    {future.length > 0 && (
                        <div className="space-y-1">
                            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">Refazer</div>
                            {[...future].reverse().map((entry, i) => (
                                <button
                                    key={`future-${i}`}
                                    onClick={() => onRestore(entry.state, i, 'future')}
                                    className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors group relative border border-transparent hover:border-gray-200 dark:hover:border-neutral-600 opacity-60 hover:opacity-100"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">{entry.description}</span>
                                        <span className="text-xs text-gray-400 font-mono">{formatTime(entry.timestamp)}</span>
                                    </div>
                                </button>
                            ))}
                            <div className="border-b border-dashed border-gray-300 dark:border-neutral-600 my-2 mx-2"></div>
                        </div>
                    )}

                    {/* Current / History (Undo) */}
                    <div className="space-y-1">
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">Histórico</div>
                        {history.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-sm italic">
                                Nenhuma alteração registrada
                            </div>
                        ) : (
                            [...history].reverse().map((entry, i) => {
                                const actualIndex = history.length - 1 - i;
                                return (
                                    <button
                                        key={`history-${actualIndex}`}
                                        onClick={() => onRestore(entry.state, actualIndex, 'history')}
                                        className={`w-full text-left p-3 rounded-lg transition-colors group relative border ${i === 0
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                            : 'hover:bg-gray-100 dark:hover:bg-neutral-700 border-transparent hover:border-gray-200 dark:hover:border-neutral-600'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`font-medium text-sm ${i === 0 ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200'}`}>
                                                {entry.description}
                                            </span>
                                            <span className="text-xs text-gray-400 font-mono">{formatTime(entry.timestamp)}</span>
                                        </div>
                                        {i === 0 && <span className="text-[10px] text-blue-500 font-semibold uppercase tracking-wider">Atual</span>}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-neutral-800 h-full shadow-xl flex flex-col w-80 border-r border-gray-200 dark:border-neutral-700">
            <div className="p-4 border-b border-gray-200 dark:border-neutral-700 flex justify-between items-center bg-gray-50 dark:bg-neutral-900">
                <h2 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <span>clock</span>
                    Histórico
                </h2>
                <div className="flex gap-1">
                    {onDock && (
                        <button
                            onClick={onDock}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-full transition-colors text-gray-500 dark:text-gray-400"
                            title="Acoplar"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 14h6v6" />
                                <path d="M20 10V4h-6" />
                                <path d="M14 10l7-7" />
                                <path d="M3 21l7-7" />
                            </svg>
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-neutral-700 rounded-full transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {/* Future (Redo) */}
                {future.length > 0 && (
                    <div className="space-y-1">
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">Refazer</div>
                        {[...future].reverse().map((entry, i) => (
                            <button
                                key={`future-${i}`}
                                onClick={() => onRestore(entry.state, i, 'future')}
                                className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors group relative border border-transparent hover:border-gray-200 dark:hover:border-neutral-600 opacity-60 hover:opacity-100"
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-medium text-gray-700 dark:text-gray-200 text-sm">{entry.description}</span>
                                    <span className="text-xs text-gray-400 font-mono">{formatTime(entry.timestamp)}</span>
                                </div>
                            </button>
                        ))}
                        <div className="border-b border-dashed border-gray-300 dark:border-neutral-600 my-2 mx-2"></div>
                    </div>
                )}

                {/* Current / History (Undo) */}
                <div className="space-y-1">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">Histórico</div>
                    {history.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-sm italic">
                            Nenhuma alteração registrada
                        </div>
                    ) : (
                        [...history].reverse().map((entry, i) => {
                            const actualIndex = history.length - 1 - i;
                            return (
                                <button
                                    key={`history-${actualIndex}`}
                                    onClick={() => onRestore(entry.state, actualIndex, 'history')}
                                    className={`w-full text-left p-3 rounded-lg transition-colors group relative border ${i === 0
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                        : 'hover:bg-gray-100 dark:hover:bg-neutral-700 border-transparent hover:border-gray-200 dark:hover:border-neutral-600'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`font-medium text-sm ${i === 0 ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200'}`}>
                                            {entry.description}
                                        </span>
                                        <span className="text-xs text-gray-400 font-mono">{formatTime(entry.timestamp)}</span>
                                    </div>
                                    {i === 0 && <span className="text-[10px] text-blue-500 font-semibold uppercase tracking-wider">Atual</span>}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
