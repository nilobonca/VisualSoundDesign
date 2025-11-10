import React, { useState, useRef, useEffect, useCallback, ChangeEvent } from "react";
import { GripHorizontal, SquareX, Upload } from 'lucide-react';
import Assetslist from "../assetslist";
import { useLogSystem } from "@/utils/logSystem";
import { useIDB } from "@/utils/indexedDB";
const DragHandleIcon = () => (
  <div>
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-500">
      <circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle>
      <circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle>
    </svg>
  </div>
)

interface HeaderProps {
  HandleDragStart: Function
  HandleFileChange: Function
  IsLoading: Boolean
  SetMessage: Function
  SavedAudios: any
  DeleteAudio: Function
}


const HeaderCab: React.FC<HeaderProps> = ({ HandleDragStart, HandleFileChange, IsLoading, SetMessage, SavedAudios, DeleteAudio }) => {


  const draggableRef = useRef(null);
  const isDraggingRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 })
  const [position, setPosition] = useState({ x: 10, y: 10 });
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const {
    usageLog
  } = useIDB()

  const {
    lastLog,
  } = useLogSystem()


  const onDragStart = useCallback((e) => {
    if (e.type === 'touchstart') e.preventDefault();


    const header = e.currentTarget;
    if (draggableRef.current && header.contains(e.target)) {
      isDraggingRef.current = true;

      const clientX = e.clientX || e.touches[0].clientX;
      const clientY = e.clientY || e.touches[0].clientY;

      const rect = draggableRef.current.getBoundingClientRect();

      offsetRef.current = {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    }
  }, []);


  const onDragMove = useCallback((e) => {
    if (!isDraggingRef.current) return;

    e.preventDefault();

    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;
    setPosition({
      x: clientX - 55,
      y: clientY - 38,
    });
  }, []);


  const onDragEnd = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const holderFileChange = (e: ChangeEvent) => {
    HandleFileChange(e)
  };

  useEffect(() => {
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);
    window.addEventListener('touchmove', onDragMove, { passive: false });
    window.addEventListener('touchend', onDragEnd);

    return () => {
      window.removeEventListener('mousemove', onDragMove);
      window.removeEventListener('mouseup', onDragEnd);
      window.removeEventListener('touchmove', onDragMove);
      window.removeEventListener('touchend', onDragEnd);
    };
  }, [onDragMove, onDragEnd]);

  useEffect(() => {

    const style = document.createElement('style');

    style.innerHTML = `
                body {
                    -webkit-user-select: none;
                    -moz-user-select: none;
                    -ms-user-select: none;
                    user-select: none;
                }
            `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };

  }, []);



  return (
    <div
      className="absolute  flex max-w-60 min-h-100 bg-white p-5 rounded-sm items-center flex-col justify-center z-10 drop-shadow-xl"
      ref={draggableRef} style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: 'none'
      }}

    >
      <div onMouseDown={onDragStart} onTouchStart={onDragStart} className="flex ">
        <GripHorizontal />
      </div>
      <div>Espaço sendo usado: {usageLog}MB</div>
      <label htmlFor="audio-input" id="drop-zone" className="mb-4 w-45 max-h-20 relative block h-48 border-2  border-slate-300 rounded-xl text-center cursor-pointer transition-all duration-300 ease-in-out hover:border-violet-500 hover:bg-violet-50 ">
        <div className="flex flex-col items-center justify-center h-full">
          <Upload className="" color="#4366a7ff" />
        </div>
        <input onChange={holderFileChange} id="audio-input" accept="audio/*" type="file" className="hidden" multiple />
      </label>


      <div className="bg-gray-100 ">
        {SavedAudios?.length > 0 ? (
          <ul className="space-y-3 h-[60vh] overflow-y-auto pr-2">
            {SavedAudios?.map((audio) => (
              <li
                key={audio.id}
                className="p-1 flex items-center gap-4 cursor-grab active:cursor-grabbing animate-fade-in"
              >
                <div className="flex items-center gap-3 flex-grow min-w-0">
                  <div className="flex items-center gap-3 flex-grow min-w-0" draggable="true" onDragStart={(e) => HandleDragStart(e, audio)} >
                    <DragHandleIcon />
                    <div className="flex-grow min-w-0" >
                      <p className="text-xs truncate" title={audio.name}>{audio.name}</p>
                      <p className="text-xs text-gray-400">Salvo em: {new Date(audio.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <SquareX className={"cursor-pointer"} onClick={() => DeleteAudio(audio.id)} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-400 py-8 space-y-3 h-[60vh] pr-2">Sua biblioteca está vazia.</p>
        )}

      </div>
      <div>Ultima atualização: {lastLog}</div>
      
    </div>)


}

export default HeaderCab;