"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { useAppState } from "@/store/appState";

export default function LoginRoute() {
  const router = useRouter();
  const { token } = useAppState();

  const GOOGLE_CLIENT_ID =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";

  useEffect(() => {
    if (token) {
      router.replace("/landing");
    }
  }, [router, token]);

  return (
    <div
      className="min-h-screen relative overflow-hidden bg-gradient-to-br from-pink-200 via-pink-300 to-pink-400"
      style={{
        backgroundImage: "url('/background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <GoogleLoginSunButton />
      </GoogleOAuthProvider>

      <div className="relative z-100 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md text-center">
          <img
            src="/login_text.png"
            alt=""
            className="mx-auto mt-6 w-64 max-w-full animate-login-text "
          />
        </div>
      </div>
    </div>
  );
}

function GoogleLoginSunButton() {
  const router = useRouter();
  const { setSessionTokens } = useAppState();
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const res = await fetch("/api/v1/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: tokenResponse.access_token,
        }),
      });
      if (!res.ok) throw new Error("구글 로그인에 실패했습니다.");
      const data = (await res.json()) as {
        isNewMember: boolean;
        accessToken: string;
        refreshToken: string;
      };
      setSessionTokens(data.accessToken, data.refreshToken);
      if (data.isNewMember) {
        router.push("/login/set");
      } else {
        router.push("/landing");
      }
    },
    onError: () => console.log("Google 로그인에 실패했습니다."),
    scope: "openid email profile",
  });

  return (
    <button
      type="button"
      onClick={() => handleGoogleLogin()}
      className="absolute z-101 bottom-0 left-1/2 -translate-x-1/2 animate-login-sun"
      aria-label="Google 로그인"
    >
      <img src="/login_sun.png" alt="" className="w-48" />
    </button>
  );
}
