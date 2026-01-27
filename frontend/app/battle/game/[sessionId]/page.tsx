"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthGate } from "@/hooks/useAuthGate";
import { BattleSessionView } from "@/_components/battle/BattleSessionView";

export default function BattleGameSessionRoute() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  useAuthGate();

  const sessionId =
    typeof params.sessionId === "string" ? Number(params.sessionId) : NaN;

  useEffect(() => {
    if (!Number.isFinite(sessionId)) {
      router.replace("/battle/select");
    }
  }, [router, sessionId]);

  if (!Number.isFinite(sessionId)) return null;

  return <BattleSessionView sessionId={sessionId} />;
}
