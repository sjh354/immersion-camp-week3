"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart, Gamepad2, ArrowLeft } from "lucide-react";
import { PatternBackground } from "@/_components/PatternBackground";
import { motion } from "motion/react";
import { useAppState } from "@/store/appState";
import { useAuthGate } from "@/hooks/useAuthGate";
import { SavedOutfit } from "@/types/models";

export interface ResultPageProps {
  player1: {
    username: string;
    outfit: {
      name: string;
      previewUrl: string;
    };
  };
  player2: {
    username: string;
    outfit: {
      name: string;
      previewUrl: string;
    };
  };
  isWinner: boolean;
  isAfterSuccess: boolean;
  onBack: () => void;
}

export function ResultPage({
  player1,
  player2,
  isWinner,
  isAfterSuccess,
  onBack,
}: ResultPageProps) {
  // 최종 결과 결정: 승자가 아니거나, 승자이지만 애프터 실패한 경우 패배
  const finalSuccess = isAfterSuccess;

  return (
    <div className="h-screen bg-gradient-to-br from-purple-200 via-pink-200 to-yellow-200 relative overflow-hidden flex flex-col">
      <PatternBackground type={finalSuccess ? "hearts" : "stars"} />

      {/* Header */}
      <div className="relative z-10 bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-500 p-4 shadow-[0_6px_0_rgba(0,0,0,0.3)] border-b-6 border-black flex items-center justify-between flex-shrink-0">
        <button
          onClick={onBack}
          className="bg-white hover:bg-gray-100 p-3 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,0.3)] hover:shadow-[5px_5px_0px_rgba(0,0,0,0.3)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all border-4 border-black"
        >
          <ArrowLeft className="w-6 h-6 text-black" strokeWidth={3} />
        </button>

        <h1
          className="text-4xl font-black text-white [text-shadow:_4px_4px_0_rgb(0_0_0)]"
          style={{ fontFamily: "Impact, fantasy" }}
        >
          {finalSuccess ? "💖 대결 결과 💖" : "😢 대결 결과 😢"}
        </h1>

        <div className="w-12"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10 overflow-y-auto">
        {finalSuccess ? (
          // Victory - Date Scene
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-5xl w-full my-auto"
          >
            <div
              className="bg-gradient-to-br from-pink-100 to-purple-100 p-8 rounded-3xl border-8 border-black shadow-[16px_16px_0px_rgba(0,0,0,0.5)]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, transparent 0px, transparent 20px, rgba(255,182,193,0.2) 20px, rgba(255,182,193,0.2) 40px)",
              }}
            >
              <h2
                className="text-6xl font-black text-center mb-8 text-pink-600 [text-shadow:_4px_4px_0_rgb(255_255_255)]"
                style={{ fontFamily: "Impact, fantasy" }}
              >
                {isWinner ? "🎉 승리! 🎉" : "😢 패배... 😢"}
              </h2>

              <div className="bg-white p-8 rounded-2xl border-6 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.3)] mb-8">
                <p
                  className="text-3xl font-black text-center text-purple-600 mb-4"
                  style={{ fontFamily: "Impact, fantasy" }}
                >
                  고백에 성공했어요! 💕
                </p>
                <p
                  className="text-xl font-bold text-center text-gray-600"
                  style={{ fontFamily: "Impact, fantasy" }}
                >
                  이제 데이트를 떠나볼까요?
                </p>
              </div>

              {/* Date Scene */}
              <div className="bg-gradient-to-b from-sky-200 to-pink-200 p-8 rounded-2xl border-6 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.3)]">
                <div className="relative h-96 flex items-center justify-center">
                  {/* Background - Park/Cafe Scene */}
                  <div className="absolute inset-0 flex items-end justify-center">
                    {/* Ground */}
                    <div className="w-full h-32 bg-green-400 border-t-5 border-black"></div>
                    {/* Sky elements */}
                    <div className="absolute top-10 right-20 text-6xl">☀️</div>
                    <div className="absolute top-20 left-20 text-4xl">☁️</div>
                    <div className="absolute top-32 right-40 text-4xl">☁️</div>
                  </div>

                  {/* Characters holding hands */}
                  <div className="relative z-10 flex items-end gap-12">
                    {/* Player Character */}
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="text-center"
                    >
                      <div className="relative w-32 h-48">
                        {/* Head */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-yellow-200 rounded-full border-5 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)]"></div>

                        {/* Outfit Preview */}
                        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-24 h-28 rounded-xl border-5 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)] overflow-hidden bg-white">
                          {player1.outfit.previewUrl ? (
                            <img
                              src={player1.outfit.previewUrl}
                              alt={player1.outfit.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-yellow-200" />
                          )}
                        </div>

                        {/* Legs */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-2">
                          <div className="w-3 h-12 bg-gray-800 border-3 border-black"></div>
                          <div className="w-3 h-12 bg-gray-800 border-3 border-black"></div>
                        </div>
                      </div>
                      <div className="mt-2 bg-white px-4 py-2 rounded-lg border-4 border-black shadow-[3px_3px_0px_rgba(0,0,0,0.3)]">
                        <span
                          className="text-lg font-black text-purple-600"
                          style={{ fontFamily: "Impact, fantasy" }}
                        >
                          {player1.username}
                        </span>
                      </div>
                    </motion.div>

                    {/* Hearts in between */}
                    <div className="flex flex-col gap-2 items-center justify-center">
                      <Heart
                        className="w-12 h-12 text-pink-500 animate-pulse"
                        fill="currentColor"
                      />
                      <Heart
                        className="w-8 h-8 text-red-500 animate-pulse"
                        fill="currentColor"
                        style={{ animationDelay: "0.2s" }}
                      />
                      <Heart
                        className="w-10 h-10 text-pink-400 animate-pulse"
                        fill="currentColor"
                        style={{ animationDelay: "0.4s" }}
                      />
                    </div>

                    {/* Partner Character */}
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 2, delay: 0.2 }}
                      className="text-center"
                    >
                      <div className="relative w-32 h-48">
                        {/* Head */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-pink-300 rounded-full border-5 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)]"></div>

                        {/* Outfit Preview */}
                        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-24 h-28 rounded-xl border-5 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)] overflow-hidden bg-white">
                          {player2.outfit.previewUrl ? (
                            <img
                              src={player2.outfit.previewUrl}
                              alt={player2.outfit.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-pink-300" />
                          )}
                        </div>

                        {/* Legs */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-2">
                          <div className="w-3 h-12 bg-gray-800 border-3 border-black"></div>
                          <div className="w-3 h-12 bg-gray-800 border-3 border-black"></div>
                        </div>
                      </div>
                      <div className="mt-2 bg-white px-4 py-2 rounded-lg border-4 border-black shadow-[3px_3px_0px_rgba(0,0,0,0.3)]">
                        <span
                          className="text-lg font-black text-purple-600"
                          style={{ fontFamily: "Impact, fantasy" }}
                        >
                          상대 캐릭터
                        </span>
                      </div>
                    </motion.div>
                  </div>
                </div>

                <p
                  className="text-2xl font-black text-center mt-6 text-purple-600 [text-shadow:_2px_2px_0_rgb(255_255_255)]"
                  style={{ fontFamily: "Impact, fantasy" }}
                >
                  함께 즐거운 데이트를 즐기세요! 💑
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          // Defeat - Playing LoL Alone Scene
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-5xl w-full my-auto"
          >
            <div
              className="bg-gradient-to-br from-gray-100 to-blue-100 p-8 rounded-3xl border-8 border-black shadow-[16px_16px_0px_rgba(0,0,0,0.5)]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, transparent 0px, transparent 20px, rgba(100,100,100,0.1) 20px, rgba(100,100,100,0.1) 40px)",
              }}
            >
              <div className="bg-white p-8 rounded-2xl border-6 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.3)] mb-8">
                <p
                  className="text-3xl font-black text-center text-gray-600 mb-4"
                  style={{ fontFamily: "Impact, fantasy" }}
                >
                  고백에 실패했어요...
                </p>
                <p
                  className="text-xl font-bold text-center text-gray-500"
                  style={{ fontFamily: "Impact, fantasy" }}
                >
                  다음 기회를 노려봐요!
                </p>
              </div>

              {/* Gaming Scene */}
              <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-8 rounded-2xl border-6 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.3)]">
                <div className="relative h-96 flex items-center justify-center">
                  {/* Room background */}
                  <div className="absolute inset-0 flex items-end">
                    <div className="w-full h-24 bg-gray-700 border-t-5 border-black"></div>
                  </div>

                  {/* Monitor/Screen */}
                  <div className="absolute top-8 bg-gray-900 w-96 h-56 border-6 border-black rounded-xl shadow-[8px_8px_0px_rgba(0,0,0,0.4)]">
                    <div className="w-full h-full bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg flex items-center justify-center">
                      <Gamepad2
                        className="w-32 h-32 text-blue-400 animate-pulse"
                        strokeWidth={3}
                      />
                    </div>
                  </div>

                  {/* Player Character sitting */}
                  <motion.div
                    animate={{ y: [0, 2, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute bottom-20 text-center"
                  >
                    <div className="relative w-32 h-40">
                      {/* Head */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-yellow-200 rounded-full border-5 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)]">
                        {/* Sad face */}
                        <div className="absolute top-6 left-5 w-2 h-2 bg-black rounded-full"></div>
                        <div className="absolute top-6 right-5 w-2 h-2 bg-black rounded-full"></div>
                        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-8 h-1 bg-black rounded-full"></div>
                      </div>

                      {/* Outfit Preview */}
                      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-24 h-20 rounded-t-xl border-5 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)] overflow-hidden bg-white">
                        {player1.outfit.previewUrl ? (
                          <img
                            src={player1.outfit.previewUrl}
                            alt={player1.outfit.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-yellow-200" />
                        )}
                      </div>
                    </div>
                    <div className="mt-2 bg-white px-4 py-2 rounded-lg border-4 border-black shadow-[3px_3px_0px_rgba(0,0,0,0.3)]">
                      <span
                        className="text-lg font-black text-gray-600"
                        style={{ fontFamily: "Impact, fantasy" }}
                      >
                        {player1.username}
                      </span>
                    </div>
                  </motion.div>

                  {/* Gaming effects */}
                  <div className="absolute top-32 left-12 text-4xl animate-pulse">
                    🎮
                  </div>
                  <div
                    className="absolute top-20 right-12 text-4xl animate-pulse"
                    style={{ animationDelay: "0.5s" }}
                  >
                    🕹️
                  </div>
                </div>

                <p
                  className="text-2xl font-black text-center mt-6 text-blue-400 [text-shadow:_2px_2px_0_rgb(0_0_0)]"
                  style={{ fontFamily: "Impact, fantasy" }}
                >
                  오늘은 롤이나 하자... 🎮
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function ResultRoute() {
  const router = useRouter();
  const {
    selectedBattleOutfit,
    opponentOutfit,
    isWinner,
    isAfterSuccess,
    resetBattle,
  } = useAppState();
  useAuthGate();

  useEffect(() => {
    if (!selectedBattleOutfit) {
      router.replace("/landing");
    }
  }, [router, selectedBattleOutfit]);

  if (!selectedBattleOutfit) {
    return null;
  }

  return (
    <ResultPage
      player1={{
        username: "플레이어",
        outfit: selectedBattleOutfit,
      }}
      player2={{
        username: "상대방",
        outfit: opponentOutfit,
      }}
      isWinner={isWinner}
      isAfterSuccess={isAfterSuccess}
      onBack={() => {
        resetBattle();
        router.push("/landing");
      }}
    />
  );
}
