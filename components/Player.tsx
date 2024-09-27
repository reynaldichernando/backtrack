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

export default function Player({ children, currentVideo, currentView, isPlaying, position, duration, onBack, onTogglePlay, onClickPrevTrack, onClickNextTrack, updateMediaSources, onSeekTo }: { children: React.ReactNode, currentVideo: Video | null, currentView: string, isPlaying: boolean, position: number, duration: number, onBack: () => void, onTogglePlay: () => void, onClickPrevTrack: () => void, onClickNextTrack: () => void, updateMediaSources: (videoSrc: string, audioSrc: string) => void, onSeekTo: (time: number) => void }) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [tempPosition, setTempPosition] = useState(0);
  const [maximized, setMaximized] = useState(false);

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

  const handleSeekChange = (time: number) => {
    setSeeking(true);
    setTempPosition(time);
  }

  const handleSeekEnd = (time: number) => {
    onSeekTo(time);
    setTimeout(() => {
      setSeeking(false);
    }, 300);
  }

  const getMinuteSecondPosition = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    if (isNaN(minutes) || isNaN(seconds)) {
      return '--:--';
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  const handleToggleMaximize = () => {
    setMaximized(!maximized);
  }

  return (
    <div className={`flex flex-col fixed top-0 right-0 w-full lg:w-3/4 h-screen bg-white transition duration-300 ease-out ${currentView == "detail" ? "transform translate-y-0 opacity-100" : "transform translate-y-full opacity-0"}`}>
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
          <h2 className="text-xl font-semibold mb-2 line-clamp-1">{currentVideo?.title}</h2>
          <p className="text-gray-500">{currentVideo?.author}</p>
        </div>
        <div className="flex flex-col flex-grow justify-evenly items-center">
          <Slider.Root
            className="relative flex items-center select-none touch-none w-96 max-w-xs md:w-1/2 md:max-w-none mx-auto pt-8 pb-10"
            value={[seeking ? tempPosition : position]}
            max={duration}
            onValueChange={(values) => handleSeekChange(values[0])}
            onValueCommit={(values) => handleSeekEnd(values[0])}
          >
            <Slider.Track className="bg-blue-100 relative grow rounded-full h-2">
              <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
              <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-500">{seeking ? getMinuteSecondPosition(tempPosition) : getMinuteSecondPosition(position)}</span>
                <span className="text-sm text-gray-500">{getMinuteSecondPosition(duration)}</span>
              </div>
            </Slider.Track>
            <Slider.Thumb
              className="block size-4 active:size-6 bg-white border shadow-md shadow-gray-400 rounded-full focus:outline-none"
              aria-label="Scrubber"
            />
          </Slider.Root>
          <div className="flex justify-center space-x-16">
            <Button size="icon" variant="ghost" onClick={onClickPrevTrack}>
              <Rewind className="size-8" fill="currentColor" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onTogglePlay}>
              {loading ? <Spinner className="size-8" /> : isPlaying ? <Pause className="size-8" fill="currentColor" /> : <Play className="size-8" fill="currentColor" />}
            </Button>
            <Button size="icon" variant="ghost" onClick={onClickNextTrack}>
              <FastForward className="size-8" fill="currentColor" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
