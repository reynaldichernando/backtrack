"use client";
import { Video } from "@/lib/model/Video";
import { corsFetch } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useMediaDownload } from "@/lib/hooks/useMediaDownload";
import { useMediaSession } from "@/lib/hooks/useMediaSession";
import {
  addVideo,
  deleteVideo,
  getAllVideos,
  videoExists,
} from "@/lib/services/videoService";
import {
  deleteMediaBinary,
  getMediaBinary,
} from "@/lib/services/videoBinaryService";
import AddVideoDialog from "@/components/add-video";
import MyVideos from "@/components/video-list";
import MiniPlayer from "@/components/mini-player";
import Player from "@/components/player";

export default function App() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentView, setCurrentView] = useState("home");
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const [videoSrc, setVideoSrc] = useState<string>();
  const [audioSrc, setAudioSrc] = useState<string>();

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const { getMedia } = useMediaDownload();

  const mediaHandlers = {
    onPlay: () => {
      audioRef.current?.play();
      setIsPlaying(true);
      navigator.mediaSession.playbackState = "playing";
    },
    onPause: () => {
      audioRef.current?.pause();
      setIsPlaying(false);
      navigator.mediaSession.playbackState = "paused";
    },
    onStop: () => {
      audioRef.current?.pause();
      setIsPlaying(false);
    },
    onPrev: () => handleTrackChange("prev"),
    onNext: () => handleTrackChange("next"),
    onSeek: (time: number) => {
      audioRef.current && (audioRef.current.currentTime = time);
    },
  };

  const { updateMetadata, setupHandlers } = useMediaSession(
    currentVideo,
    mediaHandlers
  );

  const handleTogglePlay = () => {
    if (isPlaying) {
      mediaHandlers.onPause();
    } else {
      mediaHandlers.onPlay();
    }
  };

  const handleAudioPlay = (event: React.SyntheticEvent<HTMLAudioElement>) => {
    if (!currentVideo) return;

    updateMetadata();
    setupHandlers();
    setIsPlaying(true);
    setPosition(0);
    setDuration(event.currentTarget.duration);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const video = videoRef.current;
      const audio = audioRef.current;

      if (!video || !audio || video.duration < 0 || audio.duration < 0) return;

      if (Math.abs(video.currentTime - audio.currentTime) > 0.3) {
        video.currentTime = audio.currentTime;
      }

      if (audio.paused !== video.paused) {
        audio.paused ? video.pause() : video.play();
      }

      setPosition(audio.currentTime);
      setDuration(audio.duration);
    }, 300);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadVideos();
  }, []);

  const handleTrackChange = async (direction: "prev" | "next") => {
    const currentIndex = videos.findIndex((v) => v.id === currentVideo?.id);
    const nextVideo = await findNextDownloadedVideo(currentIndex, direction);

    if (nextVideo) {
      handleSelectVideo(nextVideo);
    } else {
      toast.error(
        `No ${
          direction === "prev" ? "previous" : "more"
        } downloaded videos available`
      );
    }
  };

  const loadVideos = async () => {
    const videos = await getAllVideos();
    setVideos(videos);
  };

  const handleSelectVideo = async (video: Video) => {
    if (video.id === currentVideo?.id) {
      setCurrentView("detail");
      return;
    }

    try {
      const result = await getMedia(video.id, video.title);
      if (!result) return;

      const { videoUrl, audioUrl } = result;
      setVideoSrc(videoUrl);
      setAudioSrc(audioUrl);
      setCurrentVideo(video);
      setCurrentView("detail");
    } catch (error) {
      console.error(error);
      toast.error("Failed to load video");
    }
  };

  const handleAddVideo = async (video: Video) => {
    const existingVideo = await videoExists(video.id);
    if (existingVideo) {
      toast("Video already exists");
      return;
    }

    const thumbnailResponse = await corsFetch(video.thumbnail);
    const thumbnailBuffer =
      thumbnailResponse.status === 404
        ? await (await fetch(video.thumbnail)).arrayBuffer()
        : await thumbnailResponse.arrayBuffer();
    const thumbnailBase64 = Buffer.from(thumbnailBuffer).toString("base64");

    const newVideo = {
      ...video,
      thumbnail: `data:image/jpeg;base64,${thumbnailBase64}`,
    };

    await addVideo(newVideo);
    toast("Video added successfully");
    await loadVideos();
  };

  const handleDeleteVideo = async (video: Video) => {
    await deleteVideo(video.id);
    await deleteMediaBinary(video.id);
    toast("Video deleted successfully");
    loadVideos();
  };

  const handlePlayerBack = () => {
    setCurrentView("home");
  };

  const handleMiniPlayerClick = () => {
    setCurrentView("detail");
  };

  const findNextDownloadedVideo = async (
    currentIndex: number,
    direction: "next" | "prev"
  ) => {
    const step = direction === "next" ? 1 : -1;
    const limit = direction === "next" ? videos.length : -1;

    for (let i = currentIndex + step; i !== limit; i += step) {
      const video = videos[i];
      const media = await getMediaBinary(video.id);
      if (media) {
        return video;
      }
    }
    return null;
  };

  return (
    <>
      <div className="flex flex-col h-dvh">
        <main className="flex flex-col md:flex-row flex-1 overflow-y-auto md:items-start mt-safe ml-safe mr-safe">
          <div className="md:sticky top-0 left-0 w-full md:w-1/4 p-4 space-y-2">
            <div className="flex items-center space-x-2 my-3">
              <img
                src="./144.png"
                alt="BackTrack Logo"
                className="size-8 rounded"
              />
              <h1 className="text-2xl font-bold">BackTrack</h1>
            </div>
            <AddVideoDialog onAddVideo={handleAddVideo} />
          </div>
          <div className="w-full md:w-3/4 p-4 border-secondary flex-grow self-stretch">
            <MyVideos
              videos={videos}
              onSelectVideo={handleSelectVideo}
              onDeleteVideo={handleDeleteVideo}
            />
          </div>
        </main>
        <MiniPlayer
          currentVideo={currentVideo}
          currentView={currentView}
          isPlaying={isPlaying}
          onClick={handleMiniPlayerClick}
          onTogglePlay={handleTogglePlay}
        />
      </div>
      <Player
        currentVideo={currentVideo}
        currentView={currentView}
        isPlaying={isPlaying}
        position={position}
        duration={duration}
        onBack={handlePlayerBack}
        onTogglePlay={handleTogglePlay}
        onClickPrevTrack={() => handleTrackChange("prev")}
        onClickNextTrack={() => handleTrackChange("next")}
        onSeekTo={mediaHandlers.onSeek}
      >
        <video
          className="aspect-video w-full bg-secondary rounded-lg"
          playsInline
          autoPlay
          poster={currentVideo?.thumbnail}
          src={videoSrc}
          ref={videoRef}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      </Player>
      <audio
        autoPlay
        src={audioSrc}
        ref={audioRef}
        onPlay={handleAudioPlay}
        onEnded={() => handleTrackChange("next")}
      />
    </>
  );
}
