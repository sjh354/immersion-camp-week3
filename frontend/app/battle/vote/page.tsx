"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Heart, MessageCircle, Sparkles } from "lucide-react";
import { PatternBackground } from "@/_components/PatternBackground";
import { useAuthGate } from "@/hooks/useAuthGate";
import { fetchWithAuth } from "@/utils/apiClient";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

interface BattleSessionSummary {
  sessionId: number;
  player1: { nickname: string; previewUrl: string };
  player2: { nickname: string; previewUrl: string };
  endsIn?: string;
  remainingSeconds?: number;
  voteA?: number;
  voteB?: number;
  spectatorCount?: number;
}

interface LobbyResponse {
  sessionId: number;
  hostNickname?: string | null;
  guestNickname?: string | null;
  hostPreviewUrl?: string | null;
  guestPreviewUrl?: string | null;
  hostVoteCount?: number | null;
  guestVoteCount?: number | null;
  status?: string | null;
  remainingSeconds?: number | null;
  spectatorCount?: number | null;
}

const mapLobbySession = (session: LobbyResponse): BattleSessionSummary => ({
  sessionId: session.sessionId,
  player1: {
    nickname: session.hostNickname ?? "PLAYER 1",
    previewUrl: session.hostPreviewUrl ?? "",
  },
  player2: {
    nickname: session.guestNickname ?? "PLAYER 2",
    previewUrl: session.guestPreviewUrl ?? "",
  },
  remainingSeconds: session.remainingSeconds ?? undefined,
  voteA: session.hostVoteCount ?? 0,
  voteB: session.guestVoteCount ?? 0,
  spectatorCount: session.spectatorCount ?? 0,
});

const formatSeconds = (seconds?: number) => {
  if (typeof seconds !== "number" || Number.isNaN(seconds)) return "--:--";
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60)
    .toString()
    .padStart(2, "0");
  const secs = (safe % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
};

const getSpectatorBadgeClass = (count: number) => {
  if (count >= 3) return "bg-emerald-500 text-white";
  if (count === 2) return "bg-orange-400 text-black";
  if (count === 1) return "bg-yellow-300 text-black";
  return "bg-gray-300 text-gray-800";
};

export default function BattleVoteRoute() {
  const router = useRouter();
  useAuthGate();
  const [sessions, setSessions] = useState<BattleSessionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const clientRef = useRef<Client | null>(null);
  const lastTimeUpdateRef = useRef<Record<number, number>>({});

  const touchSessions = (next: BattleSessionSummary[]) => {
    const now = Date.now();
    next.forEach((session) => {
      if (typeof session.remainingSeconds === "number") {
        lastTimeUpdateRef.current[session.sessionId] = now;
      }
    });
    return next;
  };

  useEffect(() => {
    let cancelled = false;
    const loadSessions = async () => {
      try {
        const res = await fetchWithAuth("/battle/lobby");
        if (!res.ok) return;
        const data = (await res.json()) as LobbyResponse[];
        if (!cancelled) {
          const mapped = Array.isArray(data) ? data.map(mapLobbySession) : [];
          setSessions(touchSessions(mapped));
        }
      } catch {
        if (!cancelled) setSessions([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    loadSessions();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setSessions((prev) =>
        prev.map((session) => {
          if (typeof session.remainingSeconds !== "number") return session;
          if (session.remainingSeconds <= 0) return session;
          const lastUpdate = lastTimeUpdateRef.current[session.sessionId] ?? 0;
          if (Date.now() - lastUpdate < 1100) return session;
          lastTimeUpdateRef.current[session.sessionId] = Date.now();
          return {
            ...session,
            remainingSeconds: Math.max(0, session.remainingSeconds - 1),
          };
        }),
      );
    }, 1000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const wsBase = process.env.NEXT_PUBLIC_WS_URL;
    if (!wsBase) return;
    const client = new Client({
      webSocketFactory: () => new SockJS(wsBase),
      onConnect: () => {
        client.subscribe("/topic/battle/lobby", (msg) => {
          try {
            const payload = JSON.parse(msg.body) as
              | LobbyResponse[]
              | { sessions?: LobbyResponse[] }
              | {
                  type?: string;
                  content?: string;
                  sessionId?: number;
                  remainingSeconds?: number | null;
                };

            if (
              typeof payload === "object" &&
              !Array.isArray(payload) &&
              (payload as { type?: string }).type === "INFO" &&
              (payload as { content?: string }).content === "TIME_UPDATE" &&
              typeof (payload as { sessionId?: number }).sessionId === "number"
            ) {
              const sessionId = (payload as { sessionId: number }).sessionId;
              const remainingSeconds = (payload as {
                remainingSeconds?: number | null;
              }).remainingSeconds;
              lastTimeUpdateRef.current[sessionId] = Date.now();
              setSessions((prev) =>
                prev.map((session) =>
                  session.sessionId === sessionId
                    ? { ...session, remainingSeconds: remainingSeconds ?? undefined }
                    : session,
                ),
              );
              return;
            }

            const nextSessions = Array.isArray(payload)
              ? payload
              : "sessions" in payload && Array.isArray(payload.sessions)
                ? payload.sessions
                : [];
            if (Array.isArray(nextSessions) && nextSessions.length > 0) {
              setSessions(touchSessions(nextSessions.map(mapLobbySession)));
            } else {
              void fetchWithAuth("/battle/lobby")
                .then((res) => (res.ok ? res.json() : []))
                .then((data) =>
                  setSessions(
                    touchSessions(
                      Array.isArray(data)
                        ? (data as LobbyResponse[]).map(mapLobbySession)
                        : [],
                    ),
                  ),
                )
                .catch(() => undefined);
            }
          } catch {
            // ignore invalid payload
          }
        });
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      clientRef.current = null;
      client.deactivate();
    };
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-cyan-100 via-pink-100 to-yellow-100">
      <PatternBackground type="stars" />

      <div className="relative z-10 p-6 md:p-10">
        <div className="max-w-6xl mx-auto space-y-8">
          <header className="text-center">
            <div
              className="inline-block bg-white px-8 py-5 rounded-xl border-5 border-black shadow-[6px_6px_0px_rgba(0,0,0,0.35)]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, #fff 0px, #fff 10px, #dff5ff 10px, #dff5ff 20px)",
              }}
            >
              <h1
                className="text-5xl font-black text-cyan-600 [text-shadow:_3px_3px_0_rgb(0_0_0)]"
                style={{ fontFamily: "Impact, fantasy" }}
              >
                실시간 투표
              </h1>
              <p
                className="text-xl font-black text-pink-500 mt-2 [text-shadow:_2px_2px_0_rgb(255_255_255)]"
                style={{ fontFamily: "Impact, fantasy" }}
              >
                진행 중인 배틀에 참여하고 투표해 보세요!
              </p>
            </div>
          </header>

          <section className="grid gap-6 md:grid-cols-2">
            {!isLoading && sessions.length === 0 && (
              <div className="md:col-span-2 text-center text-lg font-black text-purple-600">
                진행 중인 배틀이 없습니다.
              </div>
            )}
            {sessions.map((session) => (
              <div
                key={session.sessionId}
                onClick={() => router.push(`/battle/vote/${session.sessionId}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    router.push(`/battle/vote/${session.sessionId}`);
                  }
                }}
                role="button"
                tabIndex={0}
                className="group relative bg-white rounded-3xl border-6 border-black shadow-[10px_10px_0px_rgba(0,0,0,0.35)] overflow-hidden hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
              >
                <div className="flex items-center justify-between bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-white" strokeWidth={3} />
                    <span
                      className="text-xl font-black text-white"
                      style={{ fontFamily: "Impact, fantasy" }}
                    >
                      배틀 #{session.sessionId}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(session.spectatorCount ?? 0) >= 3 ? (
                      <div
                        className={`px-3 py-1 rounded-full border-3 border-black text-xs font-black bg-white text-gray-700`}
                      >
                        관전자 {session.spectatorCount ?? 0}명
                      </div>
                    ) : (
                      <div
                        className={`px-3 py-1 rounded-full border-3 border-black text-xs font-black ${getSpectatorBadgeClass(
                          session.spectatorCount ?? 0,
                        )}`}
                      >
                        시작 대기 {session.spectatorCount ?? 0}/3
                      </div>
                    )}
                    <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border-3 border-black">
                      <Clock
                        className="w-4 h-4 text-pink-500"
                        strokeWidth={3}
                      />
                      <span className="text-sm font-black text-purple-600">
                        {session.endsIn ??
                          formatSeconds(session.remainingSeconds)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 p-6">
                  {[
                    {
                      ...session.player1,
                      votes: session.voteA ?? 0,
                    },
                    {
                      ...session.player2,
                      votes: session.voteB ?? 0,
                    },
                  ].map((player, index) => (
                    <div
                      key={`${session.sessionId}-${index}`}
                      className="bg-gradient-to-b from-pink-50 to-cyan-50 rounded-2xl border-4 border-black overflow-hidden"
                    >
                      <div className="h-48 bg-white border-b-4 border-black">
                        <img
                          src={player.previewUrl}
                          alt={player.nickname}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="p-4 text-center">
                        <p
                          className="text-lg font-black text-purple-600"
                          style={{ fontFamily: "Impact, fantasy" }}
                        >
                          {player.nickname}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between px-6 pb-6 gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs font-black text-gray-700 mb-2">
                      <span>
                        {Math.round(
                          ((session.voteA ?? 0) /
                            Math.max(
                              1,
                              (session.voteA ?? 0) + (session.voteB ?? 0),
                            )) *
                          100,
                        )}
                        % ({session.voteA ?? 0}표)
                      </span>
                      <span>
                        {Math.round(
                          ((session.voteB ?? 0) /
                            Math.max(
                              1,
                              (session.voteA ?? 0) + (session.voteB ?? 0),
                            )) *
                          100,
                        )}
                        % ({session.voteB ?? 0}표)
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-full border-3 border-black bg-black overflow-hidden">
                      <div
                        className="h-full bg-pink-500"
                        style={{
                          width: `${Math.round(
                            ((session.voteA ?? 0) /
                              Math.max(
                                1,
                                (session.voteA ?? 0) + (session.voteB ?? 0),
                              )) *
                            100,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
