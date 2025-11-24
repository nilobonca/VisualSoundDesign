import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  PlayIcon,
  GripHorizontal,
  PauseIcon,
  Repeat,
  Volume2,
  VolumeX
} from "lucide-react";
import AudioPlayerClosed from "../player-closed";
import { Players } from "@/interfaces/utils/indexedDB";

interface AudioPlayerProps {
  Player: Players,
  DeletePlayer: (id: string) => void,
  ChangePositionPlayer: (player: Players, position: { x: number, y: number }) => void,
  forcePlay?: boolean,
  proximityFactor?: number
};

const AudioPlayer: React.FC<AudioPlayerProps> = ({ DeletePlayer, Player, forcePlay, proximityFactor = 1 }) => {

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const draggingHandleRef = useRef<'start' | 'end' | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isCustomLooping, setCustomLoop] = useState<boolean>(false);
  const [isClosed, setIsClosed] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(1);
  const [lastVolume, setLastVolume] = useState<number>(1);

  const loopStartTimeRef = useRef(0);
  const loopEndTimeRef = useRef(0);

  const [loopUi, setLoopUi] = useState({ start: 0, end: 0 });

  const handleSetIsClosed = () => {
    setIsClosed(!isClosed);
  }

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const updateLoopRangeVisual = useCallback(() => {
    setLoopUi({ start: loopStartTimeRef.current, end: loopEndTimeRef.current });
  }, []);

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (draggingHandleRef.current === null || !progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    let clientX;
    if (window.TouchEvent && e instanceof TouchEvent) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = (e as MouseEvent).clientX;
    }

    const positionX = clientX - rect.left;
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
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('touchmove', handleDragMove, { passive: false });
    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchend', handleDragEnd);

    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [handleDragMove, handleDragEnd]);

  // Handle external forcePlay
  useEffect(() => {
    if (forcePlay !== undefined) {
      setIsPlaying(forcePlay);
      if (forcePlay) {
        audioRef.current?.play();
      } else {
        audioRef.current?.pause();
      }
    }
  }, [forcePlay]);

  // Handle Volume Change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume * proximityFactor;
    }
  }, [volume, proximityFactor]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0) {
      setLastVolume(newVolume);
    }
  };

  const toggleMute = () => {
    if (volume > 0) {
      setVolume(0);
    } else {
      setVolume(lastVolume || 1);
    }
  };

  const progressPercent = (currentTime / duration) * 100 || 0;
  const startHandlePercent = (loopUi.start / duration) * 100 || 0;
  const endHandlePercent = (loopUi.end / duration) * 100;

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
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      setCurrentTime(current);
      setProgress(
        (current / audioRef.current.duration) * 100
      );

      if (isCustomLooping && (current >= loopEndTimeRef.current || current < loopStartTimeRef.current)) {
        audioRef.current.currentTime = loopStartTimeRef.current;
      }
    }
  };

  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).classList.contains('loop-handle') || !progressBarRef.current || !audioRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const clickPositionX = event.clientX - rect.left;
    const seekTime = (clickPositionX / rect.width) * duration;
    audioRef.current.currentTime = seekTime;
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      loopEndTimeRef.current = audioRef.current.duration;
      setLoopUi({ start: 0, end: audioRef.current.duration });
    }
  };

  const loopActivated = () => {
    setCurrentTime(0);
    setProgress(0);
  }

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  }, [currentTrackIndex, isPlaying]);

  useEffect(() => {
    if (audioRef.current && Player?.audio?.url) {
      audioRef.current.pause();
      audioRef.current.src = Player.audio.url;
      audioRef.current.load();
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setProgress(0);
    }
  }, [Player?.audio?.url]);

  return (
    <div className="w-[450px]">
      <Card
        className="relative"
        key={Player?.audio.id}
      >
        <div className="flex">
          <div className="flex ">
            <GripHorizontal />
          </div>
          <button className="self-end right-0 top-1 cursor-pointer" onClick={() => DeletePlayer(Player.id)}>X</button>
          <button className="self-end right-0 top-1 cursor-pointer" onClick={() => handleSetIsClosed()}>V</button>
        </div>

        <AudioPlayerClosed IsClosed={isClosed} Name={Player?.audio.name} HandlePlayPause={handlePlayPause} IsPlaying={isPlaying} />

        <CardContent hidden={isClosed} className="flex  items-center justify-center gap-8 ">
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
                className="bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 cursor-pointer relative group prevent-item-drag"
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
                    draggingHandleRef.current = 'start'
                  }}
                  onTouchStart={() => {
                    draggingHandleRef.current = 'start'
                  }}
                  className="loop-handle prevent-item-drag"
                  style={{ left: `${startHandlePercent}%` }}
                >
                  <div className="loop-handle-line" />
                </div>
                <div
                  id="end-handle"
                  onMouseDown={() => {
                    draggingHandleRef.current = 'end'
                  }}
                  onTouchStart={() => {
                    draggingHandleRef.current = 'end'
                  }}
                  className="loop-handle prevent-item-drag"
                  style={{ left: `${endHandlePercent}%` }}
                >
                  <div className="loop-handle-line" />
                </div>
              </div>

              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              {`Loop: ${formatTime(loopUi.start)} - ${formatTime(loopUi.end)}`}

            </div>
            <div className="flex items-center gap-4 justify-between mt-2">

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={handlePlayPause}>
                  {isPlaying ? (
                    <PauseIcon className="w-6 h-6" />
                  ) : (
                    <PlayIcon className="w-6 h-6" />
                  )}
                </Button>

                <div className="">
                  <button onClick={() => setCustomLoop(!isCustomLooping)}>
                    <i className={`fas fa-sync-alt ${isCustomLooping ? 'animate-spin' : ''}`}></i>
                    {isCustomLooping ? <Repeat color="#4fb57b" /> : <Repeat className="w-6 h-6" />}
                  </button>
                </div>
              </div>

              {/* Volume Control */}
              <div className="flex items-center gap-2 prevent-item-drag">
                <button onClick={toggleMute} className="focus:outline-none">
                  {volume === 0 ? <VolumeX className="w-5 h-5 text-gray-500" /> : <Volume2 className="w-5 h-5 text-gray-700" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

            </div>

          </div>

        </CardContent >

        <audio
          ref={audioRef}
          src={Player?.audio.url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={loopActivated}
        />
      </Card >

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
    </div >
  );
};

export default AudioPlayer;