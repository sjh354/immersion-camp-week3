 "use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppState } from "@/store/appState";
import { useAuthGate } from "@/hooks/useAuthGate";
import ResultPage from "@/_components/result/ResultPage";

export default function ResultRoute() {
  const router = useRouter();
  const {
    selectedBattleOutfit,
    opponentOutfit,
    isWinner,
    isAfterSuccess,
    resetBattle,
  } = useAppState();
  useAuthGate();

  useEffect(() => {
    if (!selectedBattleOutfit) {
      router.replace("/landing");
    }
  }, [router, selectedBattleOutfit]);

  if (!selectedBattleOutfit) {
    return null;
  }

  return (
    <ResultPage
      player1={{
        username: "플레이어",
        outfit: selectedBattleOutfit,
      }}
      player2={{
        username: "상대방",
        outfit: opponentOutfit,
      }}
      isWinner={isWinner}
      isAfterSuccess={isAfterSuccess}
      onBack={() => {
        resetBattle();
        router.push("/landing");
      }}
    />
  );
}
