"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthGate } from "@/hooks/useAuthGate";

export default function BattleGameRoute() {
  const router = useRouter();
  useAuthGate();

  useEffect(() => {
    router.replace("/battle/select");
  }, [router]);

  return null;
}
