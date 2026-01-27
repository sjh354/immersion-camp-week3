"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Send, Clock, MessageCircle, ThumbsUp } from "lucide-react";
import { PatternBackground } from "@/_components/PatternBackground";
import { useAppState } from "@/store/appState";
import { useAuthGate } from "@/hooks/useAuthGate";
import { SavedOutfit } from "@/types/models";
import { fetchWithAuth } from "@/utils/apiClient";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

interface AfterRequestPageProps {
  username: string;
  remainingOutfit: SavedOutfit;
  opponentOutfit: SavedOutfit | null;
  sessionId: number | null;
  onSubmit: (message: string) => void;
}

function AfterRequestPage({
  username,
  remainingOutfit,
  opponentOutfit,
  sessionId,
  onSubmit,
}: AfterRequestPageProps) {
  const [message, setMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [chatMessages, setChatMessages] = useState<
    Array<{
      id: number;
      senderId: number | null;
      senderNickname: string;
      content: string;
      type: "TALK" | "NOTICE";
      sentAt: string;
    }>
  >([]);
  const [newMessage, setNewMessage] = useState("");
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [voteCounts, setVoteCounts] = useState({ voteA: 0, voteB: 0 });
  const clientRef = useRef<Client | null>(null);

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

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    const loadHistory = async () => {
      try {
        const res = await fetchWithAuth(`/chat/${sessionId}?page=0&size=50`);
        if (!res.ok) return;
        const data = (await res.json()) as typeof chatMessages;
        if (!cancelled) {
          setChatMessages(data);
        }
      } catch {
        // ignore for now
      }
    };
    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    const wsBase = process.env.NEXT_PUBLIC_WS_URL;
    if (!wsBase || !sessionId) return;
    const client = new Client({
      webSocketFactory: () => new SockJS(wsBase),
      onConnect: () => {
        setIsWsConnected(true);
        client.subscribe(`/topic/chat/${sessionId}`, (msg) => {
          try {
            const payload = JSON.parse(msg.body) as typeof chatMessages[number];
            setChatMessages((prev) => [...prev, payload]);
          } catch {
            // ignore invalid payload
          }
        });
      },
      onDisconnect: () => {
        setIsWsConnected(false);
      },
      onStompError: () => {
        setIsWsConnected(false);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      clientRef.current = null;
      client.deactivate();
    };
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    const pollVotes = async () => {
      try {
        const res = await fetchWithAuth(`/battle/${sessionId}/vote`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          voteA: number;
          voteB: number;
        };
        if (!cancelled) {
          setVoteCounts({
            voteA: data.voteA ?? 0,
            voteB: data.voteB ?? 0,
          });
        }
      } catch {
        // ignore for now
      }
    };
    pollVotes();
    const interval = setInterval(pollVotes, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sessionId]);

  const sendChatMessage = () => {
    const content = newMessage.trim();
    if (!content) return;
    const client = clientRef.current;
    if (!client || !client.connected || !sessionId) return;
    client.publish({
      destination: `/app/chat/${sessionId}`,
      body: JSON.stringify({
        senderId: null,
        content,
        type: "TALK",
      }),
    });
    setNewMessage("");
  };

  const sendVote = async (choice: "A" | "B") => {
    if (!sessionId) return;
    await fetchWithAuth(`/battle/${sessionId}/vote`, {
      method: "POST",
      body: JSON.stringify({ vote: choice }),
    });
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
          <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
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

            <div className="bg-white rounded-2xl border-6 border-black shadow-[10px_10px_0px_rgba(0,0,0,0.35)] p-6 flex flex-col">
              <h3
                className="text-2xl font-black text-purple-600 mb-4 text-center"
                style={{ fontFamily: "Impact, fantasy" }}
              >
                📊 관전자 투표
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-pink-100 border-4 border-black rounded-xl px-4 py-3">
                  <span className="text-sm font-black text-purple-700">
                    내 코디
                  </span>
                  <span className="text-xl font-black text-purple-700">
                    {voteCounts.voteA}표
                  </span>
                </div>
                <div className="flex items-center justify-between bg-cyan-100 border-4 border-black rounded-xl px-4 py-3">
                  <span className="text-sm font-black text-blue-700">
                    상대 코디
                  </span>
                  <span className="text-xl font-black text-blue-700">
                    {voteCounts.voteB}표
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => sendVote("A")}
                    className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-3 py-3 rounded-xl border-4 border-black shadow-[3px_3px_0px_rgba(0,0,0,0.3)]"
                  >
                    내 코디 투표
                  </button>
                  <button
                    onClick={() => sendVote("B")}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-3 py-3 rounded-xl border-4 border-black shadow-[3px_3px_0px_rgba(0,0,0,0.3)]"
                  >
                    상대 코디 투표
                  </button>
                </div>
              </div>
            </div>
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
              진심 어린 멘트를 작성하면 결과에 반영됩니다!
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

            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3 text-sm font-black text-purple-600">
                <MessageCircle className="w-4 h-4" strokeWidth={3} />
                실시간 채팅
              </div>
              <div className="h-40 overflow-y-auto space-y-2 border-4 border-black rounded-xl p-3 bg-white">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="bg-white p-2 rounded-lg border-3 border-black shadow-[2px_2px_0px_rgba(0,0,0,0.3)]"
                  >
                    <p className="text-xs font-black text-purple-600">
                      {msg.senderNickname}
                    </p>
                    <p className="text-sm font-bold text-gray-800">
                      {msg.content}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                  placeholder="채팅을 입력하세요..."
                  disabled={!isWsConnected}
                  className="flex-1 border-4 border-black rounded-xl px-3 py-2 text-sm font-bold"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!isWsConnected}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-xl border-4 border-black shadow-[3px_3px_0px_rgba(0,0,0,0.3)]"
                >
                  <ThumbsUp className="w-5 h-5" strokeWidth={3} />
                </button>
              </div>
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
