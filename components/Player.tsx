import { getMediaBinary, saveMediaBinary } from "@/lib/indexedDb";
import { Video } from "@/lib/model/Video";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { ChevronDown, Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { downloadMedia } from "@/lib/youtube";
import { useToast } from "./useToast";
import MiniPlayer from "./MiniPlayer";

export default function Player({ videos, video, currentView, setCurrentView, onVideoSelect }: { videos: Video[], video: Video | null, currentView: string, setCurrentView: (view: string) => void, onVideoSelect: (video: Video) => void }) {
  const [videoSrc, setVideoSrc] = useState<string>();
  const [audioSrc, setAudioSrc] = useState<string>();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);

  const { addToast } = useToast();

  useEffect(() => {
    const interval = setInterval(function () {
      if (!videoRef.current || !audioRef.current) { return; }
      if (!navigator.mediaSession) { return; }
      if (videoRef.current.duration < 0 || audioRef.current.duration < 0) { return; }

      if (Math.abs(videoRef.current.currentTime - audioRef.current.currentTime) > 0.3) {
        videoRef.current.currentTime = audioRef.current.currentTime;
      }

      if (audioRef.current.paused && !videoRef.current.paused) {
        videoRef.current.pause();
      }

      try {
        navigator.mediaSession.setPositionState({ duration: audioRef.current.duration, position: audioRef.current.currentTime });
      } catch (error) {
      }
    }, 300);

    return () => {
      clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    getVideo();
  }, [video]);

  const getVideo = async () => {
    if (!video) {
      return;
    }

    const media: any = await getMediaBinary(video.id);

    if (media) {
      const videoBlob = new Blob([media.video], { type: 'video/webm' });
      const videoUrl = URL.createObjectURL(videoBlob);
      const audioBlob = new Blob([media.audio], { type: 'audio/webm' });
      const audioUrl = URL.createObjectURL(audioBlob);

      setVideoSrc(videoUrl);
      setAudioSrc(audioUrl);
      addToast('Video loaded from cache');
    } else {
      addToast('Downloading video...');

      const videoBuffer = await downloadMedia(video.id, 'video');
      const audioBuffer = await downloadMedia(video.id, 'audio');

      if (!videoBuffer || !audioBuffer) {
        return;
      }

      await saveMediaBinary(video.id, videoBuffer, audioBuffer);

      const videoBlob = new Blob([videoBuffer], { type: 'video/webm' });
      const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });

      const videoUrl = URL.createObjectURL(videoBlob);
      const audioUrl = URL.createObjectURL(audioBlob);

      setVideoSrc(videoUrl);
      setAudioSrc(audioUrl);
      addToast('Video saved successfully');
    }
    
  };

  const setHandlers = () => {
    if (!video) { return; }
    const currentVideo = videos.find((v) => v.id === video.id);
    if (!currentVideo) { return; }
    navigator.mediaSession.metadata = new MediaMetadata({ title: currentVideo.title, artist: currentVideo.author, artwork: [{ src: currentVideo.thumbnail }] });
    navigator.mediaSession.setActionHandler('play', playTrack);
    navigator.mediaSession.setActionHandler('pause', pauseTrack);
    navigator.mediaSession.setActionHandler('stop', stopTrack);
    navigator.mediaSession.setActionHandler('previoustrack', prevTrack);
    navigator.mediaSession.setActionHandler('nexttrack', nextTrack);
    //navigator.mediaSession.setActionHandler('seekbackward', function(){});
    //navigator.mediaSession.setActionHandler('seekforward',  function(){});
    //navigator.mediaSession.setActionHandler('seekto', function(){});
    navigator.mediaSession.playbackState = "playing";
    setIsPlaying(true);
  }

  const playTrack = () => {
    if (videoRef.current) {
      videoRef.current.play();
    }
    if (audioRef.current) {
      audioRef.current.play();
    }
    navigator.mediaSession.playbackState = "playing";
    setIsPlaying(true);
  };

  const pauseTrack = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    navigator.mediaSession.playbackState = "paused";
    setIsPlaying(false);
  };

  const stopTrack = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    navigator.mediaSession.playbackState = "none";
    setIsPlaying(false);
  };

  const prevTrack = () => {
    const currentIndex = videos.findIndex((v) => v.id === video?.id);
    if (currentIndex === 0) {
      return;
    }
    const prevIndex = currentIndex - 1;
    onVideoSelect(videos[prevIndex]);
  };

  const nextTrack = () => {
    const currentIndex = videos.findIndex((v) => v.id === video?.id);
    if (currentIndex === videos.length - 1) {
      return;
    }
    const nextIndex = currentIndex + 1;
    onVideoSelect(videos[nextIndex]);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseTrack();
    } else {
      playTrack();
    }
  }

  return (
    <>
      <div className={`flex flex-col fixed top-0 right-0 w-full md:w-3/4 h-screen bg-white transition duration-300 ease-out ${currentView == "detail" ? "transform translate-y-0 opacity-100" : "transform translate-y-full opacity-0"}`}>
        <div className="p-4 overflow-auto">
          <Button variant="ghost" className="mb-4" onClick={() => setCurrentView("home")}>
            <ChevronDown className="m-2 h-4 w-4" />
          </Button>
          <div className="md:w-2/3 mx-auto">
            <video
              className="aspect-video w-full bg-gray-200 rounded-lg mb-4 flex items-center justify-center"
              playsInline
              autoPlay
              poster={video?.thumbnail}
              src={videoSrc}
              ref={videoRef}
            >
              <source src={videoSrc} type="video/webm" />
            </video>
            <audio
              className="aspect-video w-full bg-gray-200 rounded-lg mb-4 flex items-center justify-center"
              autoPlay
              src={audioSrc}
              ref={audioRef}
              onPlay={setHandlers}
            >
              <source src={audioSrc} type="audio/webm" />
            </audio>
            <h2 className="text-xl font-semibold mb-2">{video?.title}</h2>
            <p className="text-gray-500 mb-4">{video?.author}</p>
          </div>
          <div className="flex justify-center space-x-4">
            <Button size="icon" variant="ghost" onClick={prevTrack}>
              <SkipBack className="h-6 w-6" />
            </Button>
            <Button size="icon" variant="ghost" onClick={handlePlayPause}>
              {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
            </Button>
            <Button size="icon" variant="ghost" onClick={nextTrack}>
              <SkipForward className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
      <MiniPlayer video={video} currentView={currentView} setCurrentView={setCurrentView} isPlaying={isPlaying} handlePlayPause={handlePlayPause} />
    </>
  );
}