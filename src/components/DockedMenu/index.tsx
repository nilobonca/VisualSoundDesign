import React from 'react';
import { Layers, MapPin, Clock, X, ExternalLink, Folder } from 'lucide-react';

interface DockedMenuProps {
    activeTab: 'layers' | 'pins' | 'history' | 'assets';
    onTabChange: (tab: 'layers' | 'pins' | 'history' | 'assets') => void;
    onClose: () => void;
    onUndock: () => void;
    children: React.ReactNode;
}

export default function DockedMenu({ activeTab, onTabChange, onClose, onUndock, children }: DockedMenuProps) {
    return (
        <div className="flex flex-col h-full bg-white dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-800 w-80 shadow-xl z-50">
            {/* Header / Tabs */}
            <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900">
                <div className="flex gap-1">
                    <button
                        onClick={() => onTabChange('layers')}
                        className={`p-2 rounded-md transition-colors ${activeTab === 'layers' ? 'bg-white dark:bg-neutral-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-neutral-800'}`}
                        title="Camadas"
                    >
                        <Layers size={20} />
                    </button>
                    <button
                        onClick={() => onTabChange('pins')}
                        className={`p-2 rounded-md transition-colors ${activeTab === 'pins' ? 'bg-white dark:bg-neutral-800 shadow-sm text-orange-600 dark:text-orange-400' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-neutral-800'}`}
                        title="Pins"
                    >
                        <MapPin size={20} />
                    </button>
                    <button
                        onClick={() => onTabChange('history')}
                        className={`p-2 rounded-md transition-colors ${activeTab === 'history' ? 'bg-white dark:bg-neutral-800 shadow-sm text-gray-800 dark:text-gray-200' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-neutral-800'}`}
                        title="Histórico"
                    >
                        <Clock size={20} />
                    </button>
                    <button
                        onClick={() => onTabChange('assets')}
                        className={`p-2 rounded-md transition-colors ${activeTab === 'assets' ? 'bg-white dark:bg-neutral-800 shadow-sm text-purple-600 dark:text-purple-400' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-neutral-800'}`}
                        title="Assets"
                    >
                        <Folder size={20} />
                    </button>
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={onUndock}
                        className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-neutral-800 rounded-md transition-colors"
                        title="Desacoplar (Janelas Flutuantes)"
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
