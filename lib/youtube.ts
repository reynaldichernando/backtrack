import { z } from "zod";
import { corsFetch } from "./utils";
import { Video } from "./model/Video";

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
    formats: z
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
        audioTrack: z
          .object({
            displayName: z.string(),
            id: z.string(),
            audioIsDefault: z.boolean(),
          })
          .optional(),
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
          clientVersion: "19.02.39",
          androidSdkVersion: 30,
          hl: "en",
        },
      },
    }),
    headers: {
      "Content-Type": "application/json",
      "X-YouTube-Client-Name": "3",
      "X-YouTube-Client-Version": "19.02.39",
      "x-corsfix-headers": JSON.stringify({
        "user-agent":
          "com.google.android.youtube/19.02.39 (Linux; U; Android 11) gzip",
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
    formats: p.streamingData.formats.map((f) => ({
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

export async function downloadMedia(
  id: string,
  onMediaProgress: (progress: { bytes: number; total: number }) => void
): Promise<ArrayBuffer | null> {
  const videoInfo = await fetchVideoInfo(id);
  const format = videoInfo.formats[0];
  if (!format) return null;

  const CHUNK_SIZE = 2 * 1024 * 1024;
  const downloadPromises: Promise<ArrayBuffer>[] = [];
  let fileSize = format.filesize || -1;

  // handle empty file size
  if (fileSize <= 0) {
    try {
      const response = await corsFetch(format.url, {
        headers: {
          "x-corsfix-headers": JSON.stringify({ range: "bytes=0-0" }),
        },
      });
      const contentRange = response.headers.get("Content-Range");
      if (contentRange) {
        const match = contentRange.match(/bytes \d+-(\d+)\/(\d+)/);
        if (match) {
          fileSize = parseInt(match[2], 10);
        }
      }
    } catch (error) {
      console.error("Failed to fetch file size:", error);
      return null;
    }
  }

  for (let start = 0; start < fileSize; start += CHUNK_SIZE) {
    const end = Math.min(start + CHUNK_SIZE, fileSize);
    const range = `bytes=${start}-${end - 1}`;

    let chunkBytes = 0;
    downloadPromises.push(
      downloadChunk(format.url, range, (bytesReceived: number) => {
        chunkBytes += bytesReceived;
        onMediaProgress({
          bytes: bytesReceived,
          total: fileSize,
        });
      })
        .then((chunk) => {
          return chunk;
        })
        .catch((error) => {
          console.error(`Failed to download chunk ${start}-${end}:`, error);
          // delete failed chunk
          onMediaProgress({
            bytes: -chunkBytes,
            total: fileSize,
          });
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

async function downloadChunk(
  url: string,
  range: string,
  onProgress: (bytesReceived: number) => void,
  retries = 5
): Promise<ArrayBuffer> {
  const TIMEOUT_MS = 15000;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();

      const timeoutPromise = new Promise<ArrayBuffer>((_, reject) => {
        setTimeout(() => {
          controller.abort();
          reject(new Error("Request timed out"));
        }, TIMEOUT_MS);
      });

      const downloadPromise = async (): Promise<ArrayBuffer> => {
        const response = await corsFetch(url, {
          headers: { "x-corsfix-headers": JSON.stringify({ range }) },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Stream the response and call progress callback for each chunk
        if (response.body) {
          const reader = response.body.getReader();
          const chunks: Uint8Array[] = [];

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              chunks.push(value);
              onProgress(value.byteLength);
            }

            // Combine all chunks into a single ArrayBuffer
            const totalLength = chunks.reduce(
              (sum, chunk) => sum + chunk.byteLength,
              0
            );
            const result = new Uint8Array(totalLength);
            let offset = 0;
            for (const chunk of chunks) {
              result.set(chunk, offset);
              offset += chunk.byteLength;
            }
            return result.buffer;
          } finally {
            reader.releaseLock();
          }
        }
        return new ArrayBuffer(0); // Fallback if no body
      };

      return await Promise.race([downloadPromise(), timeoutPromise]);
    } catch (error) {
      if (attempt === retries - 1) throw error;

      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
  throw new Error("Failed to download chunk after all retries");
}

export async function searchYoutubeVideos(query: string): Promise<Video[]> {
  const res = await corsFetch("https://www.youtube.com/youtubei/v1/search", {
    method: "POST",
    body: JSON.stringify({
      context: {
        client: {
          clientName: "WEB",
          clientVersion: "2.20231121.08.00",
        },
      },
      query,
    }),
    headers: {
      "Content-Type": "application/json",
      "x-corsfix-headers": JSON.stringify({
        origin: "https://www.youtube.com",
      }),
    },
  });

  const data = await res.json();
  const contents =
    data.contents?.twoColumnSearchResultsRenderer?.primaryContents
      ?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents || [];

  return (
    contents
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((item: any) => item.videoRenderer)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => {
        const video = item.videoRenderer;
        return {
          id: video.videoId,
          title: video.title.runs[0].text,
          thumbnail: video.thumbnail.thumbnails[0].url,
          author: video.ownerText.runs[0].text,
          duration: video.lengthText?.simpleText || "",
        };
      })
  );
}
