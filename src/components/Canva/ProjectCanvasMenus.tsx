import React from 'react';
import { useRouter } from 'next/router';
import { 
  Layers, Edit2, ArrowLeft, MapPin, History, Music, LayoutGrid, PenTool, MousePointer2
} from 'lucide-react';
import { useCanvasUI } from '@/hooks/useCanvasUI';
import ListenersMenu from '@/components/ListenersMenu';
import HeaderCab from '@/components/header';
import Soundboard from '@/components/Soundboard';
import ActivePlayersMenu from '@/components/ActivePlayersMenu';
import HistoryMenu from '@/components/HistoryMenu';
import LayerManager from '@/components/LayerManager';
import { PinManager } from '@/components/PinManager';
import { ActiveArea, ActiveImage, ActivePin, Audios, Layer, Players, SoundboardItem } from '@/interfaces/utils/indexedDB';

interface ProjectCanvasMenusProps {
  tool?: string;
  setTool?: (tool: any) => void;
  activeLayers: Layer[];

  tempName: string;
  setTempName: (s: string) => void;
  // NOTE: handleSaveName was passed as handleNameSave in the previous fix! 
  // Let me just add handleSaveName because that's what [id].tsx exports. Wait, the old code had handleNameSave inside ProjectCanvasMenus Props.

  isEditingName: boolean;
  setIsEditingName: (b: boolean) => void;
  projectName: string;
  setProjectName: (s: string) => void;
  handleSaveName: () => void;
  clearConfirmation: any;
  setClearConfirmation: (c: any) => void;
  confirmClear: () => void;

  // Required props for menus
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  projectId: string | string[] | undefined;
  
  // Layer Manager
  handleLayerAction: (layer: Layer) => void;
  addToHistory: (actionInfo: any) => void;
  handleExport: () => void;
  handleImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleClearRequest: (e: React.MouseEvent, pageId?: string) => void;
  
  // Pin Manager
  activePins: ActivePin[];
  updatePinPersisted: (pin: ActivePin) => void;
  deletePinPersisted: (id: string) => void;

  // History
  history: any[];
  future: any[];
  handleUndo: () => void;
  handleRedo: () => void;
  handleRestoreHistory: (state: any, index: number, type: 'history' | 'future') => void;

  // Listeners
  isSessionActive: boolean;
  sessionListeners: Array<{ listenerId: string, name: string, status?: string }>;
  listenerPings: Record<string, number>;
  handleLocateListener: (listenerId: string) => void;
  handleKickListener: (listenerId: string) => void;

  // HeaderCab (Assets)
  handleDragStart: (e: React.DragEvent, item: any, type: 'image' | 'audio') => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>, isImage?: boolean) => void;
  isLoading: boolean;
  setMessage: (msg: string) => void;
  savedAudios: Audios[];
  deleteAudio: (id: number) => void;
  activeAudioIds: Set<number>;
  proximityVolumes: Map<number, number>;
  highlightedAudioId: number | null;
  setContextMenu: (menu: any) => void;

  // Soundboard
  editingSoundboardItemId: string | null;
  handleRenameSoundboardItem: (id: string, newName: string) => void;

  // Active Players
  activePlayers: Players[];
  activeAreas: ActiveArea[];
  activeAreaIds: Set<string>;
  spatialPans: Map<number, number>;
  audioFilters: Map<number, 'none' | 'lowpass' | 'wall' | 'telephone'>;
  deletePlayer: (id: string) => void;
  deleteArea: (id: string) => void;
  handleUpdateArea: (area: ActiveArea) => void;
}

export const ProjectCanvasMenus: React.FC<ProjectCanvasMenusProps> = ({
  activeLayers,
  tempName, setTempName,
  isEditingName, setIsEditingName, projectName, setProjectName, handleSaveName, clearConfirmation, setClearConfirmation, confirmClear,
  activeProjectId, setActiveProjectId, projectId,
  handleLayerAction, addToHistory, handleExport, handleImport, handleClearRequest,
  activePins, updatePinPersisted, deletePinPersisted,
  history, future, handleUndo, handleRedo, handleRestoreHistory,
  isSessionActive, sessionListeners, listenerPings, handleLocateListener, handleKickListener,
  handleDragStart, handleFileChange, isLoading, setMessage, savedAudios, deleteAudio, activeAudioIds, proximityVolumes, highlightedAudioId, setContextMenu,
  editingSoundboardItemId, handleRenameSoundboardItem,
  activePlayers, activeAreas, activeAreaIds, spatialPans, audioFilters, deletePlayer, deleteArea, handleUpdateArea,
  tool, setTool
}) => {
  const router = useRouter();
  
  const {
    layerManagerOpen, setLayerManagerOpen,
    pinManagerOpen, setPinManagerOpen,
    historyOpen, setHistoryOpen,
    activePlayersOpen, setActivePlayersOpen,
    soundboardOpen, setSoundboardOpen,
    headerOpen, setHeaderOpen,
    listenersOpen, setListenersOpen,
    mobileMenuOpen, setMobileMenuOpen,
    menuZIndices, bringToFront
  } = useCanvasUI(projectId);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-white p-3 rounded-lg shadow-lg hover:bg-gray-50 transition-colors"
        aria-label="Menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {mobileMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Project Name (Editable) - Desktop Only for now to avoid mobile overlap */}
      <div className="hidden md:flex fixed top-4 left-4 z-50 items-center gap-2 bg-white/90 dark:bg-neutral-900/90 px-3 py-2 rounded shadow-md backdrop-blur-sm border border-gray-200 dark:border-neutral-700">
        <button onClick={() => router.push('/')} className="hover:bg-gray-100 dark:hover:bg-neutral-800 p-1 rounded transition-colors text-gray-600 dark:text-neutral-400" title="Voltar para Dashboard">
          <ArrowLeft size={18} />
        </button>
        <div className="h-4 w-px bg-gray-300 dark:bg-neutral-700 mx-1"></div>
        {isEditingName ? (
          <div className="flex flex-col">
            <input
              className="font-bold text-lg bg-transparent border-b-2 border-blue-500 focus:outline-none text-gray-800 dark:text-neutral-200"
              style={{ width: `${Math.max(tempName.length, 1) + 2}ch` }}
              value={tempName}
              onChange={e => setTempName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={e => e.key === 'Enter' && handleSaveName()}
              autoFocus
              maxLength={120}
            />
            <span className="text-[10px] text-gray-400 self-end mt-0.5 font-mono">
              {tempName.length}/120
            </span>
          </div>
        ) : (
          <h1
            onClick={() => {
              // Ensure we get the correct layer using projectId (Metadata)
              const pId = Array.isArray(projectId) ? projectId[0] : projectId;
              const layer = activeLayers.find(l => l.id === pId);
              setTempName(layer?.name || 'Projeto Sem Nome');
              setIsEditingName(true);
            }}
            className="font-bold text-lg text-gray-800 dark:text-neutral-200 cursor-pointer hover:text-blue-600 transition-colors flex items-center gap-2 group select-none"
            title="Clique para renomear"
          >
            {(() => {
              const pId = Array.isArray(projectId) ? projectId[0] : projectId;
              const layer = activeLayers.find(l => l.id === pId);
              return layer?.name || 'Projeto Sem Título';
            })()}
            <Edit2 size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 dark:text-neutral-500" />
          </h1>
        )}

        <div className="h-4 w-px bg-gray-300 dark:bg-neutral-700 mx-1"></div>

        {/* Clear Canvas Button moved to Layer Manager */}
      </div>

      {/* Mobile Overlay */}
      {(layerManagerOpen || pinManagerOpen || mobileMenuOpen) && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => {
            setLayerManagerOpen(false);
            setPinManagerOpen(false);
            setMobileMenuOpen(false);
          }}
        />
      )}

      {/* Layer Manager - Floating */}
      {layerManagerOpen && (
        <div
          className="fixed inset-0 z-50 pointer-events-none"
          style={{ zIndex: menuZIndices.layer }}
          onMouseDown={() => bringToFront('layer')}
        >
          <LayerManager
            onLayerAction={handleLayerAction}
            onInteraction={() => bringToFront('layer')}
            onClose={() => setLayerManagerOpen(false)}
            activeProjectId={activeProjectId}
            onSelectProject={setActiveProjectId}
            projectGroupId={typeof projectId === 'string' ? projectId : null}
            addToHistory={addToHistory}
            onExport={handleExport}
            onImport={handleImport}
            onClearCanvas={handleClearRequest} // Passed for structure menu
          />
        </div>
      )}

      {/* Pin Manager - Floating */}
      {pinManagerOpen && (
        <div
          className="fixed inset-0 z-50 pointer-events-none"
          style={{ zIndex: menuZIndices.pin }}
          onMouseDown={() => bringToFront('pin')}
        >
          <PinManager
            pins={activePins}
            onToggle={(pin) => updatePinPersisted({ ...pin, enabled: !pin.enabled })}
            onRename={(pin, newName) => updatePinPersisted({ ...pin, name: newName })}
            onUpdate={updatePinPersisted}
            onDelete={deletePinPersisted}
            onClose={() => setPinManagerOpen(false)}
          />
        </div>
      )}

      {/* History Menu - Floating */}
      {historyOpen && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 50 }}>
          <HistoryMenu
            history={history}
            future={future}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onClose={() => setHistoryOpen(false)}
            onRestore={handleRestoreHistory}
          />
        </div>
      )}

      {/* Listeners Menu - Floating */}
      {listenersOpen && isSessionActive && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 65 }}>
          <ListenersMenu
            listeners={sessionListeners.map(l => ({ ...l, ping: listenerPings[l.listenerId] ?? null }))}
            onClose={() => setListenersOpen(false)}
            onLocateListener={handleLocateListener}
            onKickListener={handleKickListener}
            onInteraction={() => bringToFront('header')}
          />
        </div>
      )}






      {/* HeaderCab - Floating (Assets) */}
      {headerOpen && (
        <div
          className="hidden md:block absolute inset-0 pointer-events-none"
          style={{ zIndex: menuZIndices.header }}
        >
          <HeaderCab
            HandleDragStart={handleDragStart}
            HandleFileChange={handleFileChange}
            IsLoading={isLoading}
            SetMessage={setMessage}
            SavedAudios={savedAudios}
            DeleteAudio={deleteAudio}
            activeAudioIds={activeAudioIds}
            proximityVolumes={proximityVolumes}
            highlightedAudioId={highlightedAudioId}
            onInteraction={() => bringToFront('header')}
            onClose={() => setHeaderOpen(false)}
            onAssetContextMenu={(e, id, type) => {
              e.preventDefault();
              e.stopPropagation();
              setContextMenu({
                screenX: e.clientX,
                screenY: e.clientY,
                worldX: 0,
                worldY: 0,
                type: type === 'audio' ? 'asset-audio' : 'asset-image',
                itemId: id.toString()
              });
            }}
          />
        </div>
      )}

      {/* Soundboard - Floating */}
      {soundboardOpen && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 50 }}>
          <Soundboard
            onClose={() => setSoundboardOpen(false)}
            onItemContextMenu={(e, itemId) => {
              e.preventDefault();
              e.stopPropagation();
              setContextMenu({
                screenX: e.clientX,
                screenY: e.clientY,
                worldX: 0,
                worldY: 0,
                type: 'soundboard-def',
                itemId: itemId
              });
            }}
            editingItemId={editingSoundboardItemId}
            onRename={handleRenameSoundboardItem}
          />
        </div>
      )}

      {/* Active Players Menu - Floating (Always mounted to persist audio) */}
      <div
        className={`absolute inset-0 pointer-events-none ${activePlayersOpen ? '' : 'invisible'}`}
        style={{ zIndex: 60 }} // High z-index
      >
        <ActivePlayersMenu
          activePlayers={activePlayers}
          activeAreas={activeAreas}
          savedAudios={savedAudios}
          activeAudioIds={activeAudioIds}
          activeAreaIds={activeAreaIds}
          proximityVolumes={proximityVolumes}
          spatialPans={spatialPans}
          audioFilters={audioFilters}
          onClose={() => setActivePlayersOpen(false)}
          onInteraction={() => bringToFront('header')}
          onLocatePlayer={() => {
            // Implement locate logic if needed
          }}
          onDeletePlayer={(id, type) => {
            if (type === 'player') deletePlayer(id);
            else if (type === 'area') deleteArea(id);
          }}
          onUpdateArea={handleUpdateArea}
        />
      </div>



      {/* Desktop Dock Bar - Bottom Left */}
      <div className="hidden md:flex fixed left-4 bottom-4 z-50 flex-col gap-2">
        {/* Layer Manager Toggle */}
        {!layerManagerOpen && (
          <button
            onClick={() => setLayerManagerOpen(true)}
            className="bg-white dark:bg-neutral-800 p-3 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all duration-200 hover:scale-105 border border-gray-200 dark:border-neutral-700"
            title="Abrir Camadas"
          >
            <Layers size={20} className="text-gray-700 dark:text-neutral-200" />
          </button>
        )}

        {/* Pin Manager Toggle */}
        {!pinManagerOpen && (
          <button
            onClick={() => setPinManagerOpen(true)}
            className="bg-white dark:bg-neutral-800 p-3 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all duration-200 hover:scale-105 border border-gray-200 dark:border-neutral-700"
            title="Abrir Pins"
          >
            <MapPin size={20} className="text-gray-700 dark:text-neutral-200" />
          </button>
        )}

        {/* History Toggle */}
        {!historyOpen && (
          <button
            onClick={() => setHistoryOpen(true)}
            className="bg-white dark:bg-neutral-800 p-3 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all duration-200 hover:scale-105 border border-gray-200 dark:border-neutral-700"
            title="Abrir Histórico"
          >
            <History size={20} className="text-gray-700 dark:text-neutral-200" />
          </button>
        )}

        {/* Soundboard Toggle */}
        {!soundboardOpen && (
          <button
            onClick={() => setSoundboardOpen(true)}
            className="bg-white dark:bg-neutral-800 p-3 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all duration-200 hover:scale-105 border border-gray-200 dark:border-neutral-700"
            title="Abrir Soundboard"
          >
            <Music size={20} className="text-gray-700 dark:text-neutral-200" />
          </button>
        )}

        {/* Active Players Toggle */}
        {!activePlayersOpen && (
          <button
            onClick={() => setActivePlayersOpen(true)}
            className="bg-white dark:bg-neutral-800 p-3 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all duration-200 hover:scale-105 border border-gray-200 dark:border-neutral-700"
            title="Abrir Players Ativos"
          >
            {/* Using Volume2 icon for Active Players */}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700 dark:text-neutral-200"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M 15.54 8.46 a 5 5 0 0 1 0 7.07"></path><path d="M 19.07 4.93 a 10 10 0 0 1 0 14.14"></path></svg>
          </button>
        )}

        {/* Header/Assets Toggle */}
        {!headerOpen && (
          <button
            onClick={() => setHeaderOpen(true)}
            className="bg-white dark:bg-neutral-800 p-3 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all duration-200 hover:scale-105 border border-gray-200 dark:border-neutral-700"
            title="Abrir Assets"
          >
            <LayoutGrid size={20} className="text-gray-700 dark:text-neutral-200" />
          </button>
        )}

      </div>

      {/* Drawing Tools - Floating Center Bottom */}
      {setTool && tool && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 bg-white/90 dark:bg-neutral-900/90 px-3 py-2 rounded-full shadow-lg backdrop-blur-sm border border-gray-200 dark:border-neutral-700">
          <button
            onClick={() => setTool('cursor')}
            className={`p-2 rounded-full transition-colors ${tool === 'cursor' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'hover:bg-gray-100 text-gray-600 dark:text-neutral-400 dark:hover:bg-neutral-800'}`}
            title="Cursor"
          >
            <MousePointer2 size={20} />
          </button>
          <div className="h-6 w-px bg-gray-300 dark:bg-neutral-700"></div>
          <button
            onClick={() => setTool(tool === 'wall' ? 'cursor' : 'wall')}
            className={`p-2 rounded-full transition-colors ${tool === 'wall' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'hover:bg-gray-100 text-gray-600 dark:text-neutral-400 dark:hover:bg-neutral-800'}`}
            title="Desenhar Parede (Barreira de Som)"
          >
            <PenTool size={20} />
          </button>
        </div>
      )}

      
    </>
  );
};
