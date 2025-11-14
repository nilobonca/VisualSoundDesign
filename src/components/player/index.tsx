import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ForwardIcon,
  PlayIcon,
  RewindIcon,
  GripHorizontal,
  PauseIcon,
  Repeat,
  Grip
} from "lucide-react";



interface AudioPlayerProps { Player: Player, DeletePlayer: Function, ChangePositionPlayer: Function };


interface Track {
  title: string;
  artist: string;
  src: string;
  url: string;
  name: string;
}

interface Player {
  id: number
  audio: Track
  position: Object
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ DeletePlayer, Player, ChangePositionPlayer } : any) => {

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const draggingHandleRef = useRef<any>(null);
  const progressBarRef = useRef(null);

  const [isReady, setIsReady] = useState(true);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [loop, setLooping] = useState<boolean>(false);
  const [isCustomLooping, setCustomLoop] = useState<boolean>(false);


  const loopStartTimeRef = useRef(0);
  const loopEndTimeRef = useRef(0);

  const [loopUi, setLoopUi] = useState({ start: 0, end: 0 });

  const formatTime = (seconds : number) => {
    if (isNaN(seconds)) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };


  const updateLoopRangeVisual = useCallback(() => {
    setLoopUi({ start: loopStartTimeRef.current, end: loopEndTimeRef.current });
  }, []);

  const handleDragMove = useCallback((e : any) => {
    if (draggingHandleRef.current === null) return;
    e.preventDefault();
    const holdrect : any = progressBarRef.current
    const rect = holdrect?.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let positionX = clientX - rect.left;
    let percent = (positionX / rect.width) * 100;
    percent = Math.max(0, Math.min(100, percent));

    const newTime = (percent / 100) * duration;

    if (draggingHandleRef.current === 'start') {
      loopStartTimeRef.current = Math.min(newTime, loopEndTimeRef.current);
    } else {
      loopEndTimeRef.current = Math.max(newTime, loopStartTimeRef.current);
    }
    updateLoopRangeVisual();
  }, [duration, updateLoopRangeVisual]);

  const handleDragEnd = useCallback(() => {
    draggingHandleRef.current = null;
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('touchmove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchend', handleDragEnd);

    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('touchmove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchend', handleDragEnd);
    };
  }, [handleDragMove, handleDragEnd]);

  const progressPercent = (currentTime / duration) * 100 || 0;
  const startHandlePercent = (loopUi.start / duration) * 100 || 0;
  const endHandlePercent = (loopUi.end / duration) * 100 || 0;

  const handlePlayPause = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    const holdaudiorec : any = audioRef.current
    const current = holdaudiorec.currentTime;
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setProgress(
        (audioRef.current.currentTime / audioRef.current.duration) * 100
      );
    }
    if (isCustomLooping && (current >= loopEndTimeRef.current || current < loopStartTimeRef.current)) {
      holdaudiorec.currentTime = loopStartTimeRef.current;
    }

  };

  const handleProgressClick = (event : any) => {
    if (!isReady || event.target.classList.contains('loop-handle')) return;
    const holdrect : any = progressBarRef.current
    const rect = holdrect.getBoundingClientRect();
    const clickPositionX = event.clientX - rect.left;
    const seekTime = (clickPositionX / rect.width) * duration;
    const holdaudiorec : any = audioRef.current
    holdaudiorec.currentTime = seekTime;
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {

      setDuration(audioRef.current.duration);
      setLoopUi({ start: 0, end: audioRef.current.duration });
    }
  };


  //   const formatTime = (time: number) => {
  //     const minutes = Math.floor(time / 60);
  //     const seconds = Math.floor(time % 60);
  //     return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  //   };


  const changeLoop = () => {
    console.log("true")
    if (loop) {
      setLooping(false);
      console.log("false");
    } else {
      setLooping(true);
      console.log("true");
    }
  }

  const loopActivated = () => {
    if (loop) {
      console.log("true")
      setCurrentTime(0);
      setProgress(0);
      const holdaudiorec : any = audioRef.current
      holdaudiorec.play();
    }
    else {
      setCurrentTime(0);
      setProgress(0);
    }
  }


  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  }, [currentTrackIndex, isPlaying]);

  useEffect(() => {
    const holdaudiorec : any = audioRef.current
    holdaudiorec.pause();
    holdaudiorec.src = Player?.audio?.url || "";
    holdaudiorec.load();
    holdaudiorec.currentTime = 0;
    setCurrentTime(0);
    setProgress(0);
    setLoopUi({ start: 0, end: holdaudiorec.duration });
  }, []);


  const draggableRef = useRef(null);
  const isDraggingRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
   setPosition(
    { x: Player.position.x, y: Player.position.y }
   )
  }, []);
 
  useEffect(() => {
  }, [position]);

  const onDragStart = useCallback((e : any) => {
    if (e.type === 'touchstart') e.preventDefault();

    const header = e.currentTarget;
    if (draggableRef.current && header.contains(e.target)) {
      isDraggingRef.current = true;

      const clientX = e.clientX || e.touches[0].clientX;
      const clientY = e.clientY || e.touches[0].clientY;

      const holdrect : any = draggableRef.current
      const rect = holdrect.getBoundingClientRect();

      offsetRef.current = {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    }
  }, []);

  const onDragMove = useCallback((e : any) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();

    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;

    setPosition({
      x: clientX - 55,
      y: clientY - 38,
    });
    const positionHolder = {
      x: clientX - 55,
      y: clientY - 38,
    }
    
  }, []);
  
  const onDragEnd = useCallback(() => {
    isDraggingRef.current = false;
    console.log(Player)
    console.log(position)
    ChangePositionPlayer(Player, position)
  }, [position]);

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
    <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground drop-shadow-violet-50 drop-shadow-xl">
      <div className="max-w-md w-full space-y-4">
        <div className="flex items-center justify-between">
        </div>
        <Card
          className="absolute"
          ref={draggableRef} style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            touchAction: 'none'
          }}

          key={Player?.audio.id}
        >
          <div className="flex">

            <div onMouseDown={onDragStart} onMouseUp={onDragEnd} onTouchStart={onDragStart} className="flex ">
              <GripHorizontal />
            </div>
            <button className="self-end right-0 top-1 cursor-pointer" onClick={() => DeletePlayer(Player.id)}>X</button>
          </div>


          <CardContent className="flex  items-center justify-center gap-8 ">
            <div className="">

              <div className="text-center">
                <h2 className="text-xl font-bold">
                  {Player?.audio.name || "Audio Title"}
                </h2>
                <p className="text-muted-foreground">
                  {Player?.id || "Person Name"}
                </p>
              </div>
              <div className="w-full">
                <div
                  ref={progressBarRef}
                  onClick={handleProgressClick}
                  className="bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 cursor-pointer relative group"
                >
                  {/* Highlight do Range do Loop */}
                  <div
                    id="loop-range"
                    className={`absolute h-full z-10 pointer-events-none rounded-full ${isCustomLooping ? 'bg-blue-500/50' : 'bg-blue-500/30'}`}
                    style={{ left: `${startHandlePercent}%`, width: `${endHandlePercent - startHandlePercent}%` }}
                  />
                  {/* Progresso da música */}
                  <div
                    className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full relative group-hover:bg-green-500"
                    style={{ width: `${progressPercent}%` }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 bg-white dark:bg-gray-300 rounded-full absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 shadow-lg" />
                  </div>
                  {/* Seletores de Loop */}
                  <div
                    id="start-handle"
                    onMouseDown={() => {
                      draggingHandleRef.current = 'start'}}
                    onTouchStart={() => {
                      let holdrect : any = draggingHandleRef.current = 'start'}}
                    className="loop-handle"
                    style={{ left: `${startHandlePercent}%` }}
                  >
                    <div className="loop-handle-line" />
                  </div>
                  <div
                    id="end-handle"
                    onMouseDown={() => {
                      draggingHandleRef.current = 'end'}}
                    onTouchStart={() => {
                      draggingHandleRef.current = 'end'}}
                    className="loop-handle"
                    style={{ left: `${endHandlePercent}%` }}
                  >
                    <div className="loop-handle-line" />
                  </div>
                </div>

                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                {isReady ? `Loop: ${formatTime(loopUi.start)} - ${formatTime(loopUi.end)}` : ''}

              </div>
              <div className="flex items-center gap-4">

                <Button variant="ghost" size="icon" onClick={handlePlayPause}>
                  {isPlaying ? (
                    <PauseIcon className="w-6 h-6" />
                  ) : (
                    <PlayIcon className="w-6 h-6" />
                  )}
                </Button>

                <div className="">
                  <button onClick={() => setCustomLoop(!isCustomLooping)} disabled={!isReady}>
                    <i className={`fas fa-sync-alt ${isCustomLooping ? 'animate-spin' : ''}`}></i>
                    {isCustomLooping ? <Repeat color="#4fb57b" /> : <Repeat className="w-6 h-6" />}
                  </button>
                </div>

              </div>
              <audio
                ref={audioRef}
                src={Player?.audio.url}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={loopActivated}
              />
            </div>

          </CardContent>

        </Card>
      </div>
      <style >{`
                .loop-handle {
                    position: absolute;
                    top: -6px;
                    width: 12px;
                    height: 28px;
                    background-color: rgba(255, 255, 255, 0.8);
                    border: 2px solid #4A90E2;
                    border-radius: 4px;
                    cursor: ew-resize;
                    transform: translateX(-50%);
                    z-index: 20;
                    box-shadow: 0px 0px 5px rgba(0,0,0,0.3);
                }
                .loop-handle-line {
                    width: 2px;
                    height: 12px;
                    background-color: #4A90E2;
                    margin: 0 auto;
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                }
            `}</style>
    </div>
  );
};

export default AudioPlayer;