import { getMediaBinary, saveMediaBinary } from "@/lib/indexedDb";
import { downloadMedia } from "@/lib/youtube";
import { toast } from "sonner";
import { useRef, useState } from "react";

export function useMediaDownload() {
  const [loading, setLoading] = useState(false);
  const mediaProgressRef = useRef(0);

  const getMedia = async (videoId: string, title: string) => {
    if (loading) {
      toast.info(title, {
        description: "Download already in progress",
        duration: 2000
      });
      return;
    }

    const media = await getMediaBinary(videoId);

    if (media) {
      const videoBlob = new Blob([media.video], { type: "video/webm" });
      const audioBlob = new Blob([media.audio], { type: "audio/webm" });

      const videoUrl = URL.createObjectURL(videoBlob);
      const audioUrl = URL.createObjectURL(audioBlob);

      return { videoUrl, audioUrl };
    }

    const toastId = toast.loading(title, {
      description: "Downloading... 0%",
    });
    setLoading(true);
    mediaProgressRef.current = 0;

    try {
      const { video, audio } = await downloadMedia(
        videoId,
        "medium",
        (progress) => {
          const newProgress = (progress.percent + mediaProgressRef.current) / 2;
          mediaProgressRef.current = newProgress;
          toast.loading(title, {
            id: toastId,
            description: `Downloading... ${Math.round(newProgress)}%`
          });
        },
        (progress) => {
          const newProgress = (progress.percent + mediaProgressRef.current) / 2;
          mediaProgressRef.current = newProgress;
          toast.loading(title, {
            id: toastId,
            description: `Downloading... ${Math.round(newProgress)}%`
          });
        }
      );

      if (!video || !audio) {
        throw new Error("Failed to download media");
      }

      await saveMediaBinary(videoId, video, audio);

      const videoBlob = new Blob([video], { type: "video/webm" });
      const audioBlob = new Blob([audio], { type: "audio/webm" });

      const videoUrl = URL.createObjectURL(videoBlob);
      const audioUrl = URL.createObjectURL(audioBlob);

      toast.success(title, { 
        id: toastId,
        description: "Download complete",
        duration: 2000
      });

      return { videoUrl, audioUrl };
    } catch (error) {
      toast.error(title, { 
        id: toastId,
        description: "Download failed",
        duration: 2000
      });
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
      mediaProgressRef.current = 0;
    }
  };

  return {
    getMedia,
    loading
  };
} 