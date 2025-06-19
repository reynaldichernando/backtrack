import { Video } from "@/lib/model/Video";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { useState } from "react";
import { LongPressEventType, useLongPress } from "use-long-press";
import { cn } from "@/lib/utils";

export default function MyVideos({
  videos,
  onSelectVideo,
  onDeleteVideo,
}: {
  videos: Video[];
  onSelectVideo: (video: Video) => void;
  onDeleteVideo: (video: Video) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [pressedVideoId, setPressedVideoId] = useState<string | null>(null);

  const handleDeleteVideo = (video: Video) => {
    onDeleteVideo(video);
    setDialogOpen(false);
  };

  const bind = useLongPress<HTMLDivElement, Video>(
    (event, { context }) => {
      if (context) {
        setActiveVideo(context as Video);
        setDialogOpen(true);
        setPressedVideoId(null);
      }
    },
    {
      onStart: (event, { context }) => {
        if (context) {
          setPressedVideoId(context.id);
        }
      },
      onFinish: () => {
        setPressedVideoId(null);
      },
      onCancel: () => {
        setPressedVideoId(null);
      },
      threshold: 400,
      cancelOnMovement: true,
      detect: LongPressEventType.Touch,
    }
  );

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">My Videos</h2>
      <div className="space-y-4">
        {videos.length === 0 && (
          <div className="flex items-center justify-center w-full">
            <p className="text-gray-500 text-center">
              No videos yet, start adding some!
            </p>
          </div>
        )}
        {videos.map((video) => (
          <div
            key={video.id}
            className={cn(
              "group flex items-center justify-between hover:bg-secondary p-1 rounded-md cursor-pointer w-full",
              "transition-transform duration-200 ease-in-out",
              pressedVideoId === video.id && "scale-100",
              pressedVideoId === video.id && "scale-[0.98]"
            )}
            {...bind(video)}
          >
            <div
              className="flex space-x-3 items-center flex-1"
              onClick={() => onSelectVideo(video)}
            >
              <div className="relative aspect-video w-20 md:w-28 bg-gray-200 rounded-md">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="object-cover w-full h-full rounded-md"
                />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm line-clamp-1">{video.title}</p>
                <p className="text-xs">
                  {video.author} &bull; {video.duration}
                </p>
              </div>
            </div>
            <Dialog
              open={dialogOpen && activeVideo?.id === video.id}
              onOpenChange={setDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground focus-visible:ring-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveVideo(video);
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
                        <p className="text-sm text-muted-foreground">
                          {video.author} &bull; {video.duration}
                        </p>
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
  );
}
