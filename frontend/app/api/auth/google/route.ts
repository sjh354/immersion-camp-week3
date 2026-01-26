import { NextResponse } from "next/server";

const BACKEND_BASE =
  process.env.API_PROXY_TARGET || "http://localhost:5000/api/v1";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

export async function POST(request: Request) {
  const { idToken } = (await request.json()) as { idToken?: string };

  if (!idToken) {
    return NextResponse.json(
      { error: "Missing idToken" },
      { status: 400 },
    );
  }

  const response = await fetch(`${BACKEND_BASE}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json(
      { error: "Login failed", detail },
      { status: response.status },
    );
  }

  const data = (await response.json()) as {
    accessToken: string;
    refreshToken: string;
    isNewMember: boolean;
  };

  const res = NextResponse.json({ isNewMember: data.isNewMember });
  res.cookies.set("accessToken", data.accessToken, cookieOptions);
  res.cookies.set("refreshToken", data.refreshToken, cookieOptions);
  return res;
}
