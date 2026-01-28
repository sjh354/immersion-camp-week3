"use client";

import { ArrowLeft } from "lucide-react";
import { PatternBackground } from "@/_components/PatternBackground";
import { motion } from "motion/react";

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

export default function ResultPage({
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
                  {isWinner
                    ? "동근이 형이 고백에 성공했어요! 💕"
                    : "하지만 동근이 형은 고백에 성공했어요! 💕"}
                </p>
                <p
                  className="text-xl font-bold text-center text-gray-600"
                  style={{ fontFamily: "Impact, fantasy" }}
                >
                  이제 데이트를 떠나볼까요?
                </p>
              </div>

              {/* Result Image */}
              <div className="bg-white p-2 rounded-2xl border-6 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.3)]">
                <motion.div
                  animate={{ y: [0, -4, 0], scale: [1, 1.02, 1] }}
                  transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                  className="relative h-96 w-full overflow-hidden rounded-xl flex items-center justify-center origin-center"
                >
                  <img
                    src="/result_win.jpg"
                    alt="Result win"
                    className="h-full w-full object-cover"
                  />
                </motion.div>
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
                  동근이 형은 고백에 실패했어요...
                </p>
                <p
                  className="text-xl font-bold text-center text-gray-500"
                  style={{ fontFamily: "Impact, fantasy" }}
                >
                  다음 기회를 노려봐요!
                </p>
              </div>

              {/* Result Image */}
              <div className="bg-white p-2 rounded-2xl border-6 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.3)]">
                <motion.div
                  animate={{ x: [0, -3, 3, 0], rotate: [0, -0.4, 0.4, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="relative h-96 w-full overflow-hidden rounded-xl flex items-center justify-center origin-center"
                >
                  <img
                    src="/result_lose.jpg"
                    alt="Result lose"
                    className="h-full w-full object-cover"
                  />
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
