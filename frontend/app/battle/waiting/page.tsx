"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Star, Sparkles } from "lucide-react";
import { PatternBackground } from "@/_components/PatternBackground";
import { useAppState } from "@/store/appState";
import { useAuthGate } from "@/hooks/useAuthGate";
import { fetchWithAuth } from "@/utils/apiClient";

interface BattleWaitingPageProps {
  username: string;
  onReady: () => void;
}

function BattleWaitingPage({ username, onReady }: BattleWaitingPageProps) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    return () => {
      clearInterval(interval);
    };
  }, [onReady]);

  return (
    <div className="h-screen bg-gradient-to-br from-yellow-200 via-pink-200 to-purple-200 relative overflow-hidden flex flex-col items-center justify-center">
      <PatternBackground type="stars" />

      <div className="relative z-10 text-center">
        {/* Animated Icons */}
        <div className="mb-8 relative">
          <div className="flex items-center justify-center gap-8">
            <div className="animate-bounce" style={{ animationDelay: "0s" }}>
              <Heart
                className="w-20 h-20 text-pink-500"
                fill="currentColor"
                strokeWidth={0}
              />
            </div>
            <div className="animate-bounce" style={{ animationDelay: "0.2s" }}>
              <Star
                className="w-24 h-24 text-yellow-500"
                fill="currentColor"
                strokeWidth={0}
              />
            </div>
            <div className="animate-bounce" style={{ animationDelay: "0.4s" }}>
              <Sparkles className="w-20 h-20 text-purple-500" strokeWidth={3} />
            </div>
          </div>
        </div>

        {/* Title */}
        <div
          className="bg-white p-10 rounded-3xl border-6 border-black shadow-[12px_12px_0px_rgba(0,0,0,0.4)] mb-8"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #fff 0px, #fff 15px, #fef3c7 15px, #fef3c7 30px)",
          }}
        >
          <h1
            className="text-5xl font-black text-purple-600 mb-4 [text-shadow:_4px_4px_0_rgb(255_192_203)]"
            style={{ fontFamily: "Impact, fantasy" }}
          >
            상대방을 기다리는 중{dots}
          </h1>
          <p
            className="text-2xl font-black text-pink-600"
            style={{ fontFamily: "Impact, fantasy" }}
          >
            곧 대결이 시작됩니다! 💖
          </p>
        </div>

        {/* Loading Animation */}
        <div className="flex justify-center gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full border-3 border-black animate-pulse"
              style={{
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BattleWaitingRoute() {
  const router = useRouter();
  const { selectedBattleOutfit, setBattleSessionId } = useAppState();
  const isDev = process.env.NODE_ENV === "development";
  const matchedRef = useRef(false);
  const redirectingRef = useRef(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cancelInFlightRef = useRef(false);
  const handleAuthRedirect = useCallback(() => {
    redirectingRef.current = true;
  }, []);
  useAuthGate({ onRedirect: handleAuthRedirect });

  useEffect(() => {
    if (!selectedBattleOutfit) {
      redirectingRef.current = true;
      router.replace("/battle/select");
    }
  }, [router, selectedBattleOutfit]);

  useEffect(() => {
    let cancelled = false;
    const pollStatus = async () => {
      try {
        const res = await fetchWithAuth("/battle/match/status");
        if (!res.ok) return;
        const data = (await res.json()) as {
          status: "MATCHING" | "MATCHED" | "NONE";
          sessionId?: number;
        };
        if (cancelled) return;
        if (data.status === "MATCHED" && data.sessionId) {
          matchedRef.current = true;
          setBattleSessionId(data.sessionId);
          router.push("/battle/message");
        }
      } catch {
        // ignore for now
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 2000);
    pollingIntervalRef.current = interval;
    return () => {
      cancelled = true;
      clearInterval(interval);
      pollingIntervalRef.current = null;
      if (!matchedRef.current && !redirectingRef.current && !isDev) {
        void fetchWithAuth("/battle/match/cancel", { method: "POST" });
      }
    };
  }, [router, setBattleSessionId]);

  const handleCancel = async () => {
    if (cancelInFlightRef.current) return;
    cancelInFlightRef.current = true;
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    try {
      await fetchWithAuth("/battle/match/cancel", { method: "POST" });
    } finally {
      matchedRef.current = true;
      router.replace("/landing");
    }
  };

  return (
    <div className="relative">
      <BattleWaitingPage
        username="플레이어"
        onReady={() => router.push("/battle/message")}
      />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20">
        <button
          onClick={handleCancel}
          className="bg-white px-6 py-3 rounded-xl border-4 border-black font-black text-pink-600 shadow-[6px_6px_0px_rgba(0,0,0,0.3)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
        >
          매칭 취소
        </button>
      </div>
    </div>
  );
}
