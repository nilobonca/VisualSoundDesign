import React from 'react';
import { Layers, MapPin, Clock, X, ExternalLink, Folder, LayoutGrid } from 'lucide-react';

interface DockedMenuProps {
    activeTab: 'layers' | 'pins' | 'history' | 'assets' | 'soundboard' | 'activePlayers';
    onTabChange: (tab: 'layers' | 'pins' | 'history' | 'assets' | 'soundboard' | 'activePlayers') => void;
    onClose: () => void;
    onUndock: (tab: 'layers' | 'pins' | 'history' | 'assets' | 'soundboard' | 'activePlayers') => void;
    dockedItems: Set<'layers' | 'pins' | 'history' | 'assets' | 'soundboard' | 'activePlayers'>;
    children: React.ReactNode;
}

export default function DockedMenu({ activeTab, onTabChange, onClose, onUndock, dockedItems, children }: DockedMenuProps) {
    return (
        <div className="flex flex-col h-full bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 w-80 shadow-xl z-50">
            {/* Header / Tabs */}
            <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900">
                <div className="flex gap-1">
                    {dockedItems.has('layers') && (
                        <button
                            onClick={() => onTabChange('layers')}
                            className={`p-2 rounded-md transition-colors ${activeTab === 'layers' ? 'bg-white dark:bg-neutral-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-neutral-800'}`}
                            title="Camadas"
                        >
                            <Layers size={20} />
                        </button>
                    )}
                    {dockedItems.has('pins') && (
                        <button
                            onClick={() => onTabChange('pins')}
                            className={`p-2 rounded-md transition-colors ${activeTab === 'pins' ? 'bg-white dark:bg-neutral-800 shadow-sm text-orange-600 dark:text-orange-400' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-neutral-800'}`}
                            title="Pins"
                        >
                            <MapPin size={20} />
                        </button>
                    )}
                    {dockedItems.has('history') && (
                        <button
                            onClick={() => onTabChange('history')}
                            className={`p-2 rounded-md transition-colors ${activeTab === 'history' ? 'bg-white dark:bg-neutral-800 shadow-sm text-gray-800 dark:text-gray-200' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-neutral-800'}`}
                            title="Histórico"
                        >
                            <Clock size={20} />
                        </button>
                    )}
                    {dockedItems.has('assets') && (
                        <button
                            onClick={() => onTabChange('assets')}
                            className={`p-2 rounded-md transition-colors ${activeTab === 'assets' ? 'bg-white dark:bg-neutral-800 shadow-sm text-purple-600 dark:text-purple-400' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-neutral-800'}`}
                            title="Assets"
                        >
                            <Folder size={20} />
                        </button>
                    )}
                    {dockedItems.has('soundboard') && (
                        <button
                            onClick={() => onTabChange('soundboard')}
                            className={`p-2 rounded-md transition-colors ${activeTab === 'soundboard' ? 'bg-white dark:bg-neutral-800 shadow-sm text-green-600 dark:text-green-400' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-neutral-800'}`}
                            title="Soundboard"
                        >
                            <LayoutGrid size={20} />
                        </button>
                    )}
                    {dockedItems.has('activePlayers') && (
                        <button
                            onClick={() => onTabChange('activePlayers')}
                            className={`p-2 rounded-md transition-colors ${activeTab === 'activePlayers' ? 'bg-white dark:bg-neutral-800 shadow-sm text-cyan-600 dark:text-cyan-400' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-neutral-800'}`}
                            title="Players Ativos"
                        >
                            {/* Using a different icon for Active Players, maybe 'Music' or 'Volume2' but imported from lucide-react */}
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M 15.54 8.46 a 5 5 0 0 1 0 7.07"></path><path d="M 19.07 4.93 a 10 10 0 0 1 0 14.14"></path></svg>
                        </button>
                    )}
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={() => onUndock(activeTab)}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-neutral-800 rounded-md transition-colors"
                        title="Desacoplar aba atual"
                    >
                        <ExternalLink size={18} />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-200 dark:hover:bg-neutral-800 rounded-md transition-colors"
                        title="Fechar"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative">
                {children}
            </div>
        </div>
    );
}
