import { z } from "zod";
import { corsFetch } from "./utils";

export interface FormatInfo {
  url: string;
  filesize?: number;
  format_id: string;
  format_note: string;
  ext: string;
  acodec: string; // none, opus, mp4a.40.2, ...
  vcodec: string; // none, vp9, av01.0.00M.08, ...
  width: number | null;
  height: number | null;
  quality: string | null;
  audioIsDefault?: boolean;
}

export interface VideoInfo {
  id: string;
  title: string;
  shortDescription: string;
  uploader: string;
  artist?: string;
  album?: string;
  track?: string;
  formats: FormatInfo[];
}

const RAW_INFO_SCHEMA = z.object({
  videoDetails: z.object({
    videoId: z.string(),
    title: z.string(),
    author: z.string(),
    shortDescription: z.string(),
  }),
  streamingData: z.object({
    adaptiveFormats: z
      .object({
        itag: z.number(),
        url: z.string(),
        mimeType: z.string(),
        width: z.number().optional(),
        height: z.number().optional(),
        contentLength: z
          .string()
          .refine((s) => s.match(/^\d+$/))
          .transform(Number)
          .optional(),
        quality: z.string().optional(),
        audioTrack: z.object({
          displayName: z.string(),
          id: z.string(),
          audioIsDefault: z.boolean(),
        }).optional(),
      })
      .array(),
  }),
});

async function fetchVideoInfoRaw(videoId: string): Promise<unknown> {
  const res = await corsFetch("https://www.youtube.com/youtubei/v1/player", {
    method: "POST",
    body: JSON.stringify({
      videoId,
      context: {
        client: {
          clientName: "ANDROID",
          clientVersion: "18.11.34",
          androidSdkVersion: 30,
          hl: "en",
        },
      },
    }),
    headers: {
      Origin: "https://www.youtube.com",
      "content-type": "application/json",
      "X-YouTube-Client-Name": "3",
      "X-YouTube-Client-Version": "18.11.34",
      "x-corsfix-headers": JSON.stringify({
        "user-agent":
          "com.google.android.youtube/18.11.34 (Linux; U; Android 11) gzip",
        origin: "https://www.youtube.com",
      }),
    },
  });
  return JSON.parse(await res.text());
}

export async function fetchVideoInfo(videoId: string): Promise<VideoInfo> {
  const raw = await fetchVideoInfoRaw(videoId);
  const p = RAW_INFO_SCHEMA.parse(raw);
  return {
    id: p.videoDetails.videoId,
    title: p.videoDetails.title,
    uploader: p.videoDetails.author,
    shortDescription: p.videoDetails.shortDescription,
    formats: p.streamingData.adaptiveFormats.map((f) => ({
      url: f.url,
      filesize: f.contentLength,
      format_id: f.itag.toString(),
      format_note: f.mimeType,
      ext: f.mimeType.split(";")[0]!.split("/")[1]!,
      acodec: f.mimeType.includes("audio/")
        ? f.mimeType.split(";")[1]!
        : "none",
      vcodec: f.mimeType.includes("video/")
        ? f.mimeType.split(";")[1]!
        : "none",
      width: f.width ?? null,
      height: f.height ?? null,
      quality: f.quality ?? null,
      audioIsDefault: f.audioTrack?.audioIsDefault,
    })),
  };
}

async function downloadChunk(
  url: string,
  range: string,
  videoId: string,
  format_id: string,
  retries = 5
): Promise<ArrayBuffer> {
  const TIMEOUT_MS = 18000;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();

      const timeoutPromise = new Promise<ArrayBuffer>((_, reject) => {
        setTimeout(() => {
          controller.abort();
          reject(new Error("Request timed out"));
        }, TIMEOUT_MS);
      });

      const response = await corsFetch(url, {
        headers: { range },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await Promise.race([response.arrayBuffer(), timeoutPromise]);
    } catch (error) {
      if (attempt === retries - 1) throw error;

      // Get fresh video info and URL before retrying
      try {
        const freshVideoInfo = await fetchVideoInfo(videoId);
        const freshFormat = freshVideoInfo.formats.find(
          (f) => f.format_id === format_id
        );
        if (freshFormat) {
          url = freshFormat.url;
          console.log("Got fresh URL for retry");
        }
      } catch (refreshError) {
        console.error("Failed to refresh video URL:", refreshError);
      }
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
  throw new Error("Failed to download chunk after all retries");
}

function findFormat(
  formats: FormatInfo[],
  isVideo: boolean,
  quality?: string
): FormatInfo | null {
  const filtered = formats.filter(
    (f) =>
      f.ext === "webm" &&
      (isVideo
        ? f.vcodec !== "none" && f.quality === quality
        : f.acodec !== "none")
  );

  if (filtered.length === 0 || !filtered[0].filesize) {
    return null;
  }

  if (isVideo) {
    return filtered[0];
  } else {
    const defaultTrack = filtered.find((f) => f.audioIsDefault);
    if (defaultTrack) {
      return defaultTrack;
    }
    return filtered.sort((a, b) => b.filesize! - a.filesize!)[0];
  }
}

interface DownloadProgress {
  downloaded: number;
  total: number;
  percent: number;
}

// Add this type for the progress callback
type ProgressCallback = (progress: DownloadProgress) => void;

// Update the downloadFormat function to accept a progress callback
async function downloadFormat(
  format: FormatInfo | null,
  videoId: string,
  onProgress?: ProgressCallback
): Promise<ArrayBuffer | null> {
  if (!format) return null;

  const CHUNK_SIZE = 3 * 1024 * 1024;
  const downloadPromises: Promise<ArrayBuffer>[] = [];
  let downloadedSize = 0;

  for (let start = 0; start < format.filesize!; start += CHUNK_SIZE) {
    const end = Math.min(start + CHUNK_SIZE, format.filesize!);
    const range = `bytes=${start}-${end - 1}`;

    downloadPromises.push(
      downloadChunk(format.url, range, videoId, format.format_id)
        .then((chunk) => {
          downloadedSize += chunk.byteLength;
          onProgress?.({
            downloaded: downloadedSize,
            total: format.filesize!,
            percent: (downloadedSize / format.filesize!) * 100,
          });
          return chunk;
        })
        .catch((error) => {
          console.error(`Failed to download chunk ${start}-${end}:`, error);
          throw error;
        })
    );
  }

  try {
    const chunks = await Promise.all(downloadPromises);
    return new Blob(chunks).arrayBuffer();
  } catch (error) {
    console.error("Download failed:", error);
    return null;
  }
}

export async function downloadVideo(
  id: string,
  quality: string = "medium"
): Promise<ArrayBuffer | null> {
  const videoInfo = await fetchVideoInfo(id);
  return downloadFormat(findFormat(videoInfo.formats, true, quality), id);
}

export async function downloadAudio(id: string): Promise<ArrayBuffer | null> {
  const videoInfo = await fetchVideoInfo(id);
  return downloadFormat(findFormat(videoInfo.formats, false), id);
}

// Update the downloadMedia function to include progress tracking
export async function downloadMedia(
  id: string,
  quality: string = "medium",
  onVideoProgress?: ProgressCallback,
  onAudioProgress?: ProgressCallback
): Promise<{ video: ArrayBuffer | null; audio: ArrayBuffer | null }> {
  const videoInfo = await fetchVideoInfo(id);

  const [video, audio] = await Promise.all([
    downloadFormat(findFormat(videoInfo.formats, true, quality), id, onVideoProgress),
    downloadFormat(findFormat(videoInfo.formats, false), id, onAudioProgress),
  ]);

  return { video, audio };
}
