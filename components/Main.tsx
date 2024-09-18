import { useToast } from "@/hooks/useToast";
import { getAllVideos, addVideo, deleteVideo, deleteMediaBinary } from "@/lib/indexedDb";
import { Video } from "@/lib/model/Video";
import { generateThumbnailUrl } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import AddVideoDialog from "./AddVideoDialog";
import MiniPlayer from "./MiniPlayer";
import Player from "./Player";
import MyVideos from "./MyVideos";

export default function Main() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentView, setCurrentView] = useState("home");
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [videoSrc, setVideoSrc] = useState<string>();
  const [audioSrc, setAudioSrc] = useState<string>();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const { addToast } = useToast();

  useEffect(() => {
    loadVideos();
  }, [])

  useEffect(() => {
    const interval = setInterval(function () {
      if (!videoRef.current || !audioRef.current) { return; }
      if (!navigator.mediaSession) { return; }
      if (videoRef.current.duration < 0 || audioRef.current.duration < 0) { return; }

      try {
        if (Math.abs(videoRef.current.currentTime - audioRef.current.currentTime) > 0.3) {
          videoRef.current.currentTime = audioRef.current.currentTime;
        }

        if (audioRef.current.paused && !videoRef.current.paused) {
          videoRef.current.pause();
        } else if (!audioRef.current.paused && videoRef.current.paused) {
          videoRef.current.play();
        }

        setPosition(videoRef.current.currentTime);
        setDuration(videoRef.current.duration);

        navigator.mediaSession.setPositionState({ duration: audioRef.current.duration, position: audioRef.current.currentTime });
      } catch (error) {
      }
    }, 300);

    return () => {
      clearInterval(interval);
    }
  }, []);

  const loadVideos = async () => {
    const videos = await getAllVideos()
    setVideos(videos)
  }

  const handleSelectVideo = (video: Video) => {
    setCurrentVideo(video)
    setCurrentView("detail")
  }

  const handleAddVideo = async (video: Video) => {
    const thumbnailResponse = await fetch(`https://app.backtrackhq.workers.dev/?${generateThumbnailUrl(video.id)}`);
    const thumbnailBuffer = thumbnailResponse.status === 404 ? await (await fetch(video.thumbnail)).arrayBuffer() : await thumbnailResponse.arrayBuffer();
    const thumbnailBase64 = Buffer.from(thumbnailBuffer).toString('base64');

    await addVideo({
      ...video,
      thumbnail: `data:image/jpeg;base64,${thumbnailBase64}`
    });

    addToast('Video added successfully', 'success');
    await loadVideos();
  }

  const handleDeleteVideo = async (video: Video) => {
    await deleteVideo(video.id);
    await deleteMediaBinary(video.id);
    addToast('Video deleted successfully', 'success');
    loadVideos();
  }

  const handlePlayerBack = () => {
    setCurrentView("home");
  }

  const handleMiniPlayerClick = () => {
    setCurrentView("detail");
  }

  const setHandlers = () => {
    if (!currentVideo) { return; }
    const playingVideo = videos.find((video) => video.id === currentVideo.id);
    if (!playingVideo) { return; }
    navigator.mediaSession.metadata = new MediaMetadata({ title: playingVideo.title, artist: playingVideo.author, artwork: [{ src: playingVideo.thumbnail }] });
    navigator.mediaSession.setActionHandler('play', playTrack);
    navigator.mediaSession.setActionHandler('pause', pauseTrack);
    navigator.mediaSession.setActionHandler('stop', stopTrack);
    navigator.mediaSession.setActionHandler('previoustrack', prevTrack);
    navigator.mediaSession.setActionHandler('nexttrack', nextTrack);
    navigator.mediaSession.setActionHandler('seekto', (details: MediaSessionActionDetails) => seekTo(details.seekTime ?? 0));
    navigator.mediaSession.playbackState = "playing";
    setIsPlaying(true);
  }

  const playTrack = () => {
    if (!videoRef.current || !audioRef.current) { return; }
    videoRef.current.play();
    audioRef.current.play();
    navigator.mediaSession.playbackState = "playing";
    setIsPlaying(true);
  };

  const pauseTrack = () => {
    if (!videoRef.current || !audioRef.current) { return; }
    videoRef.current.pause();
    audioRef.current.pause();
    navigator.mediaSession.playbackState = "paused";
    setIsPlaying(false);
  };

  const stopTrack = () => {
    if (!videoRef.current || !audioRef.current) { return; }
    videoRef.current.pause();
    audioRef.current.pause();

    videoRef.current.currentTime = 0;
    audioRef.current.currentTime = 0;

    setIsPlaying(false);
  };

  const prevTrack = () => {
    const currentIndex = videos.findIndex((video) => video.id === currentVideo?.id);
    if (currentIndex === 0) {
      return;
    }
    const prevIndex = currentIndex - 1;
    setCurrentVideo(videos[prevIndex]);
  };

  const nextTrack = () => {
    const currentIndex = videos.findIndex((video) => video.id === currentVideo?.id);
    if (currentIndex === videos.length - 1) {
      return;
    }
    const nextIndex = currentIndex + 1;
    setCurrentVideo(videos[nextIndex]);
  };

  const seekTo = (time: number) => {
    if (!audioRef.current || !videoRef.current) { return; }
    audioRef.current.load();

    audioRef.current.currentTime = time;
    videoRef.current.currentTime = time;

    playTrack();
  }

  const handleTogglePlay = () => {
    if (isPlaying) {
      pauseTrack();
    } else {
      playTrack();
    }
  }

  const updateMediaSources = (videoSrc: string, audioSrc: string) => {
    setVideoSrc(videoSrc);
    setAudioSrc(audioSrc);
  }

  return (
    <>
      <div className={`md:flex ${currentView == "detail" ? "overflow-hidden h-screen" : ""}`}>
        <div className="md:w-1/4 p-4 space-y-4 md:overflow-auto md:border-r">
          <div className="flex items-center space-x-2">
            <img src="./144.png" alt="BackTrack Logo" className="w-8 h-8 rounded" />
            <h1 className="text-2xl font-bold">BackTrack</h1>
          </div>
          <AddVideoDialog onAddVideo={handleAddVideo} />
        </div>
        <div className="w-full md:w-3/4 p-4 md:overflow-auto pb-28 md:h-screen">
          <MyVideos videos={videos} onSelectVideo={handleSelectVideo} onDeleteVideo={handleDeleteVideo} />
          <Player
            currentVideo={currentVideo}
            currentView={currentView}
            isPlaying={isPlaying}
            position={position}
            duration={duration}
            onBack={handlePlayerBack}
            onTogglePlay={handleTogglePlay}
            onClickPrevTrack={prevTrack}
            onClickNextTrack={nextTrack}
            updateMediaSources={updateMediaSources}
            onSeekTo={seekTo}
          >
            <video
              className="aspect-video w-full bg-gray-200 rounded-lg mb-4 flex items-center justify-center"
              playsInline
              autoPlay
              poster={currentVideo?.thumbnail}
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
              onEnded={nextTrack}
            >
              <source src={audioSrc} type="audio/webm" />
            </audio>
          </Player>
        </div>
      </div>
      <MiniPlayer currentVideo={currentVideo} currentView={currentView} isPlaying={isPlaying} onClick={handleMiniPlayerClick} onTogglePlay={handleTogglePlay} />
    </>
  )
}