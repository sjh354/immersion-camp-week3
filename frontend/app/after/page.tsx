"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Send, Clock } from "lucide-react";
import { PatternBackground } from "@/_components/PatternBackground";
import { useAppState } from "@/store/appState";
import { useAuthGate } from "@/hooks/useAuthGate";
import { SavedOutfit } from "@/types/models";

interface AfterRequestPageProps {
  username: string;
  remainingOutfit: SavedOutfit;
  onSubmit: (message: string) => void;
}

function AfterRequestPage({
  username,
  remainingOutfit,
  onSubmit,
}: AfterRequestPageProps) {
  const [message, setMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      // Time's up - auto submit
      handleSubmit();
    }
  }, [timeLeft]);

  const handleSubmit = () => {
    if (message.trim()) {
      onSubmit(message);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-yellow-200 relative overflow-hidden flex flex-col">
      <PatternBackground type="hearts" />

      {/* Header */}
      <div className="relative z-10 bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-500 p-4 shadow-[0_6px_0_rgba(0,0,0,0.3)] border-b-6 border-black flex items-center justify-between flex-shrink-0">
        <div className="w-12"></div>

        <h1
          className="text-3xl font-black text-white [text-shadow:_4px_4px_0_rgb(0_0_0)]"
          style={{ fontFamily: "Impact, fantasy" }}
        >
          💖 애프터 신청하기 💖
        </h1>

        {/* Timer */}
        <div
          className={`flex items-center gap-2 bg-white px-4 py-3 rounded-xl border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)] ${
            timeLeft <= 5 ? "animate-pulse bg-red-100" : ""
          }`}
        >
          <Clock
            className={`w-6 h-6 ${timeLeft <= 5 ? "text-red-500" : "text-purple-500"}`}
            strokeWidth={3}
          />
          <span
            className={`text-2xl font-black ${timeLeft <= 5 ? "text-red-500" : "text-purple-600"}`}
            style={{ fontFamily: "Impact, fantasy" }}
          >
            {timeLeft}초
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10 overflow-y-auto">
        <div className="max-w-4xl w-full space-y-8">
          {/* Victory Message */}
          <div className="text-center animate-bounce">
            <h2
              className="text-5xl font-black text-yellow-600 [text-shadow:_4px_4px_0_rgb(255_255_255)] mb-2"
              style={{ fontFamily: "Impact, fantasy" }}
            >
              🎉 대결 승리! 🎉
            </h2>
            <p
              className="text-2xl font-black text-purple-600 [text-shadow:_2px_2px_0_rgb(255_255_255)]"
              style={{ fontFamily: "Impact, fantasy" }}
            >
              남은 코디로 애프터를 신청하세요!
            </p>
          </div>

          {/* Remaining Outfit Display */}
          <div
            className="bg-white rounded-2xl border-6 border-black shadow-[10px_10px_0px_rgba(0,0,0,0.4)] p-8"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, #fff 0px, #fff 12px, #fef3c7 12px, #fef3c7 24px)",
            }}
          >
            <h3
              className="text-2xl font-black text-yellow-600 text-center mb-6 [text-shadow:_2px_2px_0_rgb(255_255_255)]"
              style={{ fontFamily: "Impact, fantasy" }}
            >
              🎴 남은 코디
            </h3>

            <div className="relative w-full h-96 bg-gradient-to-b from-purple-50 to-pink-50 rounded-xl overflow-hidden border-5 border-black mb-4">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-48 h-80">
                  <div className="absolute inset-0 rounded-2xl border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)] overflow-hidden bg-white">
                    {remainingOutfit.previewUrl ? (
                      <img
                        src={remainingOutfit.previewUrl}
                        alt={remainingOutfit.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-200" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <p
              className="text-xl font-black text-purple-600 text-center"
              style={{ fontFamily: "Impact, fantasy" }}
            >
              {remainingOutfit.name}
            </p>
          </div>

          {/* Message Input */}
          <div
            className="bg-white rounded-2xl border-6 border-black shadow-[10px_10px_0px_rgba(0,0,0,0.4)] p-8"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, #fff 0px, #fff 12px, #ffe0f0 12px, #ffe0f0 24px)",
            }}
          >
            <h3
              className="text-2xl font-black text-pink-600 text-center mb-4 [text-shadow:_2px_2px_0_rgb(255_255_255)]"
              style={{ fontFamily: "Impact, fantasy" }}
            >
              💬 애프터 신청 멘트
            </h3>
            <p
              className="text-sm font-bold text-gray-600 text-center mb-6"
              style={{ fontFamily: "Impact, fantasy" }}
            >
              진심 어린 멘트를 작성하면 AI가 판단합니다!
              <br />
              (긍정적인 키워드를 10자 이상 포함하세요)
            </p>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="예: 오늘 정말 멋진 시간이었어요! 다음에 커피 한 잔 하면서 더 이야기 나누고 싶어요 ☕"
              className="w-full h-40 px-6 py-4 text-xl font-bold border-5 border-black rounded-xl focus:outline-none focus:ring-6 focus:ring-pink-400 resize-none bg-white"
              style={{ fontFamily: "Impact, fantasy" }}
              maxLength={200}
            />
            <div className="text-right mt-2">
              <span
                className={`text-lg font-bold ${message.length >= 10 ? "text-green-600" : "text-gray-400"}`}
                style={{ fontFamily: "Impact, fantasy" }}
              >
                {message.length} / 200자
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={message.trim().length === 0}
              className="bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-500 px-16 py-8 rounded-2xl border-6 border-black shadow-[10px_10px_0px_rgba(0,0,0,0.4)] hover:shadow-[12px_12px_0px_rgba(0,0,0,0.4)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-4">
                <Send className="w-12 h-12 text-white" strokeWidth={3} />
                <span
                  className="text-4xl font-black text-white [text-shadow:_4px_4px_0_rgb(0_0_0)]"
                  style={{ fontFamily: "Impact, fantasy" }}
                >
                  애프터 신청!
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AfterRequestRoute() {
  const router = useRouter();
  const { deckSlot1, deckSlot2, selectedBattleOutfit, submitAfterMessage } =
    useAppState();
  useAuthGate();

  const remainingOutfit =
    selectedBattleOutfit?.id === deckSlot1?.id ? deckSlot2 : deckSlot1;

  useEffect(() => {
    if (!selectedBattleOutfit || !deckSlot1 || !deckSlot2 || !remainingOutfit) {
      router.replace("/landing");
    }
  }, [deckSlot1, deckSlot2, remainingOutfit, router, selectedBattleOutfit]);

  if (!remainingOutfit) {
    return null;
  }

  return (
    <AfterRequestPage
      username="플레이어"
      remainingOutfit={remainingOutfit}
      onSubmit={(message) => {
        submitAfterMessage(message);
        router.push("/result");
      }}
    />
  );
}
