"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Send, ThumbsUp, Clock } from "lucide-react";
import { PatternBackground } from "@/_components/PatternBackground";
import { motion } from "motion/react";
import { useAppState } from "@/store/appState";
import { useAuthGate } from "@/hooks/useAuthGate";

interface Player {
  username: string;
  outfit: any;
  message: string;
}

interface BattleGamePageProps {
  player1: Player;
  player2: Player;
  onComplete: (isPlayer1Winner: boolean) => void;
}

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: number;
}

function BattleGamePage({ player1, player2, onComplete }: BattleGamePageProps) {
  const [countdown, setCountdown] = useState(3);
  const [showConfession, setShowConfession] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      username: "관객1",
      message: "오 시작이다!",
      timestamp: Date.now(),
    },
    {
      id: "2",
      username: "관객2",
      message: "누가 이길까?",
      timestamp: Date.now() + 100,
    },
    {
      id: "3",
      username: "관객3",
      message: "코디 진짜 예쁘네",
      timestamp: Date.now() + 200,
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [votes, setVotes] = useState({ player1: 0, player2: 0 });
  const [votingTime, setVotingTime] = useState(30);
  const [showResults, setShowResults] = useState(false);
  const [aiWinner, setAiWinner] = useState<"player1" | "player2" | null>(null);

  useEffect(() => {
    // Countdown timer
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (!showConfession) {
      // Start confession animation
      setShowConfession(true);

      // Add reaction messages
      setTimeout(() => {
        addChatMessage("관객1", "우와 동시에 고백한다!");
      }, 2000);

      setTimeout(() => {
        addChatMessage("관객2", "긴장된다 ㅋㅋㅋ");
      }, 3000);
    }
  }, [countdown, showConfession]);

  // Voting timer
  useEffect(() => {
    if (showConfession && votingTime > 0 && !showResults) {
      const timer = setTimeout(() => {
        setVotingTime(votingTime - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showConfession && votingTime === 0 && !showResults) {
      // Voting ended - calculate results
      handleVotingEnd();
    }
  }, [showConfession, votingTime, showResults]);

  const handleVotingEnd = () => {
    setShowResults(true);

    // AI judges the confession (mock logic - can be replaced with real AI)
    const aiScore = Math.random();
    const aiWinnerChoice: "player1" | "player2" =
      aiScore > 0.5 ? "player1" : "player2";
    setAiWinner(aiWinnerChoice);

    // Add result messages
    addChatMessage("시스템", "투표가 마감되었습니다! 결과를 집계하는 중...");

    setTimeout(() => {
      addChatMessage(
        "시스템",
        `투표 결과: ${player1.username} ${votes.player1}표 vs ${player2.username} ${votes.player2}표`,
      );
    }, 1000);

    setTimeout(() => {
      addChatMessage(
        "AI 심판",
        `AI 판정 결과: ${aiWinnerChoice === "player1" ? player1.username : player2.username}의 고백이 더 진심이 느껴집니다!`,
      );
    }, 2000);

    setTimeout(() => {
      addChatMessage("시스템", "최종 결과를 발표합니다!");
    }, 3000);

    // Move to results page after 8 seconds
    setTimeout(() => {
      onComplete(aiWinnerChoice === "player1");
    }, 8000);
  };

  const addChatMessage = (username: string, message: string) => {
    const newMsg: ChatMessage = {
      id: Date.now().toString() + Math.random(),
      username,
      message,
      timestamp: Date.now(),
    };
    setChatMessages((prev) => [...prev, newMsg]);
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      addChatMessage("나", newMessage);
      setNewMessage("");
    }
  };

  const handleVote = (player: "player1" | "player2") => {
    if (showResults) return; // Can't vote after results are shown

    setVotes((prev) => ({
      ...prev,
      [player]: prev[player] + 1,
    }));
    addChatMessage(
      "나",
      `${player === "player1" ? player1.username : player2.username}에게 투표했어요! 👍`,
    );
  };

  return (
    <div className="h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-yellow-200 relative overflow-hidden flex flex-col">
      <PatternBackground type="hearts" />

      {/* Results Overlay - Full Screen */}
      {showResults && aiWinner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 p-6 rounded-3xl border-8 border-black shadow-[16px_16px_0px_rgba(0,0,0,0.5)] max-w-3xl w-full"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, transparent 0px, transparent 20px, rgba(255,255,255,0.3) 20px, rgba(255,255,255,0.3) 40px)",
            }}
          >
            <h2
              className="text-4xl font-black text-center mb-4 text-orange-600 [text-shadow:_4px_4px_0_rgb(255_255_255)]"
              style={{ fontFamily: "Impact, fantasy" }}
            >
              🏆 최종 결과! 🏆
            </h2>

            {/* Voting Results */}
            <div className="bg-white p-3 rounded-2xl border-5 border-black mb-3 shadow-[6px_6px_0px_rgba(0,0,0,0.3)]">
              <h3
                className="text-lg font-black text-center mb-2 text-purple-600"
                style={{ fontFamily: "Impact, fantasy" }}
              >
                📊 관객 투표
              </h3>
              <div className="flex justify-around items-center">
                <div className="text-center">
                  <p
                    className="text-sm font-bold text-gray-600 mb-1"
                    style={{ fontFamily: "Impact, fantasy" }}
                  >
                    {player1.username}
                  </p>
                  <div className="bg-gradient-to-r from-pink-400 to-pink-500 px-5 py-2 rounded-xl border-4 border-black">
                    <p
                      className="text-3xl font-black text-white [text-shadow:_3px_3px_0_rgb(0_0_0)]"
                      style={{ fontFamily: "Impact, fantasy" }}
                    >
                      {votes.player1}표
                    </p>
                  </div>
                </div>

                <span className="text-2xl font-black text-gray-400">VS</span>

                <div className="text-center">
                  <p
                    className="text-sm font-bold text-gray-600 mb-1"
                    style={{ fontFamily: "Impact, fantasy" }}
                  >
                    {player2.username}
                  </p>
                  <div className="bg-gradient-to-r from-purple-400 to-purple-500 px-5 py-2 rounded-xl border-4 border-black">
                    <p
                      className="text-3xl font-black text-white [text-shadow:_3px_3px_0_rgb(0_0_0)]"
                      style={{ fontFamily: "Impact, fantasy" }}
                    >
                      {votes.player2}표
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Result */}
            <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-500 p-3 rounded-2xl border-5 border-black mb-3 shadow-[6px_6px_0px_rgba(0,0,0,0.3)]">
              <h3
                className="text-lg font-black text-center mb-2 text-white [text-shadow:_3px_3px_0_rgb(0_0_0)]"
                style={{ fontFamily: "Impact, fantasy" }}
              >
                🤖 AI 심판
              </h3>
              <div className="bg-white px-5 py-2 rounded-xl border-4 border-black text-center">
                <p
                  className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500"
                  style={{ fontFamily: "Impact, fantasy" }}
                >
                  {aiWinner === "player1" ? player1.username : player2.username}
                </p>
              </div>
            </div>

            {/* Final Winner */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1, type: "spring", stiffness: 200 }}
              className="bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-400 p-4 rounded-2xl border-5 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.4)]"
            >
              <h3
                className="text-xl font-black text-center mb-2 text-white [text-shadow:_3px_3px_0_rgb(0_0_0)]"
                style={{ fontFamily: "Impact, fantasy" }}
              >
                👑 최종 우승자 👑
              </h3>
              <div className="bg-white px-6 py-3 rounded-xl border-4 border-black text-center">
                <p
                  className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-500 animate-pulse"
                  style={{ fontFamily: "Impact, fantasy" }}
                >
                  {(() => {
                    const player1Score =
                      votes.player1 + (aiWinner === "player1" ? 10 : 0);
                    const player2Score =
                      votes.player2 + (aiWinner === "player2" ? 10 : 0);
                    return player1Score >= player2Score
                      ? player1.username
                      : player2.username;
                  })()}
                </p>
                <p
                  className="text-xs font-bold text-gray-600 mt-1"
                  style={{ fontFamily: "Impact, fantasy" }}
                >
                  (투표 + AI 합산)
                </p>
              </div>
            </motion.div>

            <p
              className="text-center mt-3 text-sm font-bold text-gray-600"
              style={{ fontFamily: "Impact, fantasy" }}
            >
              잠시 후 결과 페이지로 이동합니다...
            </p>
          </motion.div>
        </motion.div>
      )}

      {/* Header */}
      <div className="relative z-10 bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-500 p-4 shadow-[0_6px_0_rgba(0,0,0,0.3)] border-b-6 border-black flex items-center justify-between flex-shrink-0">
        <h1
          className="text-4xl font-black text-white [text-shadow:_4px_4px_0_rgb(0_0_0)]"
          style={{ fontFamily: "Impact, fantasy" }}
        >
          💖 고백 대결! 💖
        </h1>

        {/* Timer - Moved to Header */}
        {showConfession && !showResults && (
          <div
            className={`flex items-center gap-2 px-6 py-3 rounded-xl border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)] ${
              votingTime <= 10 ? "bg-red-100 animate-pulse" : "bg-yellow-100"
            }`}
          >
            <Clock
              className={`w-6 h-6 ${votingTime <= 10 ? "text-red-500" : "text-yellow-600"}`}
              strokeWidth={3}
            />
            <span
              className={`text-2xl font-black ${votingTime <= 10 ? "text-red-500" : "text-yellow-600"}`}
              style={{ fontFamily: "Impact, fantasy" }}
            >
              {votingTime}초
            </span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div
        className="flex gap-6 p-6 relative z-10"
        style={{ height: "calc(100vh - 88px)" }}
      >
        {/* Left - Game Screen */}
        <div
          className="flex-1 bg-white rounded-2xl border-6 border-black shadow-[10px_10px_0px_rgba(0,0,0,0.4)] overflow-hidden relative"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #fff 0px, #fff 20px, #fef3c7 20px, #fef3c7 40px)",
          }}
        >
          {countdown > 0 ? (
            // Countdown
            <div className="absolute inset-0 flex items-center justify-center bg-white/90">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-500 w-48 h-48 rounded-full flex items-center justify-center border-8 border-black shadow-[12px_12px_0px_rgba(0,0,0,0.4)]"
              >
                <span
                  className="text-[120px] font-black text-white [text-shadow:_6px_6px_0_rgb(0_0_0)]"
                  style={{ fontFamily: "Impact, fantasy" }}
                >
                  {countdown}
                </span>
              </motion.div>
            </div>
          ) : (
            // Game Scene
            <div className="relative w-full h-full">
              {/* Target Character (sitting behind desk) */}
              <div className="absolute top-12 left-1/2 -translate-x-1/2 text-center">
                <div className="mb-2">
                  <span
                    className="text-xl font-black text-purple-600 bg-white px-4 py-2 rounded-xl border-4 border-black shadow-[3px_3px_0px_rgba(0,0,0,0.3)]"
                    style={{ fontFamily: "Impact, fantasy" }}
                  >
                    상대 캐릭터
                  </span>
                </div>
                <div className="relative">
                  {/* Character */}
                  <div className="w-20 h-20 bg-pink-300 rounded-full border-5 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)] mb-4 mx-auto"></div>

                  {/* Desk */}
                  <div className="w-96 h-32 bg-amber-700 rounded-xl border-5 border-black shadow-[6px_6px_0px_rgba(0,0,0,0.3)] relative">
                    <div className="absolute -top-3 left-0 right-0 h-6 bg-amber-800 rounded-t-xl border-5 border-b-0 border-black"></div>
                  </div>
                </div>
              </div>

              {/* Player 1 - Bottom Left */}
              <motion.div
                initial={{ x: -100, y: 150, opacity: 0 }}
                animate={
                  showConfession
                    ? { x: 120, y: -50, opacity: 1 }
                    : { x: -100, y: 150, opacity: 0 }
                }
                transition={{ duration: 2, ease: "easeInOut" }}
                className="absolute bottom-20 left-12"
              >
                <div className="text-center">
                  {/* Outfit Preview */}
                  <div className="relative w-24 h-40 rounded-xl border-4 border-black shadow-[3px_3px_0px_rgba(0,0,0,0.3)] overflow-hidden bg-white">
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

                  <div className="mt-2 bg-white px-3 py-1 rounded-lg border-3 border-black shadow-[2px_2px_0px_rgba(0,0,0,0.3)]">
                    <span
                      className="text-sm font-black text-purple-600"
                      style={{ fontFamily: "Impact, fantasy" }}
                    >
                      {player1.username}
                    </span>
                  </div>

                  {/* Confession Bubble - Left Side */}
                  {showConfession && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 2, duration: 0.5 }}
                      className="absolute -top-40 left-24 bg-pink-100 p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)] w-56 z-20"
                    >
                      <div className="absolute bottom-4 -left-3 w-6 h-6 bg-pink-100 border-b-4 border-l-4 border-black rotate-[-45deg]"></div>
                      <p
                        className="text-sm font-bold text-purple-600"
                        style={{ fontFamily: "Impact, fantasy" }}
                      >
                        "{player1.message}"
                      </p>
                      <div className="flex justify-center gap-1 mt-2">
                        {[...Array(3)].map((_, i) => (
                          <Heart
                            key={i}
                            className="w-3 h-3 text-pink-500"
                            fill="currentColor"
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Player 2 - Bottom Right */}
              <motion.div
                initial={{ x: 100, y: 150, opacity: 0 }}
                animate={
                  showConfession
                    ? { x: -120, y: -50, opacity: 1 }
                    : { x: 100, y: 150, opacity: 0 }
                }
                transition={{ duration: 2, ease: "easeInOut" }}
                className="absolute bottom-20 right-12"
              >
                <div className="text-center">
                  {/* Outfit Preview */}
                  <div className="relative w-24 h-40 rounded-xl border-4 border-black shadow-[3px_3px_0px_rgba(0,0,0,0.3)] overflow-hidden bg-white">
                    {player2.outfit.previewUrl ? (
                      <img
                        src={player2.outfit.previewUrl}
                        alt={player2.outfit.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-pink-200" />
                    )}
                  </div>

                  <div className="mt-2 bg-white px-3 py-1 rounded-lg border-3 border-black shadow-[2px_2px_0px_rgba(0,0,0,0.3)]">
                    <span
                      className="text-sm font-black text-purple-600"
                      style={{ fontFamily: "Impact, fantasy" }}
                    >
                      {player2.username}
                    </span>
                  </div>

                  {/* Confession Bubble - Right Side, Higher Position */}
                  {showConfession && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 2, duration: 0.5 }}
                      className="absolute -top-56 right-24 bg-purple-100 p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)] w-56 z-20"
                    >
                      <div className="absolute bottom-4 -right-3 w-6 h-6 bg-purple-100 border-b-4 border-r-4 border-black rotate-[45deg]"></div>
                      <p
                        className="text-sm font-bold text-purple-600"
                        style={{ fontFamily: "Impact, fantasy" }}
                      >
                        "{player2.message}"
                      </p>
                      <div className="flex justify-center gap-1 mt-2">
                        {[...Array(3)].map((_, i) => (
                          <Heart
                            key={i}
                            className="w-3 h-3 text-purple-500"
                            fill="currentColor"
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </div>

        {/* Right - Chat & Vote Section */}
        <div className="w-96 flex flex-col gap-4">
          {/* Chat Area */}
          <div
            className="flex-1 bg-white rounded-xl border-5 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, #fff 0px, #fff 10px, #e0f2fe 10px, #e0f2fe 20px)",
            }}
          >
            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 p-3 border-b-5 border-black flex-shrink-0">
              <h2
                className="text-xl font-black text-white text-center [text-shadow:_2px_2px_0_rgb(0_0_0)]"
                style={{ fontFamily: "Impact, fantasy" }}
              >
                💬 채팅창
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-white p-3 rounded-lg border-3 border-black shadow-[2px_2px_0px_rgba(0,0,0,0.3)]"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-sm font-black text-purple-600"
                      style={{ fontFamily: "Impact, fantasy" }}
                    >
                      {msg.username}
                    </span>
                  </div>
                  <p
                    className="text-sm font-bold text-gray-800"
                    style={{ fontFamily: "Impact, fantasy" }}
                  >
                    {msg.message}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Voting Buttons */}
          {showConfession && !showResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.5 }}
              className="bg-white p-3 rounded-xl border-5 border-black shadow-[6px_6px_0px_rgba(0,0,0,0.4)]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, #fff 0px, #fff 10px, #fce7f3 10px, #fce7f3 20px)",
              }}
            >
              <h3
                className="text-base font-black text-purple-600 text-center mb-2 [text-shadow:_2px_2px_0_rgb(255_255_255)]"
                style={{ fontFamily: "Impact, fantasy" }}
              >
                누구를 응원하시나요?
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleVote("player1")}
                  className="flex-1 bg-gradient-to-r from-pink-400 to-pink-500 p-2 rounded-xl border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)] hover:shadow-[6px_6px_0px_rgba(0,0,0,0.3)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
                >
                  <div className="text-center">
                    <ThumbsUp
                      className="w-5 h-5 mx-auto mb-1 text-white"
                      strokeWidth={3}
                    />
                    <span
                      className="text-xs font-black text-white block [text-shadow:_2px_2px_0_rgb(0_0_0)]"
                      style={{ fontFamily: "Impact, fantasy" }}
                    >
                      {player1.username}
                    </span>
                    <span
                      className="text-xs font-black text-white"
                      style={{ fontFamily: "Impact, fantasy" }}
                    >
                      {votes.player1}표
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => handleVote("player2")}
                  className="flex-1 bg-gradient-to-r from-purple-400 to-purple-500 p-2 rounded-xl border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)] hover:shadow-[6px_6px_0px_rgba(0,0,0,0.3)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
                >
                  <div className="text-center">
                    <ThumbsUp
                      className="w-5 h-5 mx-auto mb-1 text-white"
                      strokeWidth={3}
                    />
                    <span
                      className="text-xs font-black text-white block [text-shadow:_2px_2px_0_rgb(0_0_0)]"
                      style={{ fontFamily: "Impact, fantasy" }}
                    >
                      {player2.username}
                    </span>
                    <span
                      className="text-xs font-black text-white"
                      style={{ fontFamily: "Impact, fantasy" }}
                    >
                      {votes.player2}표
                    </span>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* Chat Input */}
          <div
            className="bg-white p-3 rounded-xl border-5 border-black shadow-[6px_6px_0px_rgba(0,0,0,0.4)]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, #fff 0px, #fff 10px, #e0f2fe 10px, #e0f2fe 20px)",
            }}
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="메시지를 입력하세요..."
                className="flex-1 px-3 py-2 text-sm font-bold border-4 border-black rounded-lg focus:outline-none focus:ring-4 focus:ring-cyan-400 bg-white"
                style={{ fontFamily: "Impact, fantasy" }}
              />
              <button
                onClick={handleSendMessage}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 p-3 rounded-lg border-4 border-black shadow-[3px_3px_0px_rgba(0,0,0,0.3)] hover:shadow-[4px_4px_0px_rgba(0,0,0,0.3)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
              >
                <Send className="w-5 h-5 text-white" strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BattleGameRoute() {
  const router = useRouter();
  const {
    selectedBattleOutfit,
    battleMessage,
    opponentOutfit,
    setBattleResult,
  } = useAppState();
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
    <BattleGamePage
      player1={{
        username: "플레이어",
        outfit: selectedBattleOutfit,
        message: battleMessage,
      }}
      player2={{
        username: "상대방",
        outfit: opponentOutfit,
        message: "이 옷을 입으면 나도 멋있게 보일까요? 함께 해주세요!",
      }}
      onComplete={(winner) => {
        setBattleResult(winner);
        if (winner) {
          router.push("/after");
        } else {
          router.push("/result");
        }
      }}
    />
  );
}
