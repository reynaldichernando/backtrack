import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

/* ──────────────────────────────────────────
   1.  Initialise (load once, reuse forever)
   ────────────────────────────────────────── */
let _ffmpeg: FFmpeg | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (_ffmpeg) return _ffmpeg;

  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

  _ffmpeg = new FFmpeg();
  await _ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  return _ffmpeg;
}

/* ──────────────────────────────────────────
   2.  Split MP4 → video-only MP4  +  audio-only M4A
   ────────────────────────────────────────── */
export async function splitMediaToArrayBuffers(
  media: ArrayBuffer,
  filename = "input.mp4"
): Promise<{ video: ArrayBuffer; audio: ArrayBuffer }> {
  const ff = await getFFmpeg();

  // timestamped names avoid collisions in concurrent calls
  const ts = Date.now();
  const vidOut = `video_${ts}.mp4`; // H-264 track only
  const audOut = `audio_${ts}.m4a`; // AAC track only (still ISO-BMFF)

  await ff.writeFile(filename, new Uint8Array(media));

  /* ---------- video: copy H-264 into its own MP4 ---------- */
  await ff.exec([
    "-i",
    filename,
    "-map",
    "0:v:0", // first video stream only
    "-c:v",
    "copy",
    "-an", // strip audio
    vidOut,
  ]);

  /* ---------- audio: copy AAC into its own file ---------- */
  await ff.exec([
    "-i",
    filename,
    "-map",
    "0:a:0", // first audio stream only
    "-c:a",
    "copy",
    "-vn", // strip video
    audOut,
  ]);

  /* ---------- read results ---------- */
  const vidU8 = (await ff.readFile(vidOut)) as Uint8Array;
  const audU8 = (await ff.readFile(audOut)) as Uint8Array;

  // create new ArrayBuffers (simplest way to satisfy the strict type)
  const video = new Uint8Array(vidU8).buffer;
  const audio = new Uint8Array(audU8).buffer;

  /* ---------- tidy up virtual FS ---------- */
  await ff.deleteFile(filename);
  await ff.deleteFile(vidOut);
  await ff.deleteFile(audOut);

  return { video, audio };
}
