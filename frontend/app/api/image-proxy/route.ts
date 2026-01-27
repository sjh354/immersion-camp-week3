import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");
  if (!targetUrl) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const upstream = await fetch(targetUrl);
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: upstream.status || 502 },
    );
  }

  const contentType =
    upstream.headers.get("content-type") || "application/octet-stream";
  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=300",
    },
  });
}
