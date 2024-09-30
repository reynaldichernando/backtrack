import { getMediaBinary, saveMediaBinary } from "@/lib/indexedDb";
import { Video } from "@/lib/model/Video";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { FastForward, Maximize, Minimize, Pause, Play, Rewind } from "lucide-react";
import { downloadMedia } from "@/lib/youtube";
import { useToast } from "../hooks/useToast";
import { MediaBinaryData } from "@/lib/model/MediaBinaryData";
import Spinner from "./ui/spinner";
import * as Slider from '@radix-ui/react-slider';
import { Drawer as VaulDrawer } from "vaul";

export default function Player({ children, currentVideo, currentView, isPlaying, position, duration, onBack, onTogglePlay, onClickPrevTrack, onClickNextTrack, updateMediaSources, onSeekTo }: { children: React.ReactNode, currentVideo: Video | null, currentView: string, isPlaying: boolean, position: number, duration: number, onBack: () => void, onTogglePlay: () => void, onClickPrevTrack: () => void, onClickNextTrack: () => void, updateMediaSources: (videoSrc: string, audioSrc: string) => void, onSeekTo: (time: number) => void }) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [open, setOpen] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [tempPosition, setTempPosition] = useState(0);

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
      const videoBlob = new Blob([media.video], { type: 'video/webm' });
      const audioBlob = new Blob([media.audio], { type: 'audio/webm' });

      const videoUrl = URL.createObjectURL(videoBlob);
      const audioUrl = URL.createObjectURL(audioBlob);

      updateMediaSources(videoUrl, audioUrl);
    } else {
      addToast('Downloading video...', 'info');
      setLoading(true);

      try {
        const videoBuffer = await downloadMedia(currentVideo.id, 'video');
        const audioBuffer = await downloadMedia(currentVideo.id, 'audio');

        if (!videoBuffer || !audioBuffer) {
          setLoading(false);
          updateMediaSources('', '');
          addToast('Failed to download video', 'error');
          return
        }

        await saveMediaBinary(currentVideo.id, videoBuffer, audioBuffer);

        const videoBlob = new Blob([videoBuffer], { type: 'video/webm' });
        const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });

        const videoUrl = URL.createObjectURL(videoBlob);
        const audioUrl = URL.createObjectURL(audioBlob);

        updateMediaSources(videoUrl, audioUrl);
        addToast('Video saved successfully', 'success');
      } catch (error) {
        setLoading(false);
        updateMediaSources('', '');
        addToast('Failed to download video', 'error');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggleMaximize = () => {
    setMaximized(!maximized);
  }

  const getMinuteSecondPosition = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    if (isNaN(minutes) || isNaN(seconds)) {
      return '--:--';
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  const handleSeekChange = (time: number) => {
    setSeeking(true);
    setTempPosition(time);
  }

  const handleSeekEnd = (time: number) => {
    onSeekTo(time);
    setTimeout(() => {
      setSeeking(false);
    }, 500);
  }

  return (
    <VaulDrawer.Root
      open={open}
      onOpenChange={onBack}
      shouldScaleBackground
    >
      <VaulDrawer.Portal>
        <VaulDrawer.Overlay />
        <VaulDrawer.Content className="fixed w-full right-0 bottom-0 top-0 focus:outline-none z-20 px-safe">
          <div className="flex flex-col w-full h-screen bg-background border-t-4 border-secondary">
            <div className="flex flex-col h-full overflow-auto">
              <div>
                <div className="p-3 max-w-20 mx-auto cursor-grab active:cursor-grabbing" onClick={onBack}>
                  <div className="rounded-xl h-1 bg-foreground/50"></div>
                </div>
              </div>
              <div className={`p-4 ${maximized ? "md:w-full" : "md:w-2/3 mx-auto"}`}>
                <div className="relative">
                  <Button variant="ghost" className="mb-4 absolute top-2 right-2 z-10" onClick={handleToggleMaximize}>
                    {maximized ? <Minimize className="h-4 w-4 text-gray-500" /> : <Maximize className="h-4 w-4 text-gray-500" />}
                  </Button>
                  {children}
                </div>
                <VaulDrawer.Title className="font-bold text-xl mb-2 line-clamp-1">{currentVideo?.title}</VaulDrawer.Title>
                <p>{currentVideo?.author}</p>
              </div>
              <div className="flex flex-col flex-grow justify-evenly items-center">
                <Slider.Root
                  className="relative flex items-center select-none touch-none w-96 max-w-xs md:w-1/2 md:max-w-none mx-auto py-2 mt-2 mb-8"
                  value={[seeking ? tempPosition : position]}
                  max={duration}
                  onValueChange={(values) => handleSeekChange(values[0])}
                  onValueCommit={(values) => handleSeekEnd(values[0])}
                >
                  <Slider.Track className="bg-secondary relative grow rounded-full h-2">
                    <Slider.Range className="absolute bg-foreground rounded-full h-full" />
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-sm text-gray-500">{seeking ? getMinuteSecondPosition(tempPosition) : getMinuteSecondPosition(position)}</span>
                      <span className="text-sm text-gray-500">{getMinuteSecondPosition(duration)}</span>
                    </div>
                  </Slider.Track>
                  <Slider.Thumb />
                </Slider.Root>
                <div className="flex justify-center space-x-16">
                  <Button size="icon" variant="ghost" onClick={onClickPrevTrack} className="transition-all duration-300 ease-in-out active:scale-75">
                    <Rewind className="size-8" fill="currentColor" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={onTogglePlay} className="transition-all duration-300 ease-in-out active:scale-75">
                    {loading ? <Spinner className="size-8" /> : isPlaying ? <Pause className="size-8" fill="currentColor" /> : <Play className="size-8" fill="currentColor" />}
                  </Button>
                  <Button size="icon" variant="ghost" onClick={onClickNextTrack} className="transition-all duration-300 ease-in-out active:scale-75">
                    <FastForward className="size-8" fill="currentColor" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </VaulDrawer.Content>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  );
}
