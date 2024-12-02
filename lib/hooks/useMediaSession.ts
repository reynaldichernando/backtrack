import { Video } from "@/lib/model/Video";

interface MediaSessionHandlers {
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
}

export function useMediaSession(currentVideo: Video | null, handlers: MediaSessionHandlers) {
  const updateMetadata = () => {
    if (!currentVideo || !navigator.mediaSession) return;
    
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentVideo.title,
      artist: currentVideo.author,
      artwork: [{ src: currentVideo.thumbnail }],
    });
  };

  const setupHandlers = () => {
    if (!navigator.mediaSession) return;

    navigator.mediaSession.setActionHandler("play", handlers.onPlay);
    navigator.mediaSession.setActionHandler("pause", handlers.onPause);
    navigator.mediaSession.setActionHandler("stop", handlers.onStop);
    navigator.mediaSession.setActionHandler("previoustrack", handlers.onPrev);
    navigator.mediaSession.setActionHandler("nexttrack", handlers.onNext);
    navigator.mediaSession.setActionHandler("seekto", 
      (details: MediaSessionActionDetails) => handlers.onSeek(details.seekTime ?? 0)
    );
  };

  return { updateMetadata, setupHandlers };
} 