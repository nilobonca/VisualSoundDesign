import React, { useEffect, useState } from 'react';
import { useThemeStore } from '@/store/themeStore';
import { X, Check, DownloadCloud, UploadCloud } from 'lucide-react';
import clsx from 'clsx';
import { useRouter } from 'next/router';
import { useIDB } from '@/utils/indexedDB';
import { ExportModal } from '@/components/ExportModal';
import { ImportConflictModal } from '@/components/ImportConflictModal';
import { parseBackupFile, ParsedImportData } from '@/utils/exportSystem/importUtils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { 
    theme, setTheme,
    audioVizEnabled, setAudioVizEnabled,
    audioVizColor, setAudioVizColor,
    audioVizIntensity, setAudioVizIntensity,
    areaRippleEnabled, setAreaRippleEnabled
  } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { activeLayers } = useIDB();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [parsedImportData, setParsedImportData] = useState<ParsedImportData | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  // Extract project/page ID from URL if inside a project
  // Typical route: /project/[id]?page=[pageId]
  const currentProjectId = router.query.id as string | undefined;
  const currentPageId = router.query.page as string | undefined;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        className={clsx(
          "w-full max-w-lg overflow-hidden transition-all duration-300",
          theme === 'ethereal' 
            ? "bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] shadow-2xl" 
            : "bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl"
        )}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className={clsx("text-xl font-medium", theme === 'ethereal' ? "text-white" : "text-neutral-200")}>
            Configurações
          </h2>
          <button 
            onClick={onClose}
            className={clsx(
              "p-2 rounded-full transition-colors",
              theme === 'ethereal' ? "hover:bg-white/10 text-neutral-400 hover:text-white" : "hover:bg-neutral-800 text-neutral-400"
            )}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <h3 className={clsx("mb-4 text-sm font-semibold tracking-wide uppercase", theme === 'ethereal' ? "text-neutral-500" : "text-neutral-400")}>
            Aparência
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Tema Padrão */}
            <button
              onClick={() => setTheme('default')}
              className={clsx(
                "relative flex flex-col items-start p-4 text-left border transition-all duration-300 group",
                theme === 'default'
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-neutral-800 hover:border-neutral-600",
                theme === 'ethereal' ? "rounded-[1.5rem]" : "rounded-lg"
              )}
            >
              <div className="w-full h-24 mb-4 rounded bg-neutral-950 border border-neutral-800 p-2 flex flex-col gap-2">
                 <div className="w-1/2 h-4 rounded bg-neutral-800"></div>
                 <div className="w-full h-8 rounded bg-neutral-900 border border-neutral-800"></div>
              </div>
              <span className="font-medium text-neutral-200">Padrão</span>
              <span className="text-xs text-neutral-500">Design original</span>
              
              {theme === 'default' && (
                <div className="absolute top-4 right-4 text-blue-500">
                  <Check size={18} />
                </div>
              )}
            </button>

            {/* Tema Ethereal Glass */}
            <button
              onClick={() => setTheme('ethereal')}
              className={clsx(
                "relative flex flex-col items-start p-4 text-left border transition-all duration-300 group",
                theme === 'ethereal'
                  ? "border-white/20 bg-white/5"
                  : "border-neutral-800 hover:border-neutral-600",
                theme === 'ethereal' ? "rounded-[1.5rem]" : "rounded-lg"
              )}
            >
              <div className="w-full h-24 mb-4 rounded-[1rem] bg-black border border-white/10 p-2 flex flex-col gap-2">
                 <div className="w-1/2 h-4 rounded-full bg-white/10"></div>
                 <div className="w-full h-8 rounded-full bg-white/5 border border-white/10"></div>
              </div>
              <span className="font-medium text-white">Ethereal Glass</span>
              <span className="text-xs text-neutral-500">Luxo, dark tech, blur</span>
              
              {theme === 'ethereal' && (
                <div className="absolute top-4 right-4 text-white">
                  <Check size={18} />
                </div>
              )}
            </button>
          </div>
          
          {/* Audio Visualizer Settings */}
          <h3 className={clsx("mt-8 mb-4 text-sm font-semibold tracking-wide uppercase", theme === 'ethereal' ? "text-neutral-500" : "text-neutral-400")}>
            Efeito Visual de Áudio
          </h3>
          <div className={clsx(
            "p-4 border transition-all duration-300 space-y-5",
            theme === 'ethereal'
              ? "border-white/10 bg-white/5 rounded-[1.5rem]"
              : "border-neutral-800 bg-neutral-950 rounded-lg"
          )}>
            {/* Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm text-neutral-200">Brilho nas Bordas</div>
                <div className="text-xs text-neutral-500">Tela pulsa com o ritmo da música</div>
              </div>
              <button
                onClick={() => setAudioVizEnabled(!audioVizEnabled)}
                className={clsx(
                  "relative w-11 h-6 rounded-full transition-colors duration-200",
                  audioVizEnabled ? "bg-indigo-500" : "bg-neutral-700"
                )}
              >
                <span className={clsx(
                  "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200",
                  audioVizEnabled && "translate-x-5"
                )} />
              </button>
            </div>

            {/* Area Ripple Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-sm text-neutral-200">Ondas nas Áreas</div>
                <div className="text-xs text-neutral-500">Ondas sonoras emanam do centro das áreas ativas</div>
              </div>
              <button
                onClick={() => setAreaRippleEnabled(!areaRippleEnabled)}
                className={clsx(
                  "relative w-11 h-6 rounded-full transition-colors duration-200",
                  areaRippleEnabled ? "bg-indigo-500" : "bg-neutral-700"
                )}
              >
                <span className={clsx(
                  "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200",
                  areaRippleEnabled && "translate-x-5"
                )} />
              </button>
            </div>
            {audioVizEnabled && (
              <>
                {/* Color */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm text-neutral-200">Cor do Efeito</div>
                    <div className="text-xs text-neutral-500">Escolha a cor do brilho</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {['#818cf8', '#f472b6', '#34d399', '#fbbf24', '#f87171', '#a78bfa'].map(color => (
                      <button
                        key={color}
                        onClick={() => setAudioVizColor(color)}
                        className={clsx(
                          "w-7 h-7 rounded-full border-2 transition-all duration-200 hover:scale-110",
                          audioVizColor === color ? "border-white scale-110" : "border-transparent"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <input
                      type="color"
                      value={audioVizColor}
                      onChange={(e) => setAudioVizColor(e.target.value)}
                      className="w-7 h-7 rounded-full cursor-pointer border-0 bg-transparent p-0"
                      title="Cor personalizada"
                    />
                  </div>
                </div>

                {/* Intensity */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-medium text-sm text-neutral-200">Intensidade</div>
                      <div className="text-xs text-neutral-500">Controla o tamanho e força do brilho</div>
                    </div>
                    <span className="text-xs font-mono text-neutral-400">{Math.round(audioVizIntensity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={audioVizIntensity}
                    onChange={(e) => setAudioVizIntensity(parseFloat(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>
              </>
            )}
          </div>
          
          <h3 className={clsx("mt-8 mb-4 text-sm font-semibold tracking-wide uppercase", theme === 'ethereal' ? "text-neutral-500" : "text-neutral-400")}>
            Exportação e Backup
          </h3>
          <div className="flex gap-4">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className={clsx(
                "flex items-center gap-3 p-4 border transition-all duration-300 w-1/2 hover:scale-[1.02]",
                theme === 'ethereal'
                  ? "border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400"
                  : "border-neutral-800 bg-neutral-950 hover:border-emerald-600 text-neutral-300 hover:text-emerald-500",
                theme === 'ethereal' ? "rounded-[1.5rem]" : "rounded-lg"
              )}
            >
              <DownloadCloud size={24} className="flex-shrink-0" />
              <div className="text-left">
                <div className="font-medium text-inherit">Exportar Dados</div>
                <div className="text-xs opacity-70">Faça o download.</div>
              </div>
            </button>

            <label
              className={clsx(
                "flex items-center gap-3 p-4 border transition-all duration-300 w-1/2 hover:scale-[1.02] cursor-pointer",
                theme === 'ethereal'
                  ? "border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400"
                  : "border-neutral-800 bg-neutral-950 hover:border-blue-600 text-neutral-300 hover:text-blue-500",
                theme === 'ethereal' ? "rounded-[1.5rem]" : "rounded-lg"
              )}
            >
              <UploadCloud size={24} className="flex-shrink-0" />
              <div className="text-left">
                <div className="font-medium text-inherit">Importar Backup</div>
                <div className="text-xs opacity-70">Carregar arquivo .zip.</div>
              </div>
              <input 
                type="file" 
                accept=".zip" 
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const parsed = await parseBackupFile(file);
                    setParsedImportData(parsed);
                    setIsImportModalOpen(true);
                  } catch (err) {
                    console.error(err);
                    alert("Arquivo zip inválido ou corrompido.");
                  }
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        </div>

        <div className="p-6 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className={clsx(
              "px-6 py-2 font-medium transition-all",
              theme === 'ethereal' 
                ? "bg-white/10 hover:bg-white/20 text-white rounded-full" 
                : "bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            )}
          >
            Pronto
          </button>
        </div>
      </div>
      <ExportModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        activeLayers={activeLayers}
        currentProjectId={currentProjectId}
        currentPageId={currentPageId}
      />
      <ImportConflictModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        parsedData={parsedImportData}
        onSuccess={() => {
          setIsImportModalOpen(false);
          alert('Importação concluída com sucesso! A página será recarregada.');
          window.location.reload();
        }}
      />
    </div>
  );
};
