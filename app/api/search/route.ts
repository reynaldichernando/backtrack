import { NextRequest } from "next/server";
import { search } from "@navetacandra/ddg";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query) {
    return Response.json({ error: "No query provided" });
  }

  const result = await search({ query: `${query} site:youtube.com` }, "video");
  return Response.json({ data: result.results });
}