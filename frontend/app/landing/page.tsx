"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Swords, User, Heart, Star, Sparkles, Users } from "lucide-react";
import { PatternBackground } from "@/_components/PatternBackground";
import { useAppState } from "@/store/appState";
import { useAuthGate } from "@/hooks/useAuthGate";
import { fetchWithAuth } from "@/utils/apiClient";

interface LandingPageProps {
  username: string;
  onNavigate: (
    page: "dressup" | "profile" | "battle" | "community" | "vote",
  ) => void;
  deckReady: boolean;
}

function LandingPage({ username, onNavigate, deckReady }: LandingPageProps) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-pink-200 via-cyan-200 to-yellow-200">
      {/* Pattern background like reference images */}
      <PatternBackground type="hearts" />

      {/* Content */}
      <div className="relative z-10 p-4 md:p-8">
        {/* Header */}
        <div className="text-center mb-6 md:mb-12">
          <div
            className="inline-block bg-white p-6 rounded-xl shadow-[6px_6px_0px_rgba(0,0,0,0.4)] border-5 border-black mb-6"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, #fff 0px, #fff 8px, #ffe0f0 8px, #ffe0f0 16px)",
            }}
          >
            <h1
              className="text-5xl font-black text-purple-600 [text-shadow:_3px_3px_0_rgb(255_192_203)]"
              style={{ fontFamily: "Impact, fantasy" }}
            >
              환영해요, {username}님! ★
            </h1>
          </div>
        </div>

        {/* Main Buttons */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-6 gap-4 md:gap-8">
          {/* Dress Up Button */}
          <button
            onClick={() => onNavigate("dressup")}
            className="group relative md:col-span-2 bg-gradient-to-br from-cyan-500 via-teal-500 to-cyan-600 p-6 md:p-10 rounded-xl shadow-[10px_10px_0px_rgba(0,0,0,0.4)] hover:shadow-[12px_12px_0px_rgba(0,0,0,0.4)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all border-6 border-black"
          >
            <div className="relative z-10">
              <div className="bg-white w-28 h-28 rounded-xl mx-auto mb-5 flex items-center justify-center group-hover:scale-110 transition-transform border-5 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)]">
                <Sparkles className="w-16 h-16 text-black" strokeWidth={3} />
              </div>
              <h2
                className="text-4xl font-black text-white mb-2 [text-shadow:_3px_3px_0_rgb(0_0_0)]"
                style={{ fontFamily: "Impact, fantasy" }}
              >
                꾸미기
              </h2>
              <p
                className="text-xl font-bold text-white [text-shadow:_2px_2px_0_rgb(0_0_0)]"
                style={{ fontFamily: "Impact, fantasy" }}
              >
                나만의 스타일!
              </p>
            </div>

            {/* Star decoration */}
            <div className="absolute top-5 right-5">
              <Star
                className="w-10 h-10 text-yellow-300 animate-pulse"
                strokeWidth={3}
                fill="currentColor"
              />
            </div>
            <div className="absolute bottom-5 left-5">
              <Star
                className="w-8 h-8 text-yellow-300 animate-pulse"
                strokeWidth={3}
                fill="currentColor"
                style={{ animationDelay: "0.5s" }}
              />
            </div>
          </button>

          {/* Battle Button */}
          <button
            onClick={() => deckReady && onNavigate("battle")}
            disabled={!deckReady}
            className={`group relative md:col-span-2 bg-gradient-to-br from-pink-500 via-purple-500 to-pink-600 p-6 md:p-10 rounded-xl shadow-[10px_10px_0px_rgba(0,0,0,0.4)] border-6 border-black transition-all ${
              deckReady
                ? "hover:shadow-[12px_12px_0px_rgba(0,0,0,0.4)] hover:translate-x-[-2px] hover:translate-y-[-2px] cursor-pointer"
                : "opacity-50 cursor-not-allowed"
            }`}
          >
            <div className="relative z-10">
              <div className="bg-white w-28 h-28 rounded-xl mx-auto mb-5 flex items-center justify-center group-hover:scale-110 transition-transform border-5 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)]">
                <Swords className="w-16 h-16 text-black" strokeWidth={3} />
              </div>
              <h2
                className="text-4xl font-black text-white mb-2 [text-shadow:_3px_3px_0_rgb(0_0_0)]"
                style={{ fontFamily: "Impact, fantasy" }}
              >
                대결하기
              </h2>
              <p
                className="text-xl font-bold text-white [text-shadow:_2px_2px_0_rgb(0_0_0)]"
                style={{ fontFamily: "Impact, fantasy" }}
              >
                {deckReady ? "친구와 패션 대결!" : "⚠️ 덱을 2개 채워주세요!"}
              </p>
            </div>

            {/* Sparkles decoration */}
            <div className="absolute top-5 right-5">
              <Sparkles
                className="w-10 h-10 text-yellow-300 animate-pulse"
                strokeWidth={3}
              />
            </div>
            <div className="absolute bottom-5 left-5">
              <Sparkles
                className="w-8 h-8 text-yellow-300 animate-pulse"
                strokeWidth={3}
                style={{ animationDelay: "0.5s" }}
              />
            </div>
          </button>

          {/* Vote Button */}
          <button
            onClick={() => onNavigate("vote")}
            className="group relative md:col-span-2 bg-gradient-to-br from-cyan-400 via-blue-400 to-indigo-500 p-6 md:p-10 rounded-xl shadow-[10px_10px_0px_rgba(0,0,0,0.4)] hover:shadow-[12px_12px_0px_rgba(0,0,0,0.4)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all border-6 border-black"
          >
            <div className="relative z-10">
              <div className="bg-white w-28 h-28 rounded-xl mx-auto mb-5 flex items-center justify-center group-hover:scale-110 transition-transform border-5 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)]">
                <Swords className="w-16 h-16 text-black" strokeWidth={3} />
              </div>
              <h2
                className="text-4xl font-black text-white mb-2 [text-shadow:_3px_3px_0_rgb(0_0_0)]"
                style={{ fontFamily: "Impact, fantasy" }}
              >
                투표 하러가기
              </h2>
              <p
                className="text-xl font-bold text-white [text-shadow:_2px_2px_0_rgb(0_0_0)]"
                style={{ fontFamily: "Impact, fantasy" }}
              >
                다른 대결 구경하기
              </p>
            </div>

            <div className="absolute top-5 right-5">
              <Sparkles
                className="w-10 h-10 text-white animate-pulse"
                strokeWidth={3}
              />
            </div>
            <div className="absolute bottom-5 left-5">
              <Sparkles
                className="w-8 h-8 text-white animate-pulse"
                strokeWidth={3}
                style={{ animationDelay: "0.4s" }}
              />
            </div>
          </button>

          {/* Community Button */}
          <button
            onClick={() => onNavigate("community")}
            className="group relative md:col-span-2 md:col-start-2 bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 p-6 md:p-10 rounded-xl shadow-[10px_10px_0px_rgba(0,0,0,0.4)] hover:shadow-[12px_12px_0px_rgba(0,0,0,0.4)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all border-6 border-black"
          >
            <div className="relative z-10">
              <div className="bg-white w-28 h-28 rounded-xl mx-auto mb-5 flex items-center justify-center group-hover:scale-110 transition-transform border-5 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)]">
                <Users className="w-16 h-16 text-black" strokeWidth={3} />
              </div>
              <h2
                className="text-4xl font-black text-white mb-2 [text-shadow:_3px_3px_0_rgb(0_0_0)]"
                style={{ fontFamily: "Impact, fantasy" }}
              >
                커뮤니티
              </h2>
              <p
                className="text-xl font-bold text-white [text-shadow:_2px_2px_0_rgb(0_0_0)]"
                style={{ fontFamily: "Impact, fantasy" }}
              >
                내 코디 공유하기
              </p>
            </div>

            <div className="absolute top-5 right-5">
              <Star
                className="w-10 h-10 text-white animate-pulse"
                strokeWidth={3}
                fill="currentColor"
              />
            </div>
            <div className="absolute bottom-5 left-5">
              <Star
                className="w-8 h-8 text-white animate-pulse"
                strokeWidth={3}
                fill="currentColor"
                style={{ animationDelay: "0.4s" }}
              />
            </div>
          </button>

          {/* Profile Button */}
          <button
            onClick={() => onNavigate("profile")}
            className="group relative md:col-span-2 bg-gradient-to-br from-purple-500 via-yellow-500 to-pink-500 p-6 md:p-10 rounded-xl shadow-[10px_10px_0px_rgba(0,0,0,0.4)] hover:shadow-[12px_12px_0px_rgba(0,0,0,0.4)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all border-6 border-black"
          >
            <div className="relative z-10">
              <div className="bg-white w-28 h-28 rounded-xl mx-auto mb-5 flex items-center justify-center group-hover:scale-110 transition-transform border-5 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)]">
                <User className="w-16 h-16 text-black" strokeWidth={3} />
              </div>
              <h2
                className="text-4xl font-black text-white mb-2 [text-shadow:_3px_3px_0_rgb(0_0_0)]"
                style={{ fontFamily: "Impact, fantasy" }}
              >
                내 프로필
              </h2>
              <p
                className="text-xl font-bold text-white [text-shadow:_2px_2px_0_rgb(0_0_0)]"
                style={{ fontFamily: "Impact, fantasy" }}
              >
                내 스타일 확인하기
              </p>
            </div>

            {/* Heart decoration */}
            <div className="absolute top-5 right-5">
              <Heart
                className="w-10 h-10 text-white animate-bounce"
                fill="currentColor"
                strokeWidth={0}
              />
            </div>
            <div className="absolute bottom-5 left-5">
              <Heart
                className="w-8 h-8 text-white animate-bounce"
                fill="currentColor"
                strokeWidth={0}
                style={{ animationDelay: "0.3s" }}
              />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LandingRoute() {
  const router = useRouter();
  const { deckSlot1, deckSlot2, setSavedOutfits, updateDeck } = useAppState();
  const deckReady = deckSlot1 !== undefined && deckSlot2 !== undefined;
  useAuthGate();

  useEffect(() => {
    if (deckSlot1 && deckSlot2) {
      return;
    }
    const loadDeck = async () => {
      try {
        const res = await fetchWithAuth("/members/me");
        if (!res.ok) return;
        const data = (await res.json()) as {
          deck?: Array<{
            outfitId: number;
            outfitName: string;
            previewUrl: string;
            topId?: number;
            bottomId?: number;
            outerId?: number;
            createdAt?: string;
          }>;
        };
        const outfits = (data.deck ?? []).map((item) => ({
          id: item.outfitId,
          name: item.outfitName,
          previewUrl: item.previewUrl,
          topId: item.topId ?? 0,
          bottomId: item.bottomId ?? 0,
          outerId: item.outerId ?? 0,
          createdAt: item.createdAt ?? "",
        }));
        if (outfits.length === 0) return;
        setSavedOutfits(outfits);
        updateDeck(1, outfits[0]);
        updateDeck(2, outfits[1]);
      } catch {
        // ignore for now
      }
    };
    loadDeck();
  }, [deckSlot1, deckSlot2, setSavedOutfits, updateDeck]);

  return (
    <LandingPage
      username="플레이어"
      deckReady={deckReady}
      onNavigate={(page) => {
        if (page === "dressup") {
          router.push("/dressup");
        } else if (page === "profile") {
          router.push("/profile");
        } else if (page === "battle") {
          router.push("/battle/select");
        } else if (page === "community") {
          router.push("/community");
        } else if (page === "vote") {
          router.push("/battle/vote");
        }
      }}
    />
  );
}
