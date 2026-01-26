"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, Sparkles, Clock } from "lucide-react";
import { PatternBackground } from "@/_components/PatternBackground";
import { useAppState } from "@/store/appState";
import { useAuthGate } from "@/hooks/useAuthGate";

interface BattleMessagePageProps {
  username: string;
  selectedOutfit: any;
  onBack: () => void;
  onSubmit: (message: string) => void;
}

function BattleMessagePage({
  username,
  selectedOutfit,
  onBack,
  onSubmit,
}: BattleMessagePageProps) {
  const [message, setMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (timeLeft > 0 && !isReady) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isReady) {
      // Time's up - auto submit current message or default
      handleSubmit();
    }
  }, [timeLeft, isReady]);

  const handleSubmit = () => {
    const messageToSubmit = message.trim() || "당신을 좋아합니다!";
    setIsReady(true);

    // Simulate waiting for opponent (2 seconds)
    setTimeout(() => {
      onSubmit(messageToSubmit);
    }, 2000);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-purple-200 via-pink-200 to-yellow-200 relative overflow-hidden flex flex-col">
      <PatternBackground type="mixed" />

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
          💝 고백 멘트 작성 💝
        </h1>

        {/* Timer */}
        <div
          className={`flex items-center gap-2 bg-white px-4 py-3 rounded-xl border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)] ${
            timeLeft <= 10 ? "animate-pulse bg-red-100" : ""
          }`}
        >
          <Clock
            className={`w-6 h-6 ${timeLeft <= 10 ? "text-red-500" : "text-purple-500"}`}
            strokeWidth={3}
          />
          <span
            className={`text-2xl font-black ${timeLeft <= 10 ? "text-red-500" : "text-purple-600"}`}
            style={{ fontFamily: "Impact, fantasy" }}
          >
            {timeLeft}초
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-8 p-8 relative z-10">
        {!isReady ? (
          <>
            {/* Left - Outfit Preview */}
            <div className="w-1/3 flex items-center justify-center">
              <div
                className="bg-white p-8 rounded-2xl border-6 border-black shadow-[10px_10px_0px_rgba(0,0,0,0.4)]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, #fff 0px, #fff 12px, #f0f9ff 12px, #f0f9ff 24px)",
                }}
              >
                <div className="text-center mb-4">
                  <h2
                    className="text-xl font-black text-purple-600 [text-shadow:_2px_2px_0_rgb(255_255_255)]"
                    style={{ fontFamily: "Impact, fantasy" }}
                  >
                    선택한 코디
                  </h2>
                </div>

                <div className="relative w-64 h-[28rem] bg-gradient-to-b from-purple-50 to-pink-50 rounded-xl overflow-hidden border-5 border-black">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative w-48 h-[24rem] rounded-2xl border-4 border-black shadow-[3px_3px_0px_rgba(0,0,0,0.3)] overflow-hidden bg-white">
                      {selectedOutfit.previewUrl ? (
                        <img
                          src={selectedOutfit.previewUrl}
                          alt={selectedOutfit.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-gray-200" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Message Input */}
            <div className="flex-1 flex flex-col justify-center">
              <div
                className="bg-white p-8 rounded-2xl border-6 border-black shadow-[10px_10px_0px_rgba(0,0,0,0.4)]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, #fff 0px, #fff 12px, #ffe0f0 12px, #ffe0f0 24px)",
                }}
              >
                <div className="text-center mb-6">
                  <Sparkles
                    className="w-16 h-16 mx-auto mb-4 text-pink-500"
                    strokeWidth={3}
                  />
                  <h2
                    className="text-3xl font-black text-purple-600 mb-2 [text-shadow:_3px_3px_0_rgb(255_255_255)]"
                    style={{ fontFamily: "Impact, fantasy" }}
                  >
                    고백 멘트를 작성하세요!
                  </h2>
                  <p
                    className="text-lg font-bold text-pink-600"
                    style={{ fontFamily: "Impact, fantasy" }}
                  >
                    이 코디를 입고 누군가에게 고백한다면?
                  </p>
                </div>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="예: 당신을 처음 본 순간부터 심장이 두근거렸어요... 💕"
                  maxLength={200}
                  className="w-full h-64 p-6 text-xl font-bold border-5 border-black rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-400 bg-white resize-none"
                  style={{ fontFamily: "Impact, fantasy" }}
                />

                <div className="flex items-center justify-between mt-4">
                  <span
                    className="text-lg font-black text-gray-600"
                    style={{ fontFamily: "Impact, fantasy" }}
                  >
                    {message.length} / 200
                  </span>

                  <button
                    onClick={handleSubmit}
                    disabled={!message.trim()}
                    className="bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-500 px-8 py-4 rounded-xl border-5 border-black shadow-[6px_6px_0px_rgba(0,0,0,0.3)] hover:shadow-[8px_8px_0px_rgba(0,0,0,0.3)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-2">
                      <Heart
                        className="w-8 h-8 text-white"
                        fill="currentColor"
                        strokeWidth={0}
                      />
                      <span
                        className="text-2xl font-black text-white [text-shadow:_2px_2px_0_rgb(0_0_0)]"
                        style={{ fontFamily: "Impact, fantasy" }}
                      >
                        다 골랐다!
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Waiting for opponent
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div
                className="bg-white p-12 rounded-3xl border-6 border-black shadow-[12px_12px_0px_rgba(0,0,0,0.4)]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, #fff 0px, #fff 15px, #fef3c7 15px, #fef3c7 30px)",
                }}
              >
                <div className="animate-bounce mb-4">
                  <Sparkles
                    className="w-20 h-20 mx-auto text-purple-500"
                    strokeWidth={3}
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
          </div>
        )}
      </div>
    </div>
  );
}

export default function BattleMessageRoute() {
  const router = useRouter();
  const { selectedBattleOutfit, setBattleMessage } = useAppState();
  useAuthGate();

  useEffect(() => {
    if (!selectedBattleOutfit) {
      router.replace("/battle/select");
    }
  }, [router, selectedBattleOutfit]);

  if (!selectedBattleOutfit) {
    return null;
  }

  return (
    <BattleMessagePage
      username="플레이어"
      selectedOutfit={selectedBattleOutfit}
      onBack={() => router.push("/battle/select")}
      onSubmit={(message) => {
        setBattleMessage(message);
        router.push("/battle/waiting");
      }}
    />
  );
}
