import { Video } from "@/lib/model/Video";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface VideoMenuProps {
  video: Video;
  onDeleteVideo: (video: Video) => void;
}

export default function VideoMenu({ video, onDeleteVideo }: VideoMenuProps) {
  const handleDeleteVideo = () => {
    onDeleteVideo(video);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground focus-visible:ring-0"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <span>•••</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex space-x-3 p-3">
          <div className="relative aspect-video w-20 bg-gray-200 rounded-md flex-shrink-0">
            <img
              src={video.thumbnail}
              alt={video.title}
              className="object-cover w-full h-full rounded-md"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="font-semibold text-sm leading-tight overflow-hidden"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical" as const,
              }}
            >
              {video.title}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {video.author} • {video.duration}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-500 focus:text-red-500 cursor-pointer"
          onClick={handleDeleteVideo}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
