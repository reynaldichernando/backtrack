import { fetchVideoInfo, FormatInfo } from "@/lib/youtube";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  let {id, type, start, end, resolution} = await request.json();

  if (!id) {
    return Response.json({ error: "No id provided" }, { status: 400 });
  }

  // default resolution to 360p
  resolution = resolution ?? 360;

  // refetch video info since format url is throttled based on request's IP address
  const videoInfo = await fetchVideoInfo(id);
  let formats: FormatInfo[] = [];
  if (type == "video") {
    formats = videoInfo.formats.filter((f) => f.ext === "webm" && f.vcodec !== "none" && f.height === resolution); 
  } else if (type == "audio") {
    formats = videoInfo.formats.filter((f) => f.ext === "webm" && f.acodec !== "none").sort((a, b) => b.filesize! - a.filesize!);
  }

  if (formats.length === 0) {
    return Response.json({ error: "Format not found" }, { status: 404 });
  }

  const format = formats[0];

  start = start ?? 0;
  end = end ?? format.filesize;
  
  let range = `bytes=${start}-${end - 1}`;

  const res = await fetch(format.url, {
    headers: {
      range: range,
    },
  });

  const headers = new Headers({
    "cache-control": "public, immutable, max-age=31536000",
  });
  const contentType = res.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
    headers.set("content-length", (end - start).toString());
  }
  return new Response(res.body, { headers });
}