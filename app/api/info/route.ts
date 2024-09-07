import { fetchVideoInfo } from "@/lib/youtube";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return Response.json({ error: "No id provided" }, { status: 400 });
  }

  const videoInfo = await fetchVideoInfo(id);

  return Response.json({formats: videoInfo.formats});
}