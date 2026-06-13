import React, { useEffect, useState } from 'react';
import { useThemeStore } from '@/store/themeStore';
import { X, Check } from 'lucide-react';
import clsx from 'clsx';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

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
    </div>
  );
};
