import { Video } from "@/lib/model/Video";
import { Pause, Play } from "lucide-react";
import { Button } from "./ui/button";

export default function MiniPlayer({ currentVideo, currentView, isPlaying, onClick, onTogglePlay }: { currentVideo: Video | null, currentView: string, isPlaying: boolean, onClick: () => void, onTogglePlay: () => void }) {
  const handleTogglePlay = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onTogglePlay();
  }
  
  return (
    <div className={`border-t p-4 flex items-center justify-between bg-white fixed bottom-0 left-0 right-0 transition-transform duration-300 ease-out ${currentView == "detail" ? "transform translate-y-full" : "transform translate-y-0"}`} onClick={onClick}>
      <div className="flex items-center space-x-2">
        <div className="aspect-square w-10">
          <img src={currentVideo?.thumbnail} alt={currentVideo?.title} className="object-cover w-full h-full" />
        </div>
        <div>
          <p className="font-medium line-clamp-1">{currentVideo?.title || 'No video selected.'}</p>
          <p className="text-sm text-gray-500">{currentVideo?.author || '-'}</p>
        </div>
      </div>
      {currentVideo && (
        <Button size="icon" variant="ghost" onClick={handleTogglePlay}>
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
        </Button>
      )}
    </div>
  )
}
