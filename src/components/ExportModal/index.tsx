import React, { useState } from 'react';
import { X, Download, Package, CheckSquare, Square, Loader2 } from 'lucide-react';
import { exportAllProjects, exportSpecificPages } from '@/utils/exportSystem/exportUtils';
import { Layer } from '@/interfaces/utils/indexedDB';
import clsx from 'clsx';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeLayers: Layer[]; // To show available projects/pages
  currentProjectId?: string | null;
  currentPageId?: string | null;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  activeLayers,
  currentProjectId,
  currentPageId
}) => {
  const [exportType, setExportType] = useState<'current_page' | 'multiple_pages' | 'all'>('all');
  const [selectedPages, setSelectedPages] = useState<string[]>(currentPageId ? [currentPageId] : []);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!isOpen) return null;

  // Filter pages for current project
  const currentProjectPages = activeLayers.filter(
    l => l.type === 'group' && l.projectId === currentProjectId && !l.isProject
  );

  const togglePage = (id: string) => {
    setSelectedPages(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleExport = async () => {
    setIsExporting(true);
    setProgress(0);
    try {
      if (exportType === 'all') {
        await exportAllProjects((p) => setProgress(p));
      } else if (exportType === 'current_page' && currentPageId && currentProjectId) {
        await exportSpecificPages(currentProjectId, [currentPageId], (p) => setProgress(p));
      } else if (exportType === 'multiple_pages' && currentProjectId) {
        if (selectedPages.length === 0) {
          alert('Selecione pelo menos uma página.');
          setIsExporting(false);
          return;
        }
        await exportSpecificPages(currentProjectId, selectedPages, (p) => setProgress(p));
      }
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 500);
    } catch (err) {
      console.error(err);
      alert('Erro ao exportar. Tente novamente.');
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-[480px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Exportar Backup</h2>
            <p className="text-sm text-gray-500 mt-1">Baixe um pacote .zip com seus áudios e configurações.</p>
          </div>
          <button 
            onClick={onClose}
            disabled={isExporting}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-900">O que você deseja exportar?</label>
            <div className="grid gap-3">
              {currentProjectId && (
                <button
                  onClick={() => setExportType('current_page')}
                  className={clsx(
                    "flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all",
                    exportType === 'current_page' ? "border-emerald-500 bg-emerald-50/50" : "border-gray-200 hover:border-emerald-200 hover:bg-gray-50"
                  )}
                >
                  <Download className={clsx("mt-0.5", exportType === 'current_page' ? "text-emerald-500" : "text-gray-400")} size={20} />
                  <div>
                    <div className="font-medium text-gray-900">Página Atual</div>
                    <div className="text-sm text-gray-500 mt-0.5">Apenas os itens e mídias desta tela.</div>
                  </div>
                </button>
              )}

              {currentProjectId && currentProjectPages.length > 0 && (
                <button
                  onClick={() => setExportType('multiple_pages')}
                  className={clsx(
                    "flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all",
                    exportType === 'multiple_pages' ? "border-emerald-500 bg-emerald-50/50" : "border-gray-200 hover:border-emerald-200 hover:bg-gray-50"
                  )}
                >
                  <CheckSquare className={clsx("mt-0.5", exportType === 'multiple_pages' ? "text-emerald-500" : "text-gray-400")} size={20} />
                  <div>
                    <div className="font-medium text-gray-900">Páginas Específicas</div>
                    <div className="text-sm text-gray-500 mt-0.5">Escolha quais páginas deste projeto deseja incluir.</div>
                  </div>
                </button>
              )}

              <button
                onClick={() => setExportType('all')}
                className={clsx(
                  "flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all",
                  exportType === 'all' ? "border-emerald-500 bg-emerald-50/50" : "border-gray-200 hover:border-emerald-200 hover:bg-gray-50"
                )}
              >
                <Package className={clsx("mt-0.5", exportType === 'all' ? "text-emerald-500" : "text-gray-400")} size={20} />
                <div>
                  <div className="font-medium text-gray-900">Backup Completo (Tudo)</div>
                  <div className="text-sm text-gray-500 mt-0.5">Todos os projetos, páginas, áudios e imagens do PC.</div>
                </div>
              </button>
            </div>
          </div>

          {exportType === 'multiple_pages' && (
            <div className="space-y-3 pt-2">
              <label className="text-sm font-semibold text-gray-900">Selecione as páginas:</label>
              <div className="max-h-[160px] overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
                {currentProjectPages.map(page => (
                  <button
                    key={page.id}
                    onClick={() => togglePage(page.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm text-gray-700">{page.name}</span>
                    {selectedPages.includes(page.id) ? (
                      <CheckSquare size={18} className="text-emerald-500" />
                    ) : (
                      <Square size={18} className="text-gray-300" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isExporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-emerald-600">Compactando dados...</span>
                <span className="text-gray-500">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-center text-gray-500 mt-2">
                Arquivos de áudio muito pesados podem demorar um pouco.
              </p>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            {isExporting ? 'Exportando...' : 'Exportar .ZIP'}
          </button>
        </div>
      </div>
    </div>
  );
};
