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

  if (refreshToken) {
    await fetch(`${BACKEND_BASE}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
  }

  const res = NextResponse.json({ message: "logged out" });
  res.cookies.set("accessToken", "", { ...cookieOptions, maxAge: 0 });
  res.cookies.set("refreshToken", "", { ...cookieOptions, maxAge: 0 });
  return res;
}
