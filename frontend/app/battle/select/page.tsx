"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Heart, Clock } from "lucide-react";
import { PatternBackground } from "@/_components/PatternBackground";
import { useAppState } from "@/store/appState";
import { useAuthGate } from "@/hooks/useAuthGate";
import { SavedOutfit } from "@/types/models";
import { fetchWithAuth } from "@/utils/apiClient";

interface BattleSelectPageProps {
  username: string;
  savedOutfits: SavedOutfit[];
  onBack: () => void;
  onSelect: (outfit: SavedOutfit) => Promise<void>;
}

function BattleSelectPage({
  username,
  savedOutfits,
  onBack,
  onSelect,
}: BattleSelectPageProps) {
  const [selectedOutfit, setSelectedOutfit] = useState<SavedOutfit | null>(
    null,
  );
  const [timeLeft, setTimeLeft] = useState(5);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (timeLeft > 0 && !isReady) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isReady) {
      // Time's up - auto select current outfit or first one
      handleConfirm();
    }
  }, [timeLeft, isReady]);

  const handleConfirm = async () => {
    if (savedOutfits.length === 0) return; // 덱이 비어있으면 진행 불가

    const outfitToSelect = selectedOutfit || savedOutfits[0];
    setIsReady(true);
    await onSelect(outfitToSelect);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-yellow-200 relative overflow-hidden flex flex-col">
      <PatternBackground type="hearts" />

      {/* Header */}
      <div className="relative z-10 bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-500 p-4 shadow-[0_6px_0_rgba(0,0,0,0.3)] border-b-6 border-black flex items-center justify-between flex-shrink-0">
        <button
          onClick={onBack}
          className="bg-white hover:bg-gray-100 p-3 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,0.3)] hover:shadow-[5px_5px_0px_rgba(0,0,0,0.3)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all border-4 border-black"
        >
          <ArrowLeft className="w-6 h-6 text-black" strokeWidth={3} />
        </button>

        <h1
          className="text-3xl font-black text-white [text-shadow:_4px_4px_0_rgb(0_0_0)]"
          style={{ fontFamily: "Impact, fantasy" }}
        >
          💖 대결할 코디 선택 💖
        </h1>

        {/* Timer */}
        <div
          className={`flex items-center gap-2 bg-white px-4 py-3 rounded-xl border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)] ${timeLeft <= 2 ? "animate-pulse bg-red-100" : ""
            }`}
        >
          <Clock
            className={`w-6 h-6 ${timeLeft <= 2 ? "text-red-500" : "text-purple-500"}`}
            strokeWidth={3}
          />
          <span
            className={`text-2xl font-black ${timeLeft <= 2 ? "text-red-500" : "text-purple-600"}`}
            style={{ fontFamily: "Impact, fantasy" }}
          >
            {timeLeft}초
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
        {!isReady ? (
          <div className="max-w-6xl w-full">
            {/* Title */}
            <div className="text-center mb-8">
              <p
                className="text-2xl font-black text-purple-600 [text-shadow:_2px_2px_0_rgb(255_255_255)]"
                style={{ fontFamily: "Impact, fantasy" }}
              >
                대결에 사용할 코디를 선택하세요! ✨
              </p>
              {savedOutfits.length === 0 && (
                <p
                  className="text-lg font-bold text-red-600 mt-2"
                  style={{ fontFamily: "Impact, fantasy" }}
                >
                  ⚠️ 덱에 코디가 없습니다! 프로필에서 덱을 구성해주세요.
                </p>
              )}
            </div>

            {/* Outfit Selection Grid */}
            <div className="grid grid-cols-2 gap-8 mb-8 max-w-4xl mx-auto">
              {savedOutfits.map((outfit) => (
                <button
                  key={outfit.id}
                  onClick={() => setSelectedOutfit(outfit)}
                  className={`relative bg-white rounded-2xl border-6 shadow-[8px_8px_0px_rgba(0,0,0,0.4)] transition-all hover:scale-105 p-6 ${selectedOutfit?.id === outfit.id
                    ? "border-pink-500 ring-8 ring-pink-400 scale-105"
                    : "border-black hover:shadow-[10px_10px_0px_rgba(0,0,0,0.4)]"
                    }`}
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(45deg, #fff 0px, #fff 12px, #ffe0f0 12px, #ffe0f0 24px)",
                  }}
                >
                  {/* Selected Check Mark */}
                  {selectedOutfit?.id === outfit.id && (
                    <div className="absolute -top-4 -right-4 bg-pink-500 rounded-full p-3 border-5 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)] z-10">
                      <Check className="w-8 h-8 text-white" strokeWidth={4} />
                    </div>
                  )}

                  {/* Outfit Preview */}
                  <div className="relative w-full h-80 bg-gradient-to-b from-purple-50 to-pink-50 rounded-xl overflow-hidden border-4 border-black mb-4">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative w-40 h-[18rem] rounded-2xl border-4 border-black shadow-[3px_3px_0px_rgba(0,0,0,0.3)] overflow-hidden bg-white">
                        {outfit.previewUrl ? (
                          <img
                            src={outfit.previewUrl}
                            alt={outfit.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-gray-200" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Outfit Name */}
                  <h3
                    className="text-xl font-black text-purple-600 text-center [text-shadow:_2px_2px_0_rgb(255_255_255)]"
                    style={{ fontFamily: "Impact, fantasy" }}
                  >
                    {outfit.name}
                  </h3>
                </button>
              ))}
            </div>

            {/* Confirm Button */}
            <div className="flex justify-center">
              <button
                onClick={handleConfirm}
                disabled={!selectedOutfit}
                className="bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-500 px-12 py-6 rounded-2xl border-6 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.4)] hover:shadow-[10px_10px_0px_rgba(0,0,0,0.4)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-3">
                  <Heart
                    className="w-10 h-10 text-white"
                    fill="currentColor"
                    strokeWidth={0}
                  />
                  <span
                    className="text-3xl font-black text-white [text-shadow:_3px_3px_0_rgb(0_0_0)]"
                    style={{ fontFamily: "Impact, fantasy" }}
                  >
                    다 골랐다!
                  </span>
                </div>
              </button>
            </div>
          </div>
        ) : (
          // Waiting for opponent
          <div className="text-center">
            <div
              className="bg-white p-12 rounded-3xl border-6 border-black shadow-[12px_12px_0px_rgba(0,0,0,0.4)]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, #fff 0px, #fff 15px, #fef3c7 15px, #fef3c7 30px)",
              }}
            >
              <div className="animate-bounce mb-4">
                <Heart
                  className="w-20 h-20 mx-auto text-pink-500"
                  fill="currentColor"
                  strokeWidth={0}
                />
              </div>
              <h2
                className="text-4xl font-black text-purple-600 [text-shadow:_3px_3px_0_rgb(255_192_203)]"
                style={{ fontFamily: "Impact, fantasy" }}
              >
                상대방을 기다리는 중...
              </h2>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BattleSelectRoute() {
  const router = useRouter();
  const {
    deckSlot1,
    deckSlot2,
    selectBattleOutfit,
    setBattleSessionId,
  } = useAppState();
  const savedOutfits = [deckSlot1, deckSlot2].filter(
    (outfit): outfit is SavedOutfit => outfit !== undefined,
  );
  const { skipAuth } = useAuthGate();

  useEffect(() => {
    if (!deckSlot1 || !deckSlot2) {
      router.replace("/landing");
    }
  }, [deckSlot1, deckSlot2, router, skipAuth]);

  return (
    <BattleSelectPage
      username="플레이어"
      savedOutfits={savedOutfits}
      onBack={() => router.push("/landing")}
      onSelect={async (outfit) => {
        selectBattleOutfit(outfit);
        setBattleSessionId(null);
        const outfitAId = outfit.id;
        const outfitBId =
          deckSlot1?.id === outfit.id ? deckSlot2?.id : deckSlot1?.id;
        if (!outfitBId) {
          router.replace("/landing");
          return;
        }
        // 1. 배틀 덱 순서 업데이트 (선택한 것이 1라운드)
        await fetchWithAuth("/battle/deck", {
          method: "PUT",
          body: JSON.stringify({
            outfit1Id: outfitAId,
            outfit2Id: outfitBId,
          }),
        });

        // 2. 매칭 시작 요청 (URL: /start 유지, Body는 무시되지만 호환성 위해 유지)
        await fetchWithAuth("/battle/match/start", {
          method: "POST",
          body: JSON.stringify({
            outfit1Id: outfitAId,
            outfit2Id: outfitBId,
          }),
        });
        router.push("/battle/waiting");
      }}
    />
  );
}
