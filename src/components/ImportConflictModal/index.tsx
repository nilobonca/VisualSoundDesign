import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle, Copy, Edit2, SkipForward, Check } from 'lucide-react';
import { Layer } from '@/interfaces/utils/indexedDB';
import { ConflictResolution, ParsedImportData, executeImport, ConflictAction } from '@/utils/exportSystem/importUtils';
import clsx from 'clsx';

interface ImportConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  parsedData: ParsedImportData | null;
  onSuccess: () => void;
}

export const ImportConflictModal: React.FC<ImportConflictModalProps> = ({
  isOpen,
  onClose,
  parsedData,
  onSuccess
}) => {
  const [resolutions, setResolutions] = useState<Record<string, ConflictResolution>>({});
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!isOpen || !parsedData) return null;

  const { conflictingProjects, allImportedProjects } = parsedData;

  const handleAction = (projectId: string, action: ConflictAction, newName?: string) => {
    setResolutions(prev => ({
      ...prev,
      [projectId]: { projectId, action, newName }
    }));
  };

  const handleApplyAll = (action: ConflictAction) => {
    const newRes: Record<string, ConflictResolution> = {};
    conflictingProjects.forEach(p => {
      newRes[p.id] = { 
        projectId: p.id, 
        action,
        newName: action === 'rename' ? `${p.name} (Importado)` : undefined
      };
    });
    setResolutions(newRes);
  };

  const handleImport = async () => {
    setIsImporting(true);
    setProgress(0);
    try {
      // Ensure all conflicts are resolved
      const finalResolutions = { ...resolutions };
      conflictingProjects.forEach(p => {
        if (!finalResolutions[p.id]) {
          finalResolutions[p.id] = { projectId: p.id, action: 'replace' }; // Default fallback
        }
      });

      await executeImport(parsedData, finalResolutions, (p) => setProgress(p));
      
      setIsImporting(false);
      onSuccess();
    } catch (err) {
      console.error(err);
      alert('Erro ao importar arquivo.');
      setIsImporting(false);
    }
  };

  const isAllResolved = conflictingProjects.every(p => resolutions[p.id]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-[600px] max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Importação de Backup</h2>
            {conflictingProjects.length > 0 ? (
               <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
                 <AlertTriangle size={16} /> Encontramos {conflictingProjects.length} projeto(s) conflitante(s).
               </p>
            ) : (
               <p className="text-sm text-gray-500 mt-1">Nenhum conflito encontrado. Pronto para importar {allImportedProjects.length} projeto(s).</p>
            )}
          </div>
          <button 
            onClick={onClose}
            disabled={isImporting}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {conflictingProjects.length > 0 && (
            <div className="space-y-6">
              <div className="flex gap-2 mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <div className="text-sm text-amber-800 flex-1">
                  Estes projetos já existem na sua máquina. O que deseja fazer com eles?
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApplyAll('replace')} className="text-xs font-medium px-3 py-1.5 bg-white border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors">
                    Substituir Todos
                  </button>
                  <button onClick={() => handleApplyAll('duplicate')} className="text-xs font-medium px-3 py-1.5 bg-white border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors">
                    Duplicar Todos
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {conflictingProjects.map(project => {
                  const res = resolutions[project.id];
                  const action = res?.action;

                  return (
                    <div key={project.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-900">{project.name}</div>
                        {action && <CheckCircle size={18} className="text-emerald-500" />}
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        <button
                          onClick={() => handleAction(project.id, 'replace')}
                          className={clsx(
                            "flex flex-col items-center justify-center p-2 rounded-lg border transition-colors text-xs font-medium gap-1",
                            action === 'replace' ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 hover:border-gray-300 text-gray-600"
                          )}
                        >
                          <Check size={16} /> Substituir
                        </button>
                        <button
                          onClick={() => handleAction(project.id, 'duplicate')}
                          className={clsx(
                            "flex flex-col items-center justify-center p-2 rounded-lg border transition-colors text-xs font-medium gap-1",
                            action === 'duplicate' ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-gray-300 text-gray-600"
                          )}
                        >
                          <Copy size={16} /> Duplicar
                        </button>
                        <button
                          onClick={() => handleAction(project.id, 'rename', `${project.name} (Importado)`)}
                          className={clsx(
                            "flex flex-col items-center justify-center p-2 rounded-lg border transition-colors text-xs font-medium gap-1",
                            action === 'rename' ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-200 hover:border-gray-300 text-gray-600"
                          )}
                        >
                          <Edit2 size={16} /> Renomear
                        </button>
                        <button
                          onClick={() => handleAction(project.id, 'ignore')}
                          className={clsx(
                            "flex flex-col items-center justify-center p-2 rounded-lg border transition-colors text-xs font-medium gap-1",
                            action === 'ignore' ? "border-gray-500 bg-gray-100 text-gray-700" : "border-gray-200 hover:border-gray-300 text-gray-600"
                          )}
                        >
                          <SkipForward size={16} /> Ignorar
                        </button>
                      </div>

                      {action === 'rename' && (
                        <div className="mt-2">
                          <input
                            type="text"
                            value={res.newName || ''}
                            onChange={(e) => handleAction(project.id, 'rename', e.target.value)}
                            className="w-full text-sm p-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                            placeholder="Novo nome do projeto..."
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isImporting && (
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-emerald-600">Importando dados e remapeando IDs...</span>
                <span className="text-gray-500">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-emerald-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={isImporting}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleImport}
            disabled={isImporting || (!isAllResolved && conflictingProjects.length > 0)}
            className="px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            {isImporting ? 'Importando...' : 'Iniciar Importação'}
          </button>
        </div>
      </div>
    </div>
  );
};
