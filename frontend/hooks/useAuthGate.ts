"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/utils/apiClient";
import { useAppState } from "@/store/appState";

export function useAuthGate(options?: { onRedirect?: () => void }) {
  const router = useRouter();
  const { token, setToken } = useAppState();
  const skipAuth = process.env.NEXT_PUBLIC_SKIP_AUTH === "true";

  useEffect(() => {
    if (skipAuth || token) {
      return;
    }
    options?.onRedirect?.();
    router.replace("/login");
  }, [options, router, setToken, skipAuth, token]);

  return { skipAuth };
}
