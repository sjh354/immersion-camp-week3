import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const resolveBackendBase = () => {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (configured && configured.startsWith("http")) {
    return configured;
  }
  return process.env.API_PROXY_TARGET || "API_PROXY_TARGET not set";
};

export async function POST(request: Request) {
  const { sourceUrl } = (await request.json()) as { sourceUrl?: string };
  if (!sourceUrl) {
    return NextResponse.json(
      { error: "Missing sourceUrl" },
      { status: 400 },
    );
  }

  const imageResponse = await fetch(sourceUrl);
  if (!imageResponse.ok) {
    return NextResponse.json(
      { error: "Failed to download source image" },
      { status: 502 },
    );
  }

  const blob = await imageResponse.blob();
  const file = new File([blob], "outfit_preview.jpg", {
    type: blob.type || "image/jpeg",
  });
  const formData = new FormData();
  formData.append("file", file);

  const backendBase = resolveBackendBase().replace(/\/$/, "");
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  const headers = new Headers();
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const uploadResponse = await fetch(`${backendBase}/images/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!uploadResponse.ok) {
    const detail = await uploadResponse.text();
    return NextResponse.json(
      { error: "Failed to upload image", detail },
      { status: uploadResponse.status },
    );
  }

  const data = (await uploadResponse.json()) as { imageUrl?: string };
  return NextResponse.json({ imageUrl: data.imageUrl });
}
