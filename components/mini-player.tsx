import { Video } from "@/lib/model/Video";
import { Pause, Play } from "lucide-react";
import { Button } from "./ui/button";

export default function MiniPlayer({
  currentVideo,
  currentView,
  isPlaying,
  onClick,
  onTogglePlay,
}: {
  currentVideo: Video | null;
  currentView: string;
  isPlaying: boolean;
  onClick: () => void;
  onTogglePlay: () => void;
}) {
  const handleTogglePlay = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onTogglePlay();
  };

  if (!currentVideo) {
    return null;
  }

  return (
    <div
      className={`border-t-4 border-secondary cursor-pointer pt-4 pl-safe-or-4 pb-safe-or-4 pr-safe-or-4 flex items-center justify-between bg-background z-20 transition-transform duration-300 ease-out ${
        currentView == "detail"
          ? "transform translate-y-full"
          : "transform translate-y-0"
      }`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-2">
        <div className="aspect-square w-10 min-w-10">
          <img
            src={currentVideo.thumbnail}
            alt={currentVideo.title}
            className="object-cover w-full h-full rounded-md"
          />
        </div>
        <div>
          <p className="font-bold text-sm line-clamp-1">
            {currentVideo?.title || "No video selected."}
          </p>
          <p className="text-xs">
            {currentVideo.author} &bull; {currentVideo.duration}
          </p>
        </div>
      </div>
      <div>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleTogglePlay}
          className="transition-all duration-300 ease-in-out active:scale-75"
        >
          {isPlaying ? (
            <Pause className="size-10" fill="currentColor" />
          ) : (
            <Play className="size-10" fill="currentColor" />
          )}
        </Button>
      </div>
    </div>
  );
}
