import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_BASE =
  process.env.API_PROXY_TARGET || "http://localhost:5000/api/v1";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { error: "Missing refresh token" },
      { status: 401 },
    );
  }

  const response = await fetch(`${BACKEND_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json(
      { error: "Refresh failed", detail },
      { status: response.status },
    );
  }

  const data = (await response.json()) as {
    accessToken: string;
    refreshToken?: string;
  };

  const res = NextResponse.json({ success: true });
  res.cookies.set("accessToken", data.accessToken, cookieOptions);
  if (data.refreshToken) {
    res.cookies.set("refreshToken", data.refreshToken, cookieOptions);
  }
  return res;
}
