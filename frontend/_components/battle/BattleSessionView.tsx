"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Send } from "lucide-react";
import { PatternBackground } from "@/_components/PatternBackground";
import { fetchWithAuth } from "@/utils/apiClient";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { ResultPage } from "@/app/result/page";

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
  hostOutfit1Id?: number | null;
  hostOutfit2Id?: number | null;
  hostPreview1Url?: string | null;
  hostPreview2Url?: string | null;
  guestOutfit1Id?: number | null;
  guestOutfit2Id?: number | null;
  guestPreview1Url?: string | null;
  guestPreview2Url?: string | null;
  hostVoteCountRound1?: number | null;
  guestVoteCountRound1?: number | null;
  round2VoteSuccessCount?: number | null;
  round2VoteFailCount?: number | null;
  hostMent?: string;
  guestMent?: string;
  opponent?: { nickname?: string };
  hostNickname?: string;
  guestNickname?: string;
  round1WinnerId?: number | null;
  hostId?: number;
  guestId?: number;
}

interface BattleSessionViewProps {
  sessionId: number;
}

export function BattleSessionView({ sessionId }: BattleSessionViewProps) {

  const router = useRouter();
  const [session, setSession] = useState<BattleSession | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [voteCounts, setVoteCounts] = useState({ voteA: 0, voteB: 0 });
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [historyPage, setHistoryPage] = useState(0);
  const [hasMoreHistory, setHasMoreHistory] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [currentUserNickname, setCurrentUserNickname] = useState<string | null>(
    null,
  );
  const [isComposing, setIsComposing] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const chatListRef = useRef<HTMLDivElement | null>(null);

  const normalizeSession = (data: BattleSession) => {
    const round = data.currentRound ?? 1;
    const isRound2 = round >= 2;
    const hostOutfitId = isRound2 ? data.hostOutfit2Id : data.hostOutfit1Id;
    const guestOutfitId = isRound2 ? data.guestOutfit2Id : data.guestOutfit1Id;
    const hostPreview = isRound2 ? data.hostPreview2Url : data.hostPreview1Url;
    const guestPreview = isRound2 ? data.guestPreview2Url : data.guestPreview1Url;

    return {
      ...data,
      hostOutfitA:
        data.hostOutfitA ??
        (hostOutfitId || hostPreview
          ? { id: hostOutfitId ?? 0, previewUrl: hostPreview ?? "" }
          : undefined),
      guestOutfitA:
        data.guestOutfitA ??
        (guestOutfitId || guestPreview
          ? { id: guestOutfitId ?? 0, previewUrl: guestPreview ?? "" }
          : undefined),
      opponent:
        data.opponent ??
        (data.guestNickname ? { nickname: data.guestNickname } : undefined),
    };
  };

  const getVoteCountsFromSession = (data: BattleSession | null) => {
    if (!data) return { voteA: 0, voteB: 0 };
    if ((data.currentRound ?? 1) >= 2) {
      return {
        voteA: data.round2VoteSuccessCount ?? 0,
        voteB: data.round2VoteFailCount ?? 0,
      };
    }
    return {
      voteA: data.hostVoteCountRound1 ?? 0,
      voteB: data.guestVoteCountRound1 ?? 0,
    };
  };

  const handleVote = (targetId?: number, fallbackVote?: "SUCCESS" | "FAIL") => {
    if (!clientRef.current || !clientRef.current.connected) return;
    const currentRound = session?.currentRound ?? 1;
    const content =
      currentRound >= 2 ? fallbackVote : targetId?.toString();
    if (!content) return;
    clientRef.current.publish({
      destination: `/app/battle/${sessionId}/vote`,
      body: JSON.stringify({
        senderId: currentUserId,
        senderNickname: currentUserNickname ?? undefined,
        content,
      }),
    });
  };

  useEffect(() => {
    let cancelled = false;
    const loadMe = async () => {
      try {
        const res = await fetchWithAuth("/members/me");
        if (!res.ok) return;
        const data = (await res.json()) as { id?: number; nickname?: string };
        if (!cancelled) {
          setCurrentUserId(data.id ?? null);
          setCurrentUserNickname(data.nickname ?? null);
        }
      } catch {
        // ignore for now
      }
    };
    loadMe();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!Number.isFinite(sessionId)) return;
    let cancelled = false;
    const loadSession = async () => {
      try {
        console.log("loadSession", sessionId);
        const res = await fetchWithAuth(`/battle/${sessionId}`);
        if (!res.ok) {
          return;
        }
        const data = (await res.json()) as BattleSession;
        if (!cancelled) {
          const normalized = normalizeSession(data);
          setSession(normalized);
          setVoteCounts(getVoteCountsFromSession(normalized));
        }
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
    setChatMessages([]);
    setHistoryPage(0);
    setHasMoreHistory(true);
  }, [sessionId]);

  const loadHistoryPage = async (page: number, replace: boolean) => {
    if (isLoadingHistory || !Number.isFinite(sessionId)) return;
    setIsLoadingHistory(true);
    const target = chatListRef.current;
    const prevScrollHeight = target?.scrollHeight ?? 0;
    const prevScrollTop = target?.scrollTop ?? 0;
    try {
      const res = await fetchWithAuth(`/chat/${sessionId}?page=${page}&size=50`);
      if (!res.ok) return;
      const raw = (await res.json()) as Array<{
        type?: string;
        senderId?: number | null;
        senderNickname?: string;
        content?: string;
        sentAt?: string;
      }>;
      const mapped = raw
        .filter((item) => item && item.content)
        .map((item, index) => ({
          id: Date.now() + index,
          senderId: item.senderId ?? null,
          senderNickname: item.senderNickname ?? "알 수 없음",
          content: item.content ?? "",
          type: "TALK" as const,
          sentAt: item.sentAt ?? new Date().toISOString(),
        }));
      setChatMessages((prev) => (replace ? mapped : [...mapped, ...prev]));
      setHasMoreHistory(mapped.length === 50);
      setHistoryPage(page);
      if (replace) {
        requestAnimationFrame(() => {
          const el = chatListRef.current;
          if (el) el.scrollTop = el.scrollHeight;
        });
      } else {
        requestAnimationFrame(() => {
          const el = chatListRef.current;
          if (!el) return;
          const newScrollHeight = el.scrollHeight;
          el.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
        });
      }
    } catch {
      // ignore for now
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (!Number.isFinite(sessionId)) return;
    loadHistoryPage(0, true);
  }, [sessionId]);

  useEffect(() => {
    const wsBase = process.env.NEXT_PUBLIC_WS_URL;
    if (!wsBase || !Number.isFinite(sessionId)) return;
    const client = new Client({
      webSocketFactory: () => new SockJS(wsBase),
      connectHeaders: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
      onConnect: () => {
        setIsWsConnected(true);
        client.subscribe(`/topic/battle/${sessionId}`, (msg) => {
          try {
            const payload = JSON.parse(msg.body) as {
              type?: string;
              senderId?: number | null;
              senderNickname?: string;
              content?: string;
              hostVoteCountRound1?: number;
              guestVoteCountRound1?: number;
              round2VoteSuccessCount?: number;
              round2VoteFailCount?: number;
              currentRound?: number;
              remainingSeconds?: number;
              round1WinnerId?: number;
              session?: BattleSession;
            };
            if (payload.type === "CHAT") {
              const message: ChatMessage = {
                id: Date.now(),
                senderId: payload.senderId ?? null,
                senderNickname: payload.senderNickname ?? "알 수 없음",
                content: payload.content ?? "",
                type: "TALK",
                sentAt: new Date().toISOString(),
              };
              setChatMessages((prev) => [...prev, message]);
              requestAnimationFrame(() => {
                const el = chatListRef.current;
                if (!el) return;
                const isNearBottom =
                  el.scrollHeight - el.scrollTop - el.clientHeight < 120;
                if (isNearBottom) {
                  el.scrollTop = el.scrollHeight;
                }
              });
            } else if (payload.type === "VOTE") {
              const nextRound =
                payload.currentRound ?? session?.currentRound ?? 1;
              if (nextRound >= 2) {
                setVoteCounts({
                  voteA: payload.round2VoteSuccessCount ?? 0,
                  voteB: payload.round2VoteFailCount ?? 0,
                });
              } else {
                setVoteCounts({
                  voteA: payload.hostVoteCountRound1 ?? 0,
                  voteB: payload.guestVoteCountRound1 ?? 0,
                });
              }
              if (payload.currentRound != null) {
                setSession((prev) =>
                  prev ? { ...prev, currentRound: payload.currentRound! } : prev,
                );
              }
            } else if (payload.type === "INFO" && payload.content === "TIME_UPDATE") {
              setRemainingSeconds(payload.remainingSeconds ?? null);
            } else if (payload.type === "START") {
              setSession(prev => prev ? { ...prev, status: "VOTING_ROUND_1", currentRound: 1 } : prev);
              setRemainingSeconds(60);
            } else if (payload.type === "SESSION" && payload.session) {
              const normalized = normalizeSession(payload.session);
              setSession(normalized);
              setVoteCounts(getVoteCountsFromSession(normalized));
            } else if (payload.type === "ROUND_CHANGE") {
              setSession((prev) =>
                prev ? {
                  ...prev,
                  currentRound: payload.currentRound ?? 2,
                  round1WinnerId: payload.round1WinnerId,
                  status: "VOTING_ROUND_2"
                } : prev,
              );
            } else if (payload.type === "END") {
              setSession((prev) =>
                prev
                  ? {
                    ...prev,
                    status: "END",
                    round2VoteSuccessCount: payload.round2VoteSuccessCount,
                    round2VoteFailCount: payload.round2VoteFailCount,
                  }
                  : prev,
              );
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
      destination: `/app/battle/${sessionId}/chat`,
      body: JSON.stringify({
        senderId: null,
        senderNickname: session?.hostNickname ?? "나",
        content,
      }),
    });
    setNewMessage("");
  };

  const handleChatScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (!hasMoreHistory || isLoadingHistory) return;
    if (event.currentTarget.scrollTop <= 80) {
      loadHistoryPage(historyPage + 1, false);
    }
  };

  // Winner Navigation
  useEffect(() => {
    if (session?.currentRound === 2 && session.round1WinnerId === currentUserId) {
      // 승자는 After 페이지로 이동 (중복 이동 방지는 라우터가 처리하거나, useEffect 의존성 관리)
      router.replace("/after");
    }
  }, [session?.currentRound, session?.round1WinnerId, currentUserId, router]);

  const getStatusText = (status?: string) => {
    switch (status) {
      case "WAITING_SPECTATORS": return "관전자 대기 중";
      case "VOTING_ROUND_1": return "1라운드 투표 중";
      case "VOTING_ROUND_2": return "애프터 결과 확인 중";
      case "END": return "배틀 종료";
      default: return status ?? "--";
    }
  };

  if (session?.status === "END") {
    const isHostWinner = session.round1WinnerId === session.hostId;
    const winner = isHostWinner
      ? {
        username: session.hostNickname ?? "PLAYER 1",
        outfit: {
          name: "Winner Outfit",
          previewUrl: session.hostOutfitA?.previewUrl ?? "",
        },
      }
      : {
        username: session.guestNickname ?? "PLAYER 2",
        outfit: {
          name: "Winner Outfit",
          previewUrl: session.guestOutfitA?.previewUrl ?? "",
        },
      };
    const loser = isHostWinner
      ? {
        username: session.guestNickname ?? "PLAYER 2",
        outfit: {
          name: "Loser Outfit",
          previewUrl: session.guestOutfitA?.previewUrl ?? "",
        },
      }
      : {
        username: session.hostNickname ?? "PLAYER 1",
        outfit: {
          name: "Loser Outfit",
          previewUrl: session.hostOutfitA?.previewUrl ?? "",
        },
      };

    const successCount = session.round2VoteSuccessCount ?? 0;
    const failCount = session.round2VoteFailCount ?? 0;
    const isAfterSuccess = successCount >= failCount;

    return (
      <ResultPage
        player1={winner}
        player2={loser}
        isWinner={true}
        isAfterSuccess={isAfterSuccess}
        onBack={() => router.push("/landing")}
      />
    );
  }

  return (
    <div className="h-screen relative overflow-hidden bg-gradient-to-br from-cyan-100 via-pink-100 to-yellow-100">
      <PatternBackground type="stars" />

      <div className="relative z-10 h-full w-full p-4 md:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-full border-3 border-black font-black text-sm">
            라운드 {session?.currentRound ?? "--"}
          </div>
          <div className="bg-white px-4 py-2 rounded-full border-3 border-black font-black text-sm">
            상태: {getStatusText(session?.status)}
          </div>
          <div className="bg-red-500 text-white px-4 py-2 rounded-full border-3 border-black font-black text-sm animate-pulse">
            남은 시간: {remainingSeconds ?? "--"}초
          </div>
        </div>
        <div className="h-full grid gap-6 md:grid-cols-[1fr_1fr_0.8fr]">
          {/* Round 2: Winner View + Voting Buttons */}
          {(session?.currentRound ?? 1) >= 2 ? (
            <div className="col-span-2 flex flex-col items-center justify-center p-4">
              {/* Winner Card */}
              <section className="w-full max-w-md bg-white rounded-3xl border-6 border-black shadow-[10px_10px_0px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col mb-6">
                <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 px-6 py-4 text-white font-black text-xl flex justify-between items-center">
                  <span>{session?.round1WinnerId === session?.hostId ? session?.hostNickname : session?.guestNickname} (승자)</span>
                </div>
                <div className="p-4 border-b-4 border-black flex items-center justify-center">
                  <div className="w-full h-80 rounded-xl border-3 border-black bg-white overflow-hidden">
                    <img
                      src={session?.round1WinnerId === session?.hostId ? session?.hostOutfitA?.previewUrl : session?.guestOutfitA?.previewUrl}
                      alt="Winner"
                      className="h-full w-full object-contain bg-white"
                    />
                  </div>
                </div>
                <div className="p-4 bg-yellow-50 font-bold text-gray-800 border-t-4 border-black min-h-[100px] whitespace-pre-wrap">
                  {(() => {
                    const isHostWinner = session?.round1WinnerId === session?.hostId;
                    const ment = isHostWinner ? session?.hostMent : session?.guestMent;
                    return ment ? ment : <span className="text-gray-400">멘트 작성 중...</span>;
                  })()}
                </div>
              </section>

              {/* Voting Buttons for Spectators */}
              <div className="flex gap-4">
                <button
                  onClick={() => handleVote(undefined, "SUCCESS")}
                  disabled={!isWsConnected || !((session?.round1WinnerId === session?.hostId ? session?.hostMent : session?.guestMent))}
                  className="bg-pink-500 text-white px-8 py-4 rounded-2xl border-4 border-black font-black text-xl shadow-[6px_6px_0px_rgba(0,0,0,0.3)] hover:translate-y-1 active:translate-y-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  💖 성공! ({voteCounts.voteA})
                </button>
                <button
                  onClick={() => handleVote(undefined, "FAIL")}
                  disabled={!isWsConnected || !((session?.round1WinnerId === session?.hostId ? session?.hostMent : session?.guestMent))}
                  className="bg-gray-500 text-white px-8 py-4 rounded-2xl border-4 border-black font-black text-xl shadow-[6px_6px_0px_rgba(0,0,0,0.3)] hover:translate-y-1 active:translate-y-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  💔 실패... ({voteCounts.voteB})
                </button>
              </div>
            </div>
          ) : (
            /* Round 1: Two Players */
            [
              {
                label: session?.hostNickname ?? "PLAYER 1",
                previewUrl: session?.hostOutfitA?.previewUrl,
                ment: session?.hostMent,
                targetId: session?.hostId,
                currentVotes: voteCounts.voteA,
                fallbackVote: "SUCCESS" as const,
              },
              {
                label: session?.guestNickname ?? "PLAYER 2",
                previewUrl: session?.guestOutfitA?.previewUrl,
                ment: session?.guestMent,
                targetId: session?.guestId,
                currentVotes: voteCounts.voteB,
                fallbackVote: "FAIL" as const,
              },
            ].map((player, index) => {
              return (
                <section
                  key={`player-${index}`}
                  className="bg-white rounded-3xl border-6 border-black shadow-[10px_10px_0px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col min-h-0"
                >
                  <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 px-6 py-4 text-white font-black text-xl flex justify-between items-center">
                    <span>{player.label}</span>
                    <button
                      onClick={() => handleVote(player.targetId, player.fallbackVote)}
                      disabled={!isWsConnected || !player.targetId}
                      className="bg-white text-black px-4 py-1.5 rounded-full text-sm font-black border-2 border-black hover:bg-gray-100 disabled:opacity-50 active:scale-95 transition-transform"
                    >
                      👍 투표 {player.currentVotes}
                    </button>
                  </div>
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex-[3] p-4 border-b-4 border-black flex items-center justify-center min-h-0">
                      <div className="w-full h-full rounded-xl border-3 border-black bg-white overflow-hidden">
                        {player.previewUrl ? (
                          <img
                            src={player.previewUrl}
                            alt={player.label}
                            className="h-full w-full object-contain bg-white"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-500 font-bold">
                            이미지 없음
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Round 1 Ment (Optional or Hidden) */}
                  </div>
                </section>
              );
            })
          )}

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
            <div
              ref={chatListRef}
              onScroll={handleChatScroll}
              className="flex-1 overflow-y-auto p-4 space-y-3"
            >
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
              {isLoadingHistory && (
                <div className="text-xs text-gray-500 font-bold text-center">
                  이전 채팅을 불러오는 중...
                </div>
              )}
            </div>
            <div className="border-t-4 border-black p-4 flex items-center gap-3 bg-yellow-50">
              <input
                value={newMessage}
                onChange={(event) => setNewMessage(event.target.value)}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isComposing) {
                    e.preventDefault();
                    sendChatMessage();
                  }
                }}
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
