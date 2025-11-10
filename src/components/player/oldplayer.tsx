import React, { useState, useRef, useEffect, useCallback } from "react"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card"; 
import { Progress } from "@/components/ui/progress"; 
import {
  ForwardIcon,
  PlayIcon,
  RewindIcon,
  UploadIcon,
  PauseIcon,
  Repeat
} from "lucide-react"; 



interface AudioPlayerProps {}


interface Track {
  title: string;
  artist: string;
  src: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({Audio}) => {
  const [tracks, setTracks] = useState<Track[]>([]); 
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0); 
  const [isPlaying, setIsPlaying] = useState<boolean>(false); 
  const [progress, setProgress] = useState<number>(0); 
  const [currentTime, setCurrentTime] = useState<number>(0); 
  const [duration, setDuration] = useState<number>(0); 
  const [loop, setLooping] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null); 

  // Function to handle file upload
  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newTracks: Track[] = Array.from(files).map((file) => ({
        title: file.name,
        artist: "Unknown Artist",
        src: URL.createObjectURL(file),
      }));
      setTracks((prevTracks) => [...prevTracks, ...newTracks]);
    }
  };

  // Function to handle play/pause toggle
  const handlePlayPause = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play();
      setIsPlaying(true);
    }
  };

  // Function to handle next track
  const handleNextTrack = () => {
    setCurrentTrackIndex((prevIndex) => (prevIndex + 1) % tracks.length);
  };

  // Function to handle previous track
  const handlePrevTrack = () => {
    setCurrentTrackIndex((prevIndex) =>
      prevIndex === 0 ? tracks.length - 1 : prevIndex - 1
    );
  };

  // Function to handle time update of the track
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setProgress(
        (audioRef.current.currentTime / audioRef.current.duration) * 100
      );
    }
    
  };

  // Function to handle metadata load of the track
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // Function to format time in minutes and seconds
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };


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
        if(loop){
        console.log("true")
        setCurrentTime(0); 
        setProgress(0); 
        audioRef?.current.play();
        }
        else{
            setCurrentTime(0); 
            setProgress(0); 
            handlePlayPause();
        }
  }

  // useEffect to handle track change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = tracks[currentTrackIndex]?.src || "";
      audioRef.current.load();
      audioRef.current.currentTime = 0;
      setCurrentTime(0); // Reset the current time for the new track
      setProgress(0); // Reset the progress for the new track
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  }, [currentTrackIndex, tracks, isPlaying]);
  
  
  //
  ///////////////////////////////////
       // Ref for the main draggable element
    const draggableRef = useRef(null);
    // Ref to track if the element is currently being dragged
    const isDraggingRef = useRef(false);
    // Ref to store the initial mouse position offset
    const offsetRef = useRef({ x: 0, y: 0 });

    // State to hold the position of the div
    // We'll center it initially. In a real app, you might get this from props or calculate it.
    const [position, setPosition] = useState({ x: 0, y: 0 });

    // Set initial position to the center of the viewport
    useEffect(() => {
        if (draggableRef.current) {
            const { offsetWidth, offsetHeight } = draggableRef.current;
            setPosition({
                x: window.innerWidth / 2 - offsetWidth / 2,
                y: window.innerHeight / 2 - offsetHeight / 2,
            });
        }
    }, []);

    // Memoized drag start handler (for mouse and touch)
    const onDragStart = useCallback((e) => {
        // Prevent default behavior for touch events
        if (e.type === 'touchstart') e.preventDefault();

        // Check if the drag is initiated on the header
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

    // Memoized drag move handler
    const onDragMove = useCallback((e) => {
        if (!isDraggingRef.current) return;
        
        // Prevent default to avoid scrolling on touch devices
        e.preventDefault();

        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;

        setPosition({
            x: clientX - offsetRef.current.x,
            y: clientY - offsetRef.current.y,
        });
    }, []);

    // Memoized drag end handler
    const onDragEnd = useCallback(() => {
        isDraggingRef.current = false;
    }, []);

    // Effect to add and remove global event listeners
    useEffect(() => {
        // Add event listeners for both mouse and touch events
        window.addEventListener('mousemove', onDragMove);
        window.addEventListener('mouseup', onDragEnd);
        window.addEventListener('touchmove', onDragMove, { passive: false });
        window.addEventListener('touchend', onDragEnd);
        
        // Cleanup function to remove listeners
        return () => {
            window.removeEventListener('mousemove', onDragMove);
            window.removeEventListener('mouseup', onDragEnd);
            window.removeEventListener('touchmove', onDragMove);
            window.removeEventListener('touchend', onDragEnd);
        };
    }, [onDragMove, onDragEnd]);

    // Effect to add global styles for preventing text selection while dragging
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

        // Cleanup function to remove the style when the component unmounts
        return () => {
            document.head.removeChild(style);
        };
    }, []); // Empty dependency array ensures this runs only once on mount and unmount

  //////////////////////////////////
  //
  

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
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
            onMouseDown={onDragStart}
                onTouchStart={onDragStart}
            >
          <CardContent className="flex  items-center justify-center gap-8 ">
            <div className="">
            
                <div className="text-center">
                <h2 className="text-xl font-bold">
                    {tracks[currentTrackIndex]?.title || "Audio Title"}
                </h2>
                <p className="text-muted-foreground">
                    {tracks[currentTrackIndex]?.artist || "Person Name"}
                </p>
                </div>
                <div className="w-full">
                <Progress value={progress} />
                <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
                </div>
                <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={handlePrevTrack}>
                    <RewindIcon className="w-6 h-6" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handlePlayPause}>
                    {isPlaying ? (
                    <PauseIcon className="w-6 h-6" />
                    ) : (
                    <PlayIcon className="w-6 h-6" />
                    )}
                </Button>
                <Button variant="ghost" size="icon" onClick={handleNextTrack}>
                    <ForwardIcon className="w-6 h-6" />
                </Button>
                <Button variant="ghost" size="icon" onClick={changeLoop}>
                    { loop ? <Repeat color="#4fb57b"  /> : <Repeat className="w-6 h-6" />  }          
                </Button>
                
                </div>
                <audio
                ref={audioRef}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={loopActivated}
                />
            </div>
            <label className="flex items-center cursor-pointer">
            <UploadIcon className="w-5 h-5 mr-2" />
            <span>Upload</span>
            <input
              type="file"
              accept="audio/*"
              multiple
              className="hidden"
              onChange={handleUpload}
            />
          </label>
          </CardContent>

        </Card>
      </div>
    </div>
  );
};

export default AudioPlayer;