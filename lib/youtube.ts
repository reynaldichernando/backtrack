import { z } from "zod";

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

export async function fetchVideoInfoRaw(videoId: string): Promise<unknown> {
  // prettier-ignore
  const res = await fetch("https://app.backtrackhq.workers.dev/?https://www.youtube.com/youtubei/v1/player", {
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
      "Origin": "https://www.youtube.com",
      "content-type": "application/json",
      "X-YouTube-Client-Name": "3",
      "X-YouTube-Client-Version": "18.11.34",
      "x-cors-headers": JSON.stringify({
        "user-agent": "com.google.android.youtube/18.11.34 (Linux; U; Android 11) gzip",
        "origin": "https://www.youtube.com",
      }),
    }
  });
  return JSON.parse(await res.text());
}

const RAW_INFO_SCHEMA = z.object({
  videoDetails: z.object({
    videoId: z.string(),
    title: z.string(),
    author: z.string(),
    shortDescription: z.string(),
  }),
  streamingData: z.object({
    // formats: z.object({}).array(), // TODO
    adaptiveFormats: z
      .object({
        itag: z.number(),
        url: z.string(),
        mimeType: z.string(),
        width: z.number().optional(),
        height: z.number().optional(),
        // TODO: support undefined contentLength
        contentLength: z
          .string()
          .refine((s) => s.match(/^\d+$/))
          .transform(Number)
          .optional(),
        quality: z.string().optional(),
      })
      .array(),
  }),
});

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
      quality: f.quality ?? null
    })),
  };
}

export async function downloadMedia(id: string, type: string, quality: string = "medium"): Promise<ArrayBuffer | null> {
  const videoInfo = await fetchVideoInfo(id);
  let formats = videoInfo.formats;

  if (type == "video") {
    formats = videoInfo.formats.filter((f) => f.ext === "webm" && f.vcodec !== "none" && f.quality === quality);
  } else if (type == "audio") {
    formats = videoInfo.formats.filter((f) => f.ext === "webm" && f.acodec !== "none").sort((a, b) => b.filesize! - a.filesize!);
  }

  if (formats.length === 0) {
    return null;
  }

  const format = formats[0];

  if (!format.filesize) {
    return null;
  }

  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
  const downloadPromises: Promise<Response>[] = [];

  for (let start = 0; start < format.filesize; start += CHUNK_SIZE) {
    const end = Math.min(start + CHUNK_SIZE, format.filesize);
    const range = `bytes=${start}-${end - 1}`;

    const downloadPromise = fetch(`https://app.backtrackhq.workers.dev/?${format.url}`, {
      headers: {
        range: range,
      },
    });
    downloadPromises.push(downloadPromise);
  }

  const responses = await Promise.all(downloadPromises);
  const downloadedChunks = await Promise.all(responses.map(res => res.arrayBuffer()));

  return new Blob(downloadedChunks).arrayBuffer();
}