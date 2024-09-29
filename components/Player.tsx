import { getMediaBinary, saveMediaBinary } from "@/lib/indexedDb";
import { Video } from "@/lib/model/Video";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { ChevronDown, FastForward, Maximize, Minimize, Pause, Play, Rewind } from "lucide-react";
import { downloadMedia } from "@/lib/youtube";
import { useToast } from "../hooks/useToast";
import { MediaBinaryData } from "@/lib/model/MediaBinaryData";
import Spinner from "./ui/spinner";
import * as Slider from '@radix-ui/react-slider';
import { Drawer as VaulDrawer } from "vaul";
import useInterval from "@/hooks/useInterval";

const SMALL_NUMBER = 0.0001;

export default function Player({ children, currentVideo, currentView, isPlaying, position, duration, onBack, onTogglePlay, onClickPrevTrack, onClickNextTrack, updateMediaSources, onSeekTo }: { children: React.ReactNode, currentVideo: Video | null, currentView: string, isPlaying: boolean, position: number, duration: number, onBack: () => void, onTogglePlay: () => void, onClickPrevTrack: () => void, onClickNextTrack: () => void, updateMediaSources: (videoSrc: string, audioSrc: string) => void, onSeekTo: (time: number) => void }) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [snap, setSnap] = useState<number | string | null>(SMALL_NUMBER);

  useEffect(() => {
    getVideo();
  }, [currentVideo]);

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

  useEffect(() => {
    if (currentView === "detail") {
      setSnap(1);
    } else {
      setSnap(SMALL_NUMBER);
    }
  }, [currentView]);

  const handleSnap = (snap: number | string | null) => {
    setSnap(snap);
    onBack();
  }

  return (
    <VaulDrawer.Root
      open={true}
      modal={false}
      snapPoints={[SMALL_NUMBER, 1]}
      activeSnapPoint={snap}
      setActiveSnapPoint={handleSnap}
      snapToSequentialPoint={true}
      closeThreshold={0.05}
    >
      <VaulDrawer.Portal>
        <VaulDrawer.Overlay />
        <VaulDrawer.Content className="fixed w-full lg:w-3/4 right-0 bottom-0 top-0 focus:outline-none z-10">
          <div className="flex flex-col w-full h-screen bg-background">
            <div className="p-4 overflow-auto h-full flex flex-col">
              <div>
                <Button variant="ghost" className="mb-4" onClick={onBack}>
                  <ChevronDown className="m-2 h-4 w-4" />
                </Button>
              </div>
              <div className={maximized ? "md:w-full" : "md:w-2/3 mx-auto"}>
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
                <Scrubber position={position} duration={duration} isPlaying={isPlaying} currentVideo={currentVideo} onSeekTo={onSeekTo} />
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

function Scrubber({ position, duration, isPlaying, currentVideo, onSeekTo }: { position: number, duration: number, isPlaying: boolean, currentVideo: Video | null, onSeekTo: (time: number) => void }) {
  const [seeking, setSeeking] = useState(false);
  const [tempPosition, setTempPosition] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(position);
  
  useEffect(() => {
    setCurrentPosition(position);
  }, [currentVideo, position]);

  useInterval(() => {
    if (!isPlaying || seeking) { return; }
    setCurrentPosition(currentPosition + 0.3);
  }, 300);

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
    setCurrentPosition(time);
    setTimeout(() => {
      setSeeking(false);
    }, 500);
  }

  return (
    <Slider.Root
      className="relative flex items-center select-none touch-none w-96 max-w-xs md:w-1/2 md:max-w-none mx-auto py-2 mt-2 mb-8"
      value={[seeking ? tempPosition : currentPosition]}
      max={duration}
      onValueChange={(values) => handleSeekChange(values[0])}
      onValueCommit={(values) => handleSeekEnd(values[0])}
    >
      <Slider.Track className="bg-secondary relative grow rounded-full h-2">
        <Slider.Range className="absolute bg-foreground rounded-full h-full" />
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-500">{seeking ? getMinuteSecondPosition(tempPosition) : getMinuteSecondPosition(currentPosition)}</span>
          <span className="text-sm text-gray-500">{getMinuteSecondPosition(duration)}</span>
        </div>
      </Slider.Track>
      <Slider.Thumb />
    </Slider.Root>
  )
}
