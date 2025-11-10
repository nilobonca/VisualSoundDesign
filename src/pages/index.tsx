import AudioPlayer from "@/components/player";
import AudioUploader from "@/components/dbindex";
import HeaderCab from "@/components/header";
import { ChangeEvent, useCallback, useEffect, useId, useState } from "react";
import GButton from "@/components/ButtonGeneric";
import { useIDB } from '@/utils/indexedDB';
import { useLogSystem } from '@/utils/logSystem';

import { Stage } from 'konva';

interface PlayerInterface {
  id: string
  audio: File
  position: {
    x: number
    y: number
  }
}

export default function Home() {
  const { findaudio,
    deleteAudio,
    deleteAll,
    isLoading,
    savedAudios,
    saveAudio,
    activePlayers,
    findPlayer,
    addPlayerPersisted,
    updatePlayerPersisted,
    setMessage,
    handleSetActivePlayers,
    setActiveAudios,
    
  } = useIDB();

  const {
    lastLog,
    updateDragLog,
    getLastLog
  } = useLogSystem()


  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleDragStart = (e: any, audio: any) => {
    e.dataTransfer.setData('audioId', audio.id);
    return ('');
  };

  const handleDragOver = (e: Event) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);

    const audioId = parseInt(e.dataTransfer.getData('audioId'), 10);
    const audioToPlay = savedAudios.find(a => a.id === audioId);

    var playerInterface = {
      id: crypto.randomUUID(),
      audio: audioToPlay,
      position: {
        x: 0,
        y: 0
      }
    }
    playerInterface.position = {
      x: e.pageX,
      y: e.pageY
    }
    if (audioToPlay) {
      updateDragLog()
      handleSetActivePlayers(playerInterface);
      console.log(activePlayers)
      setActiveAudios(prevAudios => [...prevAudios, audioId]);
    }
  };

  const changePositionPlayer = (player: PlayerInterface, position: {x: number, y: number}) => {
    if(position.x == 0 && position.y == 0) return

    const foundPlayer = activePlayers.find(p => p.id === player.id)

    foundPlayer.position.x = position.x
    foundPlayer.position.y = position.y

    
    console.log(player)
    if (findPlayer(foundPlayer.id) !== null) {
      updatePlayerPersisted(foundPlayer)
    }
    else {
      addPlayerPersisted(foundPlayer)
    }

  }

  const handleFileChange = (event: ChangeEvent) => {
    const file = event.target?.files[0];
    if (file && file.type.startsWith('audio/')) {
      saveAudio(file);
    } else {
      setMessage('Por favor, selecione um arquivo de áudio válido.');
    }
  };

  const removePlayer = (id) => {
    const arrayHolder = []
    activePlayers.map((p) => {
      if (p.id !== id) {
        arrayHolder.push(p)
      }
    })
    setActivePlayers(arrayHolder);
  };

 

  const deletePlayer = (id) => {
    removePlayer(id);
  }

 

  

  useEffect(() => {

    document.addEventListener('wheel', function (event) {
      if (event.ctrlKey) {
        event.preventDefault();
      }
    }, { passive: false });

    document.addEventListener('keydown', (event) => {
      const isCtrlPressed = event.ctrlKey || event.metaKey;
      const isZoomKey = event.key === '+' || event.key === '=' || event.key === '-';
      if (isCtrlPressed && isZoomKey) {
        event.preventDefault();
      }
    });

  }, []);

  return (
    
    <div className="flex bg-gray-200 h-screen w-screen" onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
      
      <HeaderCab
        HandleDragStart={handleDragStart}
        HandleFileChange={handleFileChange}
        IsLoading={isLoading}
        SetMessage={setMessage}
        SavedAudios={savedAudios}
        DeleteAudio={deleteAudio}
      />
      <GButton Func={deleteAll} />
      {activePlayers.map((player : any) => (
        <AudioPlayer key={player.id} Player={player} ChangePositionPlayer={changePositionPlayer} DeletePlayer={removePlayer} />
      ))
      }
      <div className="absolute h-screen w-screen -z-10"
      >
      </div>
    </div>
  );
}