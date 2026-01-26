"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Heart, Sparkles, Clock, MessageCircle, Send } from "lucide-react";
import { PatternBackground } from "@/_components/PatternBackground";
import { useAppState } from "@/store/appState";
import { useAuthGate } from "@/hooks/useAuthGate";
import { fetchWithAuth } from "@/utils/apiClient";
import { SavedOutfit } from "@/types/models";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

interface ChatMessage {
  id: number;
  senderId: number | null;
  senderNickname: string;
  content: string;
  type: "TALK" | "NOTICE";
  sentAt: string;
}

interface BattleMessagePageProps {
  username: string;
  selectedOutfit: SavedOutfit;
  sessionId: number;
  onBack: () => void;
  onSubmit: (message: string) => Promise<void>;
}

function BattleMessagePage({
  username,
  selectedOutfit,
  sessionId,
  onBack,
  onSubmit,
}: BattleMessagePageProps) {
  const [message, setMessage] = useState("");
  const [timeLeft, setTimeLeft] = useState(30);
  const [isReady, setIsReady] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newChatMessage, setNewChatMessage] = useState("");
  const [isWsConnected, setIsWsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);

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

  const handleSubmit = async () => {
    const messageToSubmit = message.trim() || "당신을 좋아합니다!";
    setIsReady(true);
    await onSubmit(messageToSubmit);
  };

  useEffect(() => {
    if (!Number.isFinite(sessionId)) return;
    let cancelled = false;
    const loadHistory = async () => {
      try {
        const res = await fetchWithAuth(`/chat/${sessionId}?page=0&size=50`);
        if (!res.ok) return;
        const data = (await res.json()) as ChatMessage[];
        if (!cancelled) setChatMessages(data);
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
    if (!wsBase || !Number.isFinite(sessionId)) return;
    const client = new Client({
      webSocketFactory: () => new SockJS(wsBase, undefined, { withCredentials: true }),
      onConnect: () => {
        setIsWsConnected(true);
        client.subscribe(`/topic/chat/${sessionId}`, (msg) => {
          try {
            const payload = JSON.parse(msg.body) as ChatMessage;
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

  const sendChatMessage = () => {
    const content = newChatMessage.trim();
    if (!content) return;
    const client = clientRef.current;
    if (!client || !client.connected) return;
    client.publish({
      destination: `/app/chat/${sessionId}`,
      body: JSON.stringify({
        senderId: null,
        content,
        type: "TALK",
      }),
    });
    setNewChatMessage("");
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
      <div className="flex-1 grid gap-6 p-6 relative z-10 md:grid-cols-[1fr_1.4fr_0.8fr]">
        {!isReady ? (
          <>
            {/* Left - Outfit Preview */}
            <div className="flex items-center justify-center">
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
            <div className="flex flex-col justify-center">
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

            {/* Chat Panel */}
            <div className="bg-white rounded-2xl border-6 border-black shadow-[10px_10px_0px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col min-h-0">
              <div className="flex items-center justify-between bg-black text-white px-4 py-3">
                <div className="flex items-center gap-2 font-black">
                  <MessageCircle className="w-5 h-5" />
                  실시간 채팅
                </div>
                <span className="text-xs font-black">
                  {isWsConnected ? "연결됨" : "연결 대기"}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="text-sm">
                    <span className="font-black text-purple-600">
                      {msg.senderNickname}
                    </span>
                    <span className="mx-2 text-gray-400">•</span>
                    <span className="text-gray-800">{msg.content}</span>
                  </div>
                ))}
                {chatMessages.length === 0 && (
                  <div className="text-sm text-gray-500 font-semibold">
                    아직 채팅이 없습니다.
                  </div>
                )}
              </div>
              <div className="border-t-4 border-black p-3 flex items-center gap-2 bg-yellow-50">
                <input
                  value={newChatMessage}
                  onChange={(event) => setNewChatMessage(event.target.value)}
                  placeholder="채팅을 입력하세요"
                  className="flex-1 rounded-xl border-3 border-black px-3 py-2 text-sm font-semibold bg-white"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!isWsConnected}
                  className="bg-black text-white px-3 py-2 rounded-xl border-3 border-black font-black flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
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
  const {
    selectedBattleOutfit,
    battleSessionId,
    setBattleMessage,
    setOpponentProfile,
    setOpponentOutfit,
  } = useAppState();
  useAuthGate();

  useEffect(() => {
    if (!selectedBattleOutfit || !battleSessionId) {
      router.replace("/battle/select");
    }
  }, [router, selectedBattleOutfit, battleSessionId]);

  useEffect(() => {
    if (!battleSessionId) return;
    let cancelled = false;
    const loadSession = async () => {
      try {
        const res = await fetchWithAuth(`/battle/${battleSessionId}`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          opponent: { id: number; nickname: string; winCount: number };
          hostOutfitA?: { id: number; previewUrl: string };
          guestOutfitA?: { id: number; previewUrl: string };
        };
        if (cancelled) return;
        setOpponentProfile(data.opponent);
        const opponentOutfit = data.guestOutfitA || data.hostOutfitA;
        if (opponentOutfit) {
          setOpponentOutfit({
            id: opponentOutfit.id,
            name: "상대 코디",
            previewUrl: opponentOutfit.previewUrl,
            topId: 0,
            bottomId: 0,
            outerId: 0,
            createdAt: "",
          });
        }
      } catch {
        // ignore for now
      }
    };
    loadSession();
    return () => {
      cancelled = true;
    };
  }, [battleSessionId]);

  if (!selectedBattleOutfit) {
    return null;
  }

  return (
    <BattleMessagePage
      username="플레이어"
      selectedOutfit={selectedBattleOutfit}
      sessionId={battleSessionId ?? NaN}
      onBack={() => router.push("/battle/select")}
      onSubmit={async (message) => {
        if (!battleSessionId) return;
        setBattleMessage(message);
        await fetchWithAuth("/battle/round/submit", {
          method: "POST",
          body: JSON.stringify({
            sessionId: battleSessionId,
            roundNum: 1,
            ment: message,
          }),
        });
        router.push(`/battle/game/${battleSessionId}`);
      }}
    />
  );
}
