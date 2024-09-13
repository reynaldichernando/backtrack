import { Video } from "@/lib/model/Video";
import { Button } from "./ui/button";
import { Pause, Play } from "lucide-react";

export default function MiniPlayer({ video, currentView, setCurrentView, isPlaying, handlePlayPause }: { video: Video | null, currentView: string, setCurrentView: (view: string) => void, isPlaying: boolean, handlePlayPause: () => void }) {
  return (
    <div className={`border-t p-4 flex items-center justify-between bg-white fixed bottom-0 left-0 right-0 transition-transform duration-300 ease-out ${currentView == "detail" ? "transform translate-y-full" : "transform translate-y-0"}`}>
      <div className="flex items-center space-x-2">
        <div className="aspect-square w-10">
          <img src={video?.thumbnail} alt={video?.title} className="object-cover w-full h-full" />
        </div>
        <div onClick={() => setCurrentView("detail")}>
          <p className="font-medium line-clamp-1">{video?.title || 'No video selected.'}</p>
          <p className="text-sm text-gray-500">{video?.author || '-'}</p>
        </div>
      </div>
      {video && (
        <Button size="icon" variant="ghost" onClick={handlePlayPause}>
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
        </Button>
      )}
    </div>
  )
}
