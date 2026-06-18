import React, { useState } from 'react';
import { Users, X, Check } from 'lucide-react';

interface ProjectSessionUIProps {
  isSessionActive: boolean;
  setIsSessionActive: (active: boolean) => void;
  showInviteModal: boolean;
  setShowInviteModal: (show: boolean) => void;
  listenersOpen: boolean;
  setListenersOpen: (open: boolean) => void;
  sessionListeners: any[];
  projectId: string;
}

export function ProjectSessionUI({
  isSessionActive,
  setIsSessionActive,
  showInviteModal,
  setShowInviteModal,
  listenersOpen,
  setListenersOpen,
  sessionListeners,
  projectId
}: ProjectSessionUIProps) {
  const [copied, setCopied] = useState(false);

  return (
    <>
      {/* Session/Invite Bar (Desktop) */}
      <div className="hidden md:flex fixed top-4 right-4 z-50 items-center gap-2 bg-white/90 dark:bg-neutral-900/90 px-3 py-2 rounded shadow-md backdrop-blur-sm border border-gray-200 dark:border-neutral-700 select-none pointer-events-auto">
        {isSessionActive && (
          <div className="flex items-center gap-1.5 mr-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
            </span>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Ao Vivo</span>
          </div>
        )}
        
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors cursor-pointer shadow-sm shadow-indigo-500/10"
        >
          <Users size={14} />
          Convidar
        </button>

        {isSessionActive && (
          <>
            <div className="h-4 w-px bg-gray-300 dark:bg-neutral-700 mx-1"></div>
            <button
              onClick={() => setListenersOpen(!listenersOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                listenersOpen 
                  ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200' 
                  : 'bg-transparent text-gray-600 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Users size={14} />
              Ouvintes ({sessionListeners.length})
            </button>
          </>
        )}
      </div>

      {/* Invite Modal Overlay */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
          <div className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="text-indigo-500" size={20} />
                  Sessão Compartilhada
                </h3>
                <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                  Convide ouvintes para escutar seus áudios espaciais em tempo real.
                </p>
              </div>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-neutral-200 p-1 rounded transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6 my-4">
              {/* Session Status Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-neutral-800/40 rounded-lg border border-gray-100 dark:border-neutral-800">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500 block">Status da Sessão</span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-neutral-200 mt-1 block">
                    {isSessionActive ? 'Sessão Ativa' : 'Sessão Inativa'}
                  </span>
                </div>
                <button
                  onClick={() => setIsSessionActive(!isSessionActive)}
                  className={`px-4 py-1.5 text-xs font-bold rounded transition-colors cursor-pointer ${
                    isSessionActive
                      ? 'bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-500'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/10'
                  }`}
                >
                  {isSessionActive ? 'Desativar' : 'Ativar Sessão'}
                </button>
              </div>

              {/* Invite Link Details */}
              {isSessionActive ? (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-neutral-500">Link de Convite</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={typeof window !== 'undefined' ? `${window.location.origin}/project/${projectId}/session` : ''}
                      className="flex-1 bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm font-mono text-gray-700 dark:text-neutral-300 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          const textToCopy = `${window.location.origin}/project/${projectId}/session`;
                          if (navigator.clipboard && window.isSecureContext) {
                              navigator.clipboard.writeText(textToCopy);
                          } else {
                              const textArea = document.createElement("textarea");
                              textArea.value = textToCopy;
                              textArea.style.position = "fixed";
                              textArea.style.left = "-999999px";
                              textArea.style.top = "-999999px";
                              document.body.appendChild(textArea);
                              textArea.focus();
                              textArea.select();
                              try {
                                  document.execCommand('copy');
                              } catch (err) {
                                  console.error('Fallback copy failed', err);
                              }
                              textArea.remove();
                          }
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 min-w-[80px]"
                    >
                      {copied ? (
                        <>
                          <Check size={14} />
                          Copiado
                        </>
                      ) : (
                        'Copiar'
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-neutral-400 leading-normal">
                    Compartilhe este link com as pessoas. Ao entrar, elas aparecerão no seu canvas como pins e ouvirão os sons da cena.
                  </p>
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-gray-200 dark:border-neutral-800 rounded-lg text-xs text-gray-500 dark:text-neutral-500 font-medium">
                  Ative a sessão acima para gerar o link de convite.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-neutral-800 mt-4">
              <button
                onClick={() => setShowInviteModal(false)}
                className="bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-800 dark:text-neutral-200 px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Listeners Dropdown */}
      {listenersOpen && isSessionActive && (
        <div className="fixed top-16 right-4 z-50 w-64 bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-lg shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-gray-50 dark:bg-neutral-800/50 px-3 py-2 border-b border-gray-200 dark:border-neutral-800 flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-700 dark:text-neutral-300">Ouvintes Conectados</span>
            <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {sessionListeners.length}
            </span>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {sessionListeners.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-500 dark:text-neutral-500">
                Nenhum ouvinte na sessão no momento.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-neutral-800/50">
                {sessionListeners.map(listener => (
                  <li key={listener.listenerId} className="px-3 py-2.5 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
                      <Users size={12} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-neutral-200 truncate">
                        {listener.name || 'Convidado'}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-neutral-500 truncate">
                        ID: {listener.listenerId.substring(0, 8)}...
                      </p>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)]"></div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
