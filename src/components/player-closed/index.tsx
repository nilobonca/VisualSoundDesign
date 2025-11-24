import { Button } from "@/components/ui/button";
import {
  PlayIcon,
  PauseIcon,
 
} from "lucide-react";

const AudioPlayerClosed = ({ Name, HandlePlayPause, IsPlaying, IsClosed }: any) => {

    return (
        <div hidden={!IsClosed}>
            <h3 className="text-xl font-bold">
                {Name || "Audio Title"}
            </h3>

            <Button variant="ghost" size="icon" onClick={HandlePlayPause}>
                {IsPlaying ? (
                    <PauseIcon className="w-6 h-6" />
                ) : (
                    <PlayIcon className="w-6 h-6" />
                )}
            </Button>
        </div>
    )
}

export default AudioPlayerClosed;