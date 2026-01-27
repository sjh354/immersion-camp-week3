"use client";

import { useParams } from "next/navigation";
import { useAuthGate } from "@/hooks/useAuthGate";
import { BattleSessionView } from "@/_components/battle/BattleSessionView";

export default function BattleVoteDetailPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId =
    typeof params.sessionId === "string" ? Number(params.sessionId) : NaN;
  useAuthGate();

  if (!Number.isFinite(sessionId)) return null;

  return <BattleSessionView sessionId={sessionId} />;
}
