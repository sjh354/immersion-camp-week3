import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const resolveBackendBase = () => {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (configured && configured.startsWith("http")) {
    return configured;
  }
  return process.env.API_PROXY_TARGET || "API_PROXY_TARGET not set";
};

const forwardRequest = async (
  request: Request,
  params: Promise<{ path?: string[] }>,
) => {
  const backendBase = resolveBackendBase().replace(/\/$/, "");
  const resolvedParams = await params;
  const path = resolvedParams.path?.join("/") ?? "";
  const url = new URL(`${backendBase}/${path}`);
  const incomingUrl = new URL(request.url);
  incomingUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("origin");
  headers.delete("referer");

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  const response = await fetch(url.toString(), init);
  const responseBody = await response.arrayBuffer();

  return new NextResponse(responseBody, {
    status: response.status,
    headers: response.headers,
  });
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  return forwardRequest(request, params);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  return forwardRequest(request, params);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  return forwardRequest(request, params);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  return forwardRequest(request, params);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  return forwardRequest(request, params);
}

export async function OPTIONS(
  request: Request,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  return forwardRequest(request, params);
}
