import React, { useState } from 'react';
import { Audios } from '@/interfaces/utils/indexedDB';
import { Search, X, Music } from 'lucide-react';

interface AudioSelectorProps {
    audios: Audios[];
    onSelect: (audioId: number) => void;
    onClose: () => void;
}

export default function AudioSelector({ audios, onSelect, onClose }: AudioSelectorProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredAudios = audios.filter(audio =>
        audio.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-xl shadow-2xl border border-gray-200 dark:border-neutral-700 flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Music className="w-5 h-5 text-blue-500" />
                        Selecionar Áudio
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 pb-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar áudio..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-100 dark:bg-neutral-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-500"
                            autoFocus
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filteredAudios.length > 0 ? (
                        filteredAudios.map((audio) => (
                            <button
                                key={audio.id}
                                onClick={() => onSelect(audio.id)}
                                className="w-full text-left px-4 py-3 rounded-lg hover:bg-blue-50 dark:hover:bg-neutral-800 group transition-colors flex items-center gap-3"
                            >
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <Music size={14} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                        {audio.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {(audio.file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                            <Music className="w-12 h-12 mb-2 opacity-20" />
                            <p className="text-sm">Nenhum áudio encontrado</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
