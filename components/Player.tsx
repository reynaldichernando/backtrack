import { getMediaBinary, saveMediaBinary } from "@/lib/indexedDb";
import { Video } from "@/lib/model/Video";
import { useEffect } from "react";
import { Button } from "./ui/button";
import { ChevronDown, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { downloadMedia } from "@/lib/youtube";
import { useToast } from "../hooks/useToast";
import { MediaBinaryData } from "@/lib/model/MediaBinaryData";

export default function Player({ children, currentVideo, currentView, isPlaying, onBack, onTogglePlay, onClickPrevTrack, onClickNextTrack, updateMediaSources }: { children: React.ReactNode, currentVideo: Video | null, currentView: string, isPlaying: boolean, onBack: () => void, onTogglePlay: () => void, onClickPrevTrack: () => void, onClickNextTrack: () => void, updateMediaSources: (videoSrc: string, audioSrc: string) => void }) {
  const { addToast } = useToast();

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
      addToast('Video loaded from cache');
    } else {
      addToast('Downloading video...');

      const videoBuffer = await downloadMedia(currentVideo.id, 'video');
      const audioBuffer = await downloadMedia(currentVideo.id, 'audio');

      if (!videoBuffer || !audioBuffer) {
        return;
      }

      await saveMediaBinary(currentVideo.id, videoBuffer, audioBuffer);

      const videoBlob = new Blob([videoBuffer], { type: 'video/webm' });
      const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });

      const videoUrl = URL.createObjectURL(videoBlob);
      const audioUrl = URL.createObjectURL(audioBlob);

      updateMediaSources(videoUrl, audioUrl);
      addToast('Video saved successfully');
    }
  };

  return (
    <>
      <div className={`flex flex-col fixed top-0 right-0 w-full md:w-3/4 h-screen bg-white transition duration-300 ease-out ${currentView == "detail" ? "transform translate-y-0 opacity-100" : "transform translate-y-full opacity-0"}`}>
        <div className="p-4 overflow-auto">
          <Button variant="ghost" className="mb-4" onClick={onBack}>
            <ChevronDown className="m-2 h-4 w-4" />
          </Button>
          <div className="md:w-2/3 mx-auto">
            {children}
            <h2 className="text-xl font-semibold mb-2">{currentVideo?.title}</h2>
            <p className="text-gray-500 mb-4">{currentVideo?.author}</p>
          </div>
          <div className="flex justify-center space-x-4">
            <Button size="icon" variant="ghost" onClick={onClickPrevTrack}>
              <SkipBack className="h-6 w-6" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onTogglePlay}>
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>
            <Button size="icon" variant="ghost" onClick={onClickNextTrack}>
              <SkipForward className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
