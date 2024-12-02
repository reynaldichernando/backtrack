import { getMediaBinary, saveMediaBinary } from "@/lib/indexedDb";
import { Video } from "@/lib/model/Video";
import { useEffect, useState, useRef } from "react";
import { Button } from "./ui/button";
import { FastForward, Pause, Play, Rewind } from "lucide-react";
import { MediaBinaryData } from "@/lib/model/MediaBinaryData";
import Spinner from "./ui/spinner";
import * as Slider from "@radix-ui/react-slider";
import { toast } from "sonner";
import { Drawer, DrawerContent, DrawerPortal, DrawerTitle } from "./ui/drawer";
import { downloadMedia } from "@/lib/youtube";

export default function Player({
  children,
  currentVideo,
  currentView,
  isPlaying,
  position,
  duration,
  onBack,
  onTogglePlay,
  onClickPrevTrack,
  onClickNextTrack,
  updateMediaSources,
  onSeekTo,
}: {
  children: React.ReactNode;
  currentVideo: Video | null;
  currentView: string;
  isPlaying: boolean;
  position: number;
  duration: number;
  onBack: () => void;
  onTogglePlay: () => void;
  onClickPrevTrack: () => void;
  onClickNextTrack: () => void;
  updateMediaSources: (videoSrc: string, audioSrc: string) => void;
  onSeekTo: (time: number) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [tempPosition, setTempPosition] = useState(0);
  const mediaProgressRef = useRef(0);

  useEffect(() => {
    getVideo();
  }, [currentVideo]);

  useEffect(() => {
    setOpen(currentView === "detail");
  }, [currentView]);

  const getVideo = async () => {
    if (!currentVideo) {
      return;
    }

    const media: MediaBinaryData = await getMediaBinary(currentVideo.id);

    if (media) {
      const videoBlob = new Blob([media.video], { type: "video/webm" });
      const audioBlob = new Blob([media.audio], { type: "audio/webm" });

      const videoUrl = URL.createObjectURL(videoBlob);
      const audioUrl = URL.createObjectURL(audioBlob);

      updateMediaSources(videoUrl, audioUrl);
    } else {
      const toastId = toast.loading(currentVideo.title, {
        description: "Downloading... 0%",
      });
      setLoading(true);
      mediaProgressRef.current = 0;

      try {
        const { video, audio } = await downloadMedia(
          currentVideo.id,
          "medium",
          (progress) => {
            const newProgress = (progress.percent + mediaProgressRef.current) / 2;
            mediaProgressRef.current = newProgress;
            toast.loading(currentVideo.title, {
              id: toastId,
              description: `Downloading... ${Math.round(newProgress)}%`
            });
          },
          (progress) => {
            const newProgress = (progress.percent + mediaProgressRef.current) / 2;
            mediaProgressRef.current = newProgress;
            toast.loading(currentVideo.title, {
              id: toastId,
              description: `Downloading... ${Math.round(newProgress)}%`
            });
          }
        );

        if (!video || !audio) {
          setLoading(false);
          updateMediaSources("", "");
          toast.error("Failed to download media", { 
            id: toastId,
            duration: 2000
          });
          return;
        }

        await saveMediaBinary(currentVideo.id, video, audio);

        const videoBlob = new Blob([video], { type: "video/webm" });
        const audioBlob = new Blob([audio], { type: "audio/webm" });

        const videoUrl = URL.createObjectURL(videoBlob);
        const audioUrl = URL.createObjectURL(audioBlob);

        toast.loading(currentVideo.title, {
          id: toastId,
          description: "Downloading... 100%"
        });

        await new Promise(resolve => setTimeout(resolve, 500));

        updateMediaSources(videoUrl, audioUrl);
        toast.success(currentVideo.title, { 
          id: toastId,
          description: "Download complete",
          duration: 2000
        });
      } catch (error) {
        setLoading(false);
        updateMediaSources("", "");
        toast.error(currentVideo.title, { 
          id: toastId,
          description: "Download failed",
          duration: 2000
        });
        console.error(error);
      } finally {
        setLoading(false);
        mediaProgressRef.current = 0;
      }
    }
  };

  const getMinuteSecondPosition = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    if (isNaN(minutes) || isNaN(seconds)) {
      return "--:--";
    }
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleSeekChange = (time: number) => {
    setSeeking(true);
    setTempPosition(time);
  };

  const handleSeekEnd = (time: number) => {
    onSeekTo(time);
    setTimeout(() => {
      setSeeking(false);
    }, 500);
  };

  return (
    <Drawer open={open} onOpenChange={onBack}>
      <DrawerPortal>
        <DrawerContent>
          <div className="flex flex-col w-full h-screen bg-background">
            <div className="flex flex-col h-full overflow-auto">
              <div className="flex flex-col flex-grow justify-evenly items-center">
                <div className={"p-4 md:w-2/3 mx-auto"}>
                  <div className="relative">{children}</div>
                  <DrawerTitle className="font-bold text-xl my-4 line-clamp-1">
                    {currentVideo?.title}
                  </DrawerTitle>
                  <p>{currentVideo?.author}</p>
                </div>
                <Slider.Root
                  className="relative flex items-center select-none touch-none w-96 max-w-xs md:w-1/2 md:max-w-none mx-auto py-2 mb-12"
                  value={[seeking ? tempPosition : position]}
                  max={duration}
                  onValueChange={(values) => handleSeekChange(values[0])}
                  onValueCommit={(values) => handleSeekEnd(values[0])}
                >
                  <Slider.Track className="bg-secondary relative grow rounded-full h-2">
                    <Slider.Range className="absolute bg-foreground rounded-full h-full" />
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-sm text-gray-500">
                        {seeking
                          ? getMinuteSecondPosition(tempPosition)
                          : getMinuteSecondPosition(position)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {getMinuteSecondPosition(duration)}
                      </span>
                    </div>
                  </Slider.Track>
                  <Slider.Thumb />
                </Slider.Root>
                <div className="flex justify-center space-x-16 mb-8">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={onClickPrevTrack}
                    className="transition-all duration-300 ease-in-out active:scale-75"
                  >
                    <Rewind className="size-8" fill="currentColor" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={onTogglePlay}
                    className="transition-all duration-300 ease-in-out active:scale-75"
                  >
                    {loading ? (
                      <Spinner className="size-8" />
                    ) : isPlaying ? (
                      <Pause className="size-8" fill="currentColor" />
                    ) : (
                      <Play className="size-8" fill="currentColor" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={onClickNextTrack}
                    className="transition-all duration-300 ease-in-out active:scale-75"
                  >
                    <FastForward className="size-8" fill="currentColor" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
}
