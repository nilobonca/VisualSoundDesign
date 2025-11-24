import React, { useState, useEffect, ChangeEvent, DragEvent } from "react";
import { GripHorizontal, SquareX, Music, Image as ImageIcon, Minus, Maximize2 } from 'lucide-react';
import { useLogSystem } from "@/utils/logSystem";
import { useIDB } from "@/utils/indexedDB";
import GButton from "../ButtonGeneric";
import { Audios, Images } from "@/interfaces/utils/indexedDB";
import AudioPlayerList from "../player-list";
import { motion, useDragControls, Reorder } from "framer-motion";

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
}

const HeaderCab: React.FC<HeaderProps> = ({
  HandleDragStart,
  HandleFileChange,
  SavedAudios,
  DeleteAudio,
  activeAudioIds = new Set(),
  proximityVolumes = new Map()
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const dragControls = useDragControls();

  const {
    usageLog,
    deleteAll,
    saveImage,
    savedImages,
    deleteImage,
    saveAudio,
    reorderAudios,
    reorderImages
  } = useIDB()

  const {
    lastLog,
  } = useLogSystem()

  const handleDuplicateAudio = async (audio: Audios) => {
    const copiedAudio = await saveAudio(audio.file);
    if (copiedAudio) {
      console.log('Áudio duplicado:', copiedAudio);
    }
  };

  const holderFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    HandleFileChange(e)
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      saveImage(e.target.files[0]);
    }
  }

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragListener={false}
      dragMomentum={false}
      layout
      initial={{ x: 10, y: 10 }}
      className={`absolute z-10 flex flex-col bg-white rounded-sm drop-shadow-xl overflow-hidden ${isCollapsed ? 'w-auto h-auto p-2' : 'max-w-60 min-h-100 p-5'}`}
    >
      {/* Collapsed View */}
      <div
        className={`${isCollapsed ? 'flex' : 'hidden'} cursor-move items-center justify-center`}
        onPointerDown={(e) => dragControls.start(e)}
        title="Expandir Menu"
      >
        <button onClick={() => setIsCollapsed(false)} className="text-gray-700 hover:text-blue-600">
          <Maximize2 size={24} />
        </button>
      </div>

      {/* Expanded View */}
      <div className={isCollapsed ? 'hidden' : 'block'}>
        <div
          className="w-full flex justify-center mb-2 cursor-move relative"
          onPointerDown={(e) => dragControls.start(e)}
          onDoubleClick={() => setIsCollapsed(true)}
        >
          <GripHorizontal className="text-gray-400" />
          <button
            onClick={() => setIsCollapsed(true)}
            className="absolute right-0 top-0 p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Minus size={16} />
          </button>
        </div>

        <div onPointerDown={(e) => e.stopPropagation()}>
          <div>Espaço sendo usado: {usageLog}</div>

          <div className="flex gap-2 mb-4 mt-2">
            <label htmlFor="audio-input" id="drop-zone" className="w-20 h-20 relative block border-2  border-slate-300 rounded-xl text-center cursor-pointer transition-all duration-300 ease-in-out hover:border-violet-500 hover:bg-violet-50 ">
              <div className="flex flex-col items-center justify-center h-full">
                <Music className="" color="#4366a7ff" />
                <span className="text-[10px] text-gray-500">Audio</span>
              </div>
              <input onChange={holderFileChange} id="audio-input" accept="audio/*" type="file" className="hidden" multiple />
            </label>

            <label htmlFor="image-input" id="drop-zone-image" className="w-20 h-20 relative block border-2  border-slate-300 rounded-xl text-center cursor-pointer transition-all duration-300 ease-in-out hover:border-violet-500 hover:bg-violet-50 ">
              <div className="flex flex-col items-center justify-center h-full">
                <ImageIcon className="" color="#4366a7ff" />
                <span className="text-[10px] text-gray-500">Image</span>
              </div>
              <input onChange={handleImageChange} id="image-input" accept="image/*" type="file" className="hidden" />
            </label>
          </div>

          <div className="bg-gray-100 w-full rounded">
            {(SavedAudios?.length > 0 || savedImages?.length > 0) ? (
              <div className="space-y-3 h-[60vh] overflow-y-auto pr-2 p-2">
                {SavedAudios?.length > 0 && (
                  <Reorder.Group axis="y" values={SavedAudios} onReorder={reorderAudios} className="space-y-3">
                    {SavedAudios.map((audio: Audios) => (
                      <Reorder.Item key={audio.id} value={audio} className="cursor-grab active:cursor-grabbing">
                        <div className="animate-fade-in">
                          <AudioPlayerList
                            audio={audio}
                            onDelete={DeleteAudio}
                            onDuplicate={handleDuplicateAudio}
                            forcePlay={activeAudioIds.has(audio.id)}
                            proximityFactor={proximityVolumes.get(audio.id) ?? 1}
                          />
                        </div>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                )}

                {savedImages?.length > 0 && (
                  <Reorder.Group axis="y" values={savedImages} onReorder={reorderImages} className="space-y-3">
                    {savedImages.map((image: Images) => (
                      <Reorder.Item key={image.id} value={image} className="cursor-grab active:cursor-grabbing">
                        <div
                          className="p-1 flex items-center gap-4 animate-fade-in bg-white rounded shadow-sm"
                        >
                          <div className="flex items-center gap-3 flex-grow min-w-0">
                            <div className="flex items-center gap-3 flex-grow min-w-0" draggable="true" onDragStart={(e) => HandleDragStart(e, image, 'image')} >
                              <DragHandleIcon />
                              <ImageIcon size={16} className="text-green-500 flex-shrink-0" />
                              <div className="flex-grow min-w-0" >
                                <p className="text-xs truncate" title={image.name}>{image.name}</p>
                                <p className="text-[10px] text-gray-400">{new Date(image.createdAt).toLocaleDateString()}</p>
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
              <p className="text-center text-gray-400 py-8 space-y-3 h-[60vh] pr-2">Sua biblioteca está vazia.</p>
            )}
            <GButton Func={deleteAll} Name={"ApagarTudo"} className="max-w-45 max-h-20 m-2" />
          </div>
          <div className="mt-2 text-xs text-gray-500">Ultima atualização: {lastLog}</div>
        </div>
      </div>
    </motion.div>
  )
}

export default HeaderCab;