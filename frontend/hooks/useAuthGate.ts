"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/utils/apiClient";
import { useAppState } from "@/store/appState";

export function useAuthGate() {
  const router = useRouter();
  const { token, setToken } = useAppState();
  const skipAuth = process.env.NEXT_PUBLIC_SKIP_AUTH === "true";

  useEffect(() => {
    if (skipAuth || token) {
      return;
    }
    let cancelled = false;

    const checkSession = async () => {
      try {
        const res = await fetchWithAuth("/members/me");
        if (cancelled) return;
        if (res.ok) {
          setToken("cookie");
        } else {
          router.replace("/login");
        }
      } catch {
        if (!cancelled) {
          router.replace("/login");
        }
      }
    };

    checkSession();

    return () => {
      cancelled = true;
    };
  }, [router, setToken, skipAuth, token]);

  return { skipAuth };
}
