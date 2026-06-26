import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileAudio, Loader2, X, Check } from 'lucide-react';
import clsx from 'clsx';

interface BatchAudioUploadModalProps {
    files: File[];
    isUploading: boolean;
    progress: {
        current: number;
        total: number;
        currentFileName: string;
    };
    onConfirm: () => void;
    onCancel: () => void;
}

export default function BatchAudioUploadModal({
    files,
    isUploading,
    progress,
    onConfirm,
    onCancel
}: BatchAudioUploadModalProps) {
    if (files.length === 0) return null;

    const totalSize = files.reduce((acc, file) => acc + file.size, 0);
    const formattedSize = (totalSize / (1024 * 1024)).toFixed(2) + ' MB';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
                >
                    <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <FileAudio className="text-blue-500" />
                            {isUploading ? 'Carregando Áudios...' : 'Importar Áudios'}
                        </h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                            {files.length} {files.length === 1 ? 'arquivo selecionado' : 'arquivos selecionados'} ({formattedSize})
                        </p>
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto max-h-[40vh] bg-neutral-50 dark:bg-neutral-900/50">
                        {isUploading ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                                <div className="w-full max-w-xs bg-neutral-200 dark:bg-neutral-800 rounded-full h-2.5 mb-4 overflow-hidden">
                                    <motion.div 
                                        className="bg-blue-500 h-2.5 rounded-full" 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(progress.current / progress.total) * 100}%` }}
                                        transition={{ duration: 0.2 }}
                                    />
                                </div>
                                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                                    Processando {progress.current} de {progress.total}
                                </p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 truncate w-full px-4" title={progress.currentFileName}>
                                    {progress.currentFileName || 'Preparando...'}
                                </p>
                                <p className="text-[10px] text-orange-500 mt-4 max-w-xs">
                                    Por favor, aguarde. O carregamento de áudios longos pode causar pequenos travamentos devido à decodificação.
                                </p>
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {files.map((file, idx) => (
                                    <li key={idx} className="flex items-center gap-3 bg-white dark:bg-neutral-800 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700/50 shadow-sm">
                                        <div className="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                            <FileAudio size={16} className="text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate" title={file.name}>
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-neutral-500">
                                                {(file.size / (1024 * 1024)).toFixed(2)} MB
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-3 bg-white dark:bg-neutral-900">
                        <button
                            onClick={onCancel}
                            disabled={isUploading}
                            className="px-4 py-2 text-sm font-medium rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isUploading}
                            className={clsx(
                                "px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors",
                                isUploading
                                    ? "bg-blue-500/50 text-white cursor-not-allowed"
                                    : "bg-blue-500 text-white hover:bg-blue-600"
                            )}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Carregando...
                                </>
                            ) : (
                                <>
                                    <Check size={16} />
                                    Carregar
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
