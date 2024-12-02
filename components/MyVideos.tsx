import { Video } from "@/lib/model/Video";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

export default function MyVideos({ videos, onSelectVideo, onDeleteVideo }: { 
  videos: Video[], 
  onSelectVideo: (video: Video) => void, 
  onDeleteVideo: (video: Video) => void 
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [pressedVideoId, setPressedVideoId] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout>();
  const scaleTimer = useRef<NodeJS.Timeout>();

  const handleDeleteVideo = (video: Video) => {
    onDeleteVideo(video);
    setDialogOpen(false);
  }

  const startLongPress = (video: Video) => {
    // Start with no scale change
    setPressedVideoId(video.id);
    
    // After 125ms, apply the scale effect
    scaleTimer.current = setTimeout(() => {
      setPressedVideoId(`${video.id}-scaled`);
    }, 125);
    
    // After 500ms total, trigger the long press action
    longPressTimer.current = setTimeout(() => {
      setSelectedVideo(video);
      setDialogOpen(true);
      setPressedVideoId(null);
    }, 500);
  };

  const cancelLongPress = () => {
    clearTimeout(longPressTimer.current);
    clearTimeout(scaleTimer.current);
    setPressedVideoId(null);
  };

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">My Videos</h2>
      <div className="space-y-4">
        {videos.length === 0 && (
          <div className="flex items-center justify-center w-full">
            <p className="text-gray-500 text-center">No videos yet, start adding some!</p>
          </div>
        )}
        {videos.map((video) => (
          <div 
            key={video.id} 
            className={cn(
              "group flex items-center justify-between hover:bg-secondary p-1 rounded-md cursor-pointer w-full",
              "transition-transform duration-200 ease-in-out",
              pressedVideoId === video.id && "scale-100",
              pressedVideoId === `${video.id}-scaled` && "scale-[0.98]"
            )}
          >
            <div 
              className="flex space-x-3 items-center flex-1" 
              onTouchStart={() => startLongPress(video)}
              onTouchEnd={cancelLongPress}
              onTouchCancel={cancelLongPress}
              onMouseDown={() => startLongPress(video)}
              onMouseUp={cancelLongPress}
              onMouseLeave={cancelLongPress}
              onClick={() => onSelectVideo(video)}
            >
              <div className="relative aspect-video w-20 md:w-28 bg-gray-200 rounded-md">
                <img src={video.thumbnail} alt={video.title} className="object-cover w-full h-full rounded-md" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm line-clamp-1">{video.title}</p>
                <p className="text-xs">{video.author}</p>
              </div>
            </div>
            <Dialog 
              open={dialogOpen && selectedVideo?.id === video.id} 
              onOpenChange={setDialogOpen}
            >
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 text-muted-foreground focus-visible:ring-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedVideo(video);
                  }}
                >
                  <span>•••</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0 border-neutral-700 [&>button]:hidden w-3/4 rounded-xl overflow-hidden">
                <div className="flex flex-col">
                  <div className="p-4 border-b border-neutral-700">
                    <div className="flex space-x-4">
                      <div className="relative aspect-video w-32 bg-gray-200 rounded-md">
                        <img 
                          src={video.thumbnail} 
                          alt={video.title} 
                          className="object-cover w-full h-full rounded-md" 
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{video.title}</p>
                        <p className="text-sm text-muted-foreground">{video.author}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <Button 
                      variant="ghost" 
                      className="w-full text-red-500 justify-center rounded-none py-3 h-auto hover:bg-neutral-800 text-sm font-normal focus-visible:ring-0"
                      onClick={() => handleDeleteVideo(video)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ))}
      </div>
    </>
  )
}