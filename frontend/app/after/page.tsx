"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Clock } from "lucide-react";
import { PatternBackground } from "@/_components/PatternBackground";
import { useAppState } from "@/store/appState";
import { useAuthGate } from "@/hooks/useAuthGate";
import { SavedOutfit } from "@/types/models";
import { fetchWithAuth } from "@/utils/apiClient";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export default function AfterRequestPage() {
  const router = useRouter();
  const {
    deckSlot1,
    deckSlot2,
    selectedBattleOutfit,
    submitAfterMessage,
    battleSessionId,
    setAfterResult,
    setBattleResult
  } = useAppState();
  useAuthGate();

  const remainingOutfit =
    selectedBattleOutfit?.id === deckSlot1?.id ? deckSlot2 : deckSlot1;

  // -- State --
  const [message, setMessage] = useState("");
  // Local timer for ment submission (30s)
  const [timeLeft, setTimeLeft] = useState(30);
  const [isWaiting, setIsWaiting] = useState(false);
  // Remote timer for voting (starts at 60s, will be updated by socket)
  const [votingTimeLeft, setVotingTimeLeft] = useState<number | null>(null);

  const [voteCounts, setVoteCounts] = useState({ voteA: 0, voteB: 0 });
  const [isWsConnected, setIsWsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);

  // -- Validation Redirect --
  useEffect(() => {
    if (!selectedBattleOutfit || !deckSlot1 || !deckSlot2 || !remainingOutfit) {
      router.replace("/landing");
    }
  }, [deckSlot1, deckSlot2, remainingOutfit, router, selectedBattleOutfit]);

  // -- Ment Submission Timer --
  useEffect(() => {
    if (timeLeft > 0 && !isWaiting) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isWaiting) {
      handleSubmit();
    }
  }, [timeLeft, isWaiting]);

  const handleSubmit = async () => {
    if (message.trim()) {
      await submitAfterMessage(message);
      if (battleSessionId) {
        router.replace(`/battle/game/${battleSessionId}`);
        return;
      }
      setIsWaiting(true); // Fallback if session id is missing
    }
  };

  // -- WebSocket Connection --
  useEffect(() => {
    const wsBase = process.env.NEXT_PUBLIC_WS_URL;
    if (!wsBase || !battleSessionId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(wsBase),
      onConnect: () => {
        setIsWsConnected(true);
        console.log("Connected to WS:", battleSessionId);

        // Subscribe to Battle Topic (Timer + End + Vote)
        client.subscribe(`/topic/battle/${battleSessionId}`, (msg) => {
          try {
            const payload = JSON.parse(msg.body) as {
              type: string;
              content?: string;
              remainingSeconds?: number;
              round2VoteSuccessCount?: number;
              round2VoteFailCount?: number;
              session?: { round2VoteSuccessCount?: number; round2VoteFailCount?: number };
            };

            if (payload.type === "INFO" && payload.content === "TIME_UPDATE") {
              if (payload.remainingSeconds !== undefined) {
                setVotingTimeLeft(payload.remainingSeconds);
              }
            } else if (payload.type === "VOTE") {
              setVoteCounts({
                voteA: payload.round2VoteSuccessCount ?? 0,
                voteB: payload.round2VoteFailCount ?? 0,
              });
            } else if (payload.type === "SESSION" && payload.session) {
              setVoteCounts({
                voteA: payload.session.round2VoteSuccessCount ?? 0,
                voteB: payload.session.round2VoteFailCount ?? 0,
              });
            } else if (payload.type === "END") {
              const sVotes = payload.round2VoteSuccessCount ?? 0;
              const fVotes = payload.round2VoteFailCount ?? 0;
              const success = sVotes >= fVotes;

              console.log("Battle END received. Result:", success, sVotes, fVotes);
              setAfterResult(success);
              setBattleResult(true);
              router.push("/result");
            }
          } catch (e) {
            console.error("WS Parse Error", e);
          }
        });
      },
      onDisconnect: () => setIsWsConnected(false),
      onStompError: () => setIsWsConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      clientRef.current = null;
      client.deactivate();
    };
  }, [battleSessionId, router, setAfterResult, setBattleResult]);

  // -- Poll Status (Failsafe for WS) --
  useEffect(() => {
    if (!battleSessionId) return;
    let cancelled = false;

    const pollStatus = async () => {
      try {
        const res = await fetchWithAuth(`/battle/${battleSessionId}`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          status: string;
          round2VoteSuccessCount?: number;
          round2VoteFailCount?: number;
        };

        if (!cancelled) {
          if (data.status === "END") {
            const sVotes = data.round2VoteSuccessCount ?? 0;
            const fVotes = data.round2VoteFailCount ?? 0;
            const success = sVotes >= fVotes;

            console.log("Polling detected END. Result:", success);
            setAfterResult(success);
            setBattleResult(true);
            router.push("/result");
            cancelled = true; // Stop polling
          }
        }
      } catch { }
    };

    const runPoll = async () => {
      // Only poll status if waiting
      if (isWaiting) {
        await pollStatus();
      }
    };

    runPoll();
    const interval = setInterval(runPoll, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [battleSessionId, isWaiting, router, setAfterResult, setBattleResult]);


  // -- Early Return if Missing Data --
  if (!remainingOutfit) return null;

  // -- Waiting Screen (Voting in Progress) --
  if (isWaiting) {
    return (
      <div className="h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-yellow-200 relative overflow-hidden flex flex-col items-center justify-center">
        <PatternBackground type="hearts" />
        <div className="relative z-10 bg-white p-10 rounded-3xl border-8 border-black shadow-[16px_16px_0px_rgba(0,0,0,0.4)] text-center animate-bounce">
          <h2 className="text-4xl font-black text-purple-600 mb-6" style={{ fontFamily: "Impact, fantasy" }}>
            💌 멘트 전송 완료!
          </h2>
          <p className="text-xl font-bold text-gray-700 mb-8">
            관전자들의 투표를 기다리고 있습니다...<br />
            잠시만 기다려주세요!
          </p>

          {/* Voting Timer */}
          <div className="flex flex-col items-center gap-2 mb-6">
            <div className="w-16 h-16 border-6 border-black border-t-purple-500 rounded-full animate-spin"></div>
            {votingTimeLeft !== null && (
              <span className="text-2xl font-black text-red-500 mt-4" style={{ fontFamily: "Impact, fantasy" }}>
                남은 시간: {votingTimeLeft}초
              </span>
            )}
          </div>

          <div className="text-sm font-bold text-gray-500">
            (투표가 종료되면 자동으로 결과 화면으로 이동합니다)
          </div>
        </div>
      </div>
    );
  }

  // -- Ment Submission Screen --
  return (
    <div className="h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-yellow-200 relative overflow-hidden flex flex-col">
      <PatternBackground type="hearts" />

      {/* Header */}
      <div className="relative z-10 bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-500 p-4 shadow-[0_6px_0_rgba(0,0,0,0.3)] border-b-6 border-black flex items-center justify-between flex-shrink-0">
        <div className="w-12"></div>
        <h1 className="text-3xl font-black text-white [text-shadow:_4px_4px_0_rgb(0_0_0)]" style={{ fontFamily: "Impact, fantasy" }}>
          💖 애프터 신청하기 💖
        </h1>
        {/* Timer */}
        <div className={`flex items-center gap-2 bg-white px-4 py-3 rounded-xl border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)] ${timeLeft <= 5 ? "animate-pulse bg-red-100" : ""}`}>
          <Clock className={`w-6 h-6 ${timeLeft <= 5 ? "text-red-500" : "text-purple-500"}`} strokeWidth={3} />
          <span className={`text-2xl font-black ${timeLeft <= 5 ? "text-red-500" : "text-purple-600"}`} style={{ fontFamily: "Impact, fantasy" }}>
            {timeLeft}초
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10 overflow-y-auto">
        <div className="max-w-4xl w-full space-y-8">

          {/* Victory Title */}
          <div className="text-center animate-bounce">
            <h2 className="text-5xl font-black text-yellow-600 [text-shadow:_4px_4px_0_rgb(255_255_255)] mb-2" style={{ fontFamily: "Impact, fantasy" }}>
              🎉 대결 승리! 🎉
            </h2>
            <p className="text-2xl font-black text-purple-600 [text-shadow:_2px_2px_0_rgb(255_255_255)]" style={{ fontFamily: "Impact, fantasy" }}>
              남은 코디로 애프터를 신청하세요!
            </p>
          </div>

          {/* Content Grid */}
          <div className="grid lg:grid-cols-[2fr_1fr] gap-6">

            {/* Left Col: Remaining Outfit */}
            <div className="bg-white rounded-2xl border-6 border-black shadow-[10px_10px_0px_rgba(0,0,0,0.4)] p-8"
              style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0px, #fff 12px, #fef3c7 12px, #fef3c7 24px)" }}>
              <h3 className="text-2xl font-black text-yellow-600 text-center mb-6 [text-shadow:_2px_2px_0_rgb(255_255_255)]" style={{ fontFamily: "Impact, fantasy" }}>
                🎴 남은 코디
              </h3>
              <div className="relative w-full h-96 bg-gradient-to-b from-purple-50 to-pink-50 rounded-xl overflow-hidden border-5 border-black mb-4">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-48 h-80">
                    <div className="absolute inset-0 rounded-2xl border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.3)] overflow-hidden bg-white">
                      {remainingOutfit.previewUrl ? (
                        <img src={remainingOutfit.previewUrl} alt={remainingOutfit.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-gray-200" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xl font-black text-purple-600 text-center" style={{ fontFamily: "Impact, fantasy" }}>
                {remainingOutfit.name}
              </p>
            </div>

            {/* Right Col: Votes Display (Only Votes, No Chat) */}
            <div className="bg-white rounded-2xl border-6 border-black shadow-[10px_10px_0px_rgba(0,0,0,0.35)] p-6 flex flex-col justify-center">
              <h3 className="text-2xl font-black text-purple-600 mb-6 text-center" style={{ fontFamily: "Impact, fantasy" }}>
                📊 실시간 투표 현황
              </h3>
              <div className="space-y-6">
                <div className="flex flex-col items-center bg-pink-100 border-4 border-black rounded-xl px-4 py-4">
                  <span className="text-lg font-black text-purple-700 mb-2">❤️ 성공 (좋아요)</span>
                  <span className="text-4xl font-black text-purple-700">{voteCounts.voteA}표</span>
                </div>
                <div className="flex flex-col items-center bg-cyan-100 border-4 border-black rounded-xl px-4 py-4">
                  <span className="text-lg font-black text-blue-700 mb-2">💔 실패 (싫어요)</span>
                  <span className="text-4xl font-black text-blue-700">{voteCounts.voteB}표</span>
                </div>
              </div>
              <p className="mt-8 text-center text-sm font-bold text-gray-400">
                (관전자들이 투표중입니다)
              </p>
            </div>
          </div>

          {/* Ment Input Area (Without Chat) */}
          <div className="bg-white rounded-2xl border-6 border-black shadow-[10px_10px_0px_rgba(0,0,0,0.4)] p-8"
            style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0px, #fff 12px, #ffe0f0 12px, #ffe0f0 24px)" }}>
            <h3 className="text-2xl font-black text-pink-600 text-center mb-4 [text-shadow:_2px_2px_0_rgb(255_255_255)]" style={{ fontFamily: "Impact, fantasy" }}>
              💬 애프터 신청 멘트
            </h3>
            <p className="text-sm font-bold text-gray-600 text-center mb-6" style={{ fontFamily: "Impact, fantasy" }}>
              진심 어린 멘트를 작성하면 결과에 반영됩니다!<br />
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
              <span className={`text-lg font-bold ${message.length >= 10 ? "text-green-600" : "text-gray-400"}`} style={{ fontFamily: "Impact, fantasy" }}>
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
                <span className="text-4xl font-black text-white [text-shadow:_4px_4px_0_rgb(0_0_0)]" style={{ fontFamily: "Impact, fantasy" }}>
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
