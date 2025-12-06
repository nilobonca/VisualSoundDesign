import React, { ChangeEvent, DragEvent } from "react";
import { GripHorizontal, SquareX, Music, Image as ImageIcon, X } from 'lucide-react';
import { useLogSystem } from "@/utils/logSystem";
import { useIDB } from "@/utils/indexedDB";
import GButton from "../ButtonGeneric";
import { Audios, Images } from "@/interfaces/utils/indexedDB";

import { motion, useDragControls, Reorder } from "framer-motion";
import { useViewportResize } from "@/hooks/useViewportResize";
import { ThemeToggle } from "../ThemeToggle";

const DragHandleIcon = () => (
  <div>
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-500">
      <circle cx="9" cy="12" r="1"></circle>
      <circle cx="9" cy="5" r="1"></circle>
      <circle cx="9" cy="19" r="1"></circle>
      <circle cx="15" cy="12" r="1"></circle>
      <circle cx="15" cy="5" r="1"></circle>
      <circle cx="15" cy="19" r="1"></circle>
    </svg>
  </div>
)

interface HeaderProps {
  HandleDragStart: (e: DragEvent, item: Audios | Images, type: 'audio' | 'image') => void;
  HandleFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  IsLoading: boolean;
  SetMessage: (msg: string) => void;
  SavedAudios: Audios[];
  DeleteAudio: (id: number) => void;
  activeAudioIds?: Set<number>;
  proximityVolumes?: Map<number, number>;
  highlightedAudioId?: number | null;
  onInteraction?: () => void;
  onClose?: () => void;
}

const HeaderCab: React.FC<HeaderProps> = ({
  HandleDragStart,
  HandleFileChange,
  SavedAudios,
  DeleteAudio,
  activeAudioIds = new Set(), // eslint-disable-line @typescript-eslint/no-unused-vars
  onInteraction,
  onClose
}) => {

  const dragControls = useDragControls();

  const {
    usageLog,
    deleteAll,
    saveImage,
    savedImages,
    deleteImage,

    reorderAudios,
    reorderImages
  } = useIDB()

  const {
    lastLog,
  } = useLogSystem()

  /*
  // Unused function
  const handleDuplicateAudio = async (audio: Audios) => {
    const copiedAudio = await saveAudio(audio.file);
    if (copiedAudio) {
      console.log('Áudio duplicado:', copiedAudio);
    }
  };
  */

  const holderFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    HandleFileChange(e)
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      saveImage(e.target.files[0]);
    }
  }

  const { size, position } = useViewportResize({
    initialSize: { width: 300, height: 500 },
    initialPosition: { x: 10, y: 10 },
    minWidth: 240,
    minHeight: 400
  });



  const renderContent = () => (
    <div className="flex-1 overflow-y-auto min-h-0">
      <div className="dark:text-neutral-300">Espaço sendo usado: {usageLog}</div>

      <div className="flex gap-2 mb-4 mt-2">
        <label htmlFor={"audio-input"} id="drop-zone" className="w-20 h-20 relative block border-2  border-slate-300 dark:border-neutral-700 rounded-xl text-center cursor-pointer transition-all duration-300 ease-in-out hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-neutral-800">
          <div className="flex flex-col items-center justify-center h-full">
            <Music className="" color="#4366a7ff" />
            <span className="text-[10px] text-gray-500 dark:text-neutral-400">Audio</span>
          </div>
          <input onChange={holderFileChange} id={"audio-input"} accept="audio/*" type="file" className="hidden" multiple />
        </label>

        <label htmlFor={"image-input"} id="drop-zone-image" className="w-20 h-20 relative block border-2  border-slate-300 dark:border-neutral-700 rounded-xl text-center cursor-pointer transition-all duration-300 ease-in-out hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-neutral-800">
          <div className="flex flex-col items-center justify-center h-full">
            <ImageIcon className="" color="#4366a7ff" />
            <span className="text-[10px] text-gray-500 dark:text-neutral-400">Image</span>
          </div>
          <input onChange={handleImageChange} id={"image-input"} accept="image/*" type="file" className="hidden" />
        </label>
      </div>

      <div className="bg-gray-100 dark:bg-neutral-800 w-full rounded flex flex-col min-h-0">
        {(SavedAudios?.length > 0 || savedImages?.length > 0) ? (
          <div className="space-y-3 overflow-y-auto pr-2 p-2 flex-1">
            {SavedAudios?.length > 0 && (
              <Reorder.Group axis="y" values={SavedAudios} onReorder={reorderAudios} className="space-y-3" layoutScroll>
                {SavedAudios.map((audio: Audios) => (
                  <Reorder.Item key={audio.id} value={audio} className="cursor-grab active:cursor-grabbing">
                    <div className="p-1 flex items-center gap-4 animate-fade-in bg-white dark:bg-neutral-700 rounded shadow-sm">
                      <div className="flex items-center gap-3 flex-grow min-w-0">
                        <div className="flex items-center gap-3 flex-grow min-w-0" draggable="true" onDragStart={(e) => HandleDragStart(e, audio, 'audio')} >
                          <DragHandleIcon />
                          <Music size={16} className="text-blue-500 flex-shrink-0" />
                          <div className="flex-grow min-w-0" >
                            <p className="text-xs truncate dark:text-neutral-200" title={audio.name}>{audio.name}</p>
                            {audio.createdAt && (
                              <p className="text-[10px] text-gray-400 dark:text-neutral-400">{new Date(audio.createdAt).toLocaleDateString()}</p>
                            )}
                          </div>
                        </div>
                        <SquareX className={"cursor-pointer text-red-400 hover:text-red-600"} size={16} onClick={() => DeleteAudio(audio.id)} />
                      </div>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            )}

            {savedImages?.length > 0 && (
              <Reorder.Group axis="y" values={savedImages} onReorder={reorderImages} className="space-y-3" layoutScroll>
                {savedImages.map((image: Images) => (
                  <Reorder.Item key={image.id} value={image} className="cursor-grab active:cursor-grabbing">
                    <div
                      className="p-1 flex items-center gap-4 animate-fade-in bg-white dark:bg-neutral-700 rounded shadow-sm"
                    >
                      <div className="flex items-center gap-3 flex-grow min-w-0">
                        <div className="flex items-center gap-3 flex-grow min-w-0" draggable="true" onDragStart={(e) => HandleDragStart(e, image, 'image')} >
                          <DragHandleIcon />
                          <ImageIcon size={16} className="text-green-500 flex-shrink-0" />
                          <div className="flex-grow min-w-0" >
                            <p className="text-xs truncate dark:text-neutral-200" title={image.name}>{image.name}</p>
                            <p className="text-[10px] text-gray-400 dark:text-neutral-400">{new Date(image.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <SquareX className={"cursor-pointer text-red-400 hover:text-red-600"} size={16} onClick={() => deleteImage(image.id)} />
                      </div>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            )}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-8 space-y-3 pr-2">Sua biblioteca está vazia.</p>
        )}
        <GButton Func={deleteAll} Name={"ApagarTudo"} className="max-w-45 max-h-20 m-2 flex-shrink-0" />
      </div>
      <div className="mt-2 text-xs text-gray-500 dark:text-neutral-500">Ultima atualização: {lastLog}</div>
    </div>
  );

  return (
    <motion.div
      layout={false}
      initial={{ x: 10, y: 10 }}
      style={{
        width: size.width,
        height: size.height,
        maxHeight: '80vh',
        x: position.x,
        y: position.y,
      }}
      drag
      dragListener={false}
      dragControls={dragControls}
      dragMomentum={false}
      className={`absolute flex flex-col bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-sm drop-shadow-xl overflow-hidden pointer-events-auto p-5`}
      onPointerDownCapture={onInteraction}
    >
      {/* Expanded View */}
      <div className={`flex flex-col h-full block`}>
        <div
          className="w-full flex justify-between items-center mb-2 relative flex-shrink-0 px-1 touch-none cursor-move"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded text-gray-400 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400"
                onPointerDown={(e) => e.stopPropagation()}
                title="Fechar"
              >
                <X size={16} />
              </button>
            )}
            <GripHorizontal className="text-gray-400" />
          </div>
        </div>

        <div onPointerDown={(e) => e.stopPropagation()} className="flex-1 overflow-y-auto min-h-0">
          {renderContent()}
        </div>

        {/* Resize Handle */}

      </div>
    </motion.div>
  )
}

export default HeaderCab;