import { downloadMedia } from "@/lib/youtube";
import { splitMediaToArrayBuffers } from "@/lib/ffmpeg";
import { toast } from "sonner";
import { useState } from "react";
import {
  getMediaBinary,
  saveMediaBinary,
} from "../services/videoBinaryService";

export function useMediaDownload() {
  const [loading, setLoading] = useState(false);

  const getMedia = async (videoId: string, title: string) => {
    if (loading) {
      toast.info(title, {
        description: "Download already in progress",
        duration: 2000,
      });
      return;
    }

    const media = await getMediaBinary(videoId);

    if (media) {
      const videoBlob = new Blob([media.video], { type: "video/mp4" });
      const audioBlob = new Blob([media.audio], { type: "audio/mp4" });

      const videoUrl = URL.createObjectURL(videoBlob);
      const audioUrl = URL.createObjectURL(audioBlob);

      return { videoUrl, audioUrl };
    }

    const toastId = toast.loading(title, {
      description: "Downloading... 0%",
    });
    setLoading(true);

    // Create a synchronous counter using closure
    let totalDownloaded = 0;

    try {
      const media = await downloadMedia(videoId, (progress) => {
        totalDownloaded += progress.bytes;
        const currentPercent = (totalDownloaded / progress.total) * 100;

        console.log(totalDownloaded, progress.total, currentPercent);
        toast.loading(title, {
          id: toastId,
          description: `Downloading... ${Math.round(currentPercent)}%`,
        });
      });

      if (!media) {
        throw new Error("Failed to download media");
      }

      // Update toast to show processing
      toast.loading(title, {
        id: toastId,
        description: "Processing media...",
      });

      // Split the media into video and audio using ffmpeg
      const { video, audio } = await splitMediaToArrayBuffers(media);

      // await saveMediaBinary(videoId, video, audio);

      const videoBlob = new Blob([video], { type: "video/mp4" });
      const audioBlob = new Blob([audio], { type: "audio/mp4" });

      const videoUrl = URL.createObjectURL(videoBlob);
      const audioUrl = URL.createObjectURL(audioBlob);

      toast.success(title, {
        id: toastId,
        description: "Download complete",
        duration: 2000,
      });

      return { videoUrl, audioUrl };
    } catch (error) {
      toast.error(title, {
        id: toastId,
        description: "Download failed",
        duration: 2000,
      });
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    getMedia,
    loading,
  };
}
