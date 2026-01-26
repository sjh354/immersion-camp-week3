"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { PatternBackground } from "@/_components/PatternBackground";
import { fetchWithAuth } from "@/utils/apiClient";
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

interface BattleSession {
  sessionId: number;
  status: string;
  currentRound: number;
  hostOutfitA?: { id: number; previewUrl: string };
  guestOutfitA?: { id: number; previewUrl: string };
  hostMent?: string;
  guestMent?: string;
  opponent?: { nickname?: string };
}

interface BattleSessionViewProps {
  sessionId: number;
}

export function BattleSessionView({ sessionId }: BattleSessionViewProps) {
  const [session, setSession] = useState<BattleSession | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [voteCounts, setVoteCounts] = useState({ voteA: 0, voteB: 0 });
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    if (!Number.isFinite(sessionId)) return;
    let cancelled = false;
    const loadSession = async () => {
      try {
        console.log("loadSession", sessionId);
        const res = await fetchWithAuth(`/battle/${sessionId}`);
        if (!res.ok) return;
        const data = (await res.json()) as BattleSession;
        if (!cancelled) setSession(data);
      } catch {
        // ignore for now
      }
    };
    loadSession();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

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
      webSocketFactory: () =>
        new SockJS(wsBase, undefined, { withCredentials: true }),
      onConnect: () => {
        setIsWsConnected(true);
        client.subscribe(`/topic/battles/${sessionId}`, (msg) => {
          try {
            const payload = JSON.parse(msg.body) as
              | { type: "CHAT"; message: ChatMessage }
              | { type: "VOTE"; voteA: number; voteB: number }
              | { type: "TIMER"; remainingSeconds: number }
              | { type: "SESSION"; session: BattleSession };
            if (payload.type === "CHAT") {
              setChatMessages((prev) => [...prev, payload.message]);
            } else if (payload.type === "VOTE") {
              setVoteCounts({
                voteA: payload.voteA ?? 0,
                voteB: payload.voteB ?? 0,
              });
            } else if (payload.type === "TIMER") {
              setRemainingSeconds(payload.remainingSeconds ?? null);
            } else if (payload.type === "SESSION") {
              setSession(payload.session);
            }
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
    const content = newMessage.trim();
    if (!content) return;
    const client = clientRef.current;
    if (!client || !client.connected) return;
    client.publish({
      destination: `/app/battles/${sessionId}/chat`,
      body: JSON.stringify({
        senderId: null,
        content,
        type: "TALK",
      }),
    });
    setNewMessage("");
  };

  return (
    <div className="h-screen relative overflow-hidden bg-gradient-to-br from-cyan-100 via-pink-100 to-yellow-100">
      <PatternBackground type="stars" />

      <div className="relative z-10 h-full w-full p-4 md:p-6">
        <div className="h-full grid gap-6 md:grid-cols-[1fr_1fr_0.8fr]">
          {[
            {
              label: "PLAYER 1",
              previewUrl: session?.hostOutfitA?.previewUrl,
              ment: session?.hostMent,
            },
            {
              label: session?.opponent?.nickname ?? "PLAYER 2",
              previewUrl: session?.guestOutfitA?.previewUrl,
              ment: session?.guestMent,
            },
          ].map((player, index) => (
            <section
              key={`player-${index}`}
              className="bg-white rounded-3xl border-6 border-black shadow-[10px_10px_0px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col min-h-0"
            >
              <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 px-6 py-4 text-white font-black text-xl">
                {player.label}
              </div>
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-[7] bg-white border-b-4 border-black">
                  {player.previewUrl ? (
                    <img
                      src={player.previewUrl}
                      alt={player.label}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-500 font-bold">
                      이미지 없음
                    </div>
                  )}
                </div>
                <div className="flex-[3] p-4 flex flex-col min-h-0">
                  <div className="text-sm font-black text-gray-600 mb-2">
                    멘트
                  </div>
                  <div className="flex-1 rounded-xl border-3 border-black bg-yellow-50 p-4 text-gray-800 font-semibold overflow-y-auto">
                    {player.ment ?? "아직 멘트가 등록되지 않았습니다."}
                  </div>
                </div>
              </div>
            </section>
          ))}

          <section className="bg-white rounded-3xl border-6 border-black shadow-[10px_10px_0px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col min-h-0 md:col-span-1">
            <div className="flex items-center justify-between bg-black text-white px-6 py-4">
              <div className="flex items-center gap-2 font-black">
                <MessageCircle className="w-5 h-5" />
                실시간 채팅
              </div>
              <span className="text-xs font-black">
                {isWsConnected ? "연결됨" : "연결 대기"}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-2 border-b-4 border-black bg-white text-xs font-black text-gray-700">
              <span>
                투표 A {voteCounts.voteA} / B {voteCounts.voteB}
              </span>
              <span>
                남은 시간{" "}
                {remainingSeconds !== null ? `${remainingSeconds}s` : "--"}
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
            <div className="border-t-4 border-black p-4 flex items-center gap-3 bg-yellow-50">
              <input
                value={newMessage}
                onChange={(event) => setNewMessage(event.target.value)}
                placeholder="관전 채팅을 입력하세요"
                className="flex-1 rounded-xl border-3 border-black px-4 py-2 font-semibold bg-white"
              />
              <button
                onClick={sendChatMessage}
                disabled={!isWsConnected}
                className="bg-black text-white px-4 py-2 rounded-xl border-3 border-black font-black flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                전송
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
