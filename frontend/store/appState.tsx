"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchWithAuth } from "@/utils/apiClient";
import { ClothingItem, SavedOutfit } from "@/types/models";

interface AppState {
  token: string | null;
  refreshToken: string | null;
  savedOutfits: SavedOutfit[];
  deckSlot1: SavedOutfit | undefined;
  deckSlot2: SavedOutfit | undefined;
  selectedBattleOutfit: SavedOutfit | null;
  battleSessionId: number | null;
  opponentProfile: {
    id: number;
    nickname: string;
    winCount: number;
  } | null;
  battleMessage: string;
  isWinner: boolean;
  afterMessage: string;
  isAfterSuccess: boolean;
  opponentOutfit: SavedOutfit;
  setToken: (token: string | null) => void;
  setSessionTokens: (accessToken: string, refreshToken: string) => void;
  clearSessionTokens: () => void;
  setSavedOutfits: (outfits: SavedOutfit[]) => void;
  addOutfit: (outfit: SavedOutfit) => Promise<void>;
  updateOutfit: (id: number, updatedOutfit: SavedOutfit) => void;
  deleteOutfit: (id: number) => void;
  updateDeck: (slot: 1 | 2, outfit: SavedOutfit | undefined) => void;
  selectBattleOutfit: (outfit: SavedOutfit) => void;
  setBattleSessionId: (sessionId: number | null) => void;
  setOpponentProfile: (
    profile: { id: number; nickname: string; winCount: number } | null,
  ) => void;
  setOpponentOutfit: (outfit: SavedOutfit) => void;
  setBattleMessage: (message: string) => void;
  setBattleResult: (winner: boolean) => void;
  submitAfterMessage: (message: string) => boolean;
  resetBattle: () => void;
}

const opponentOutfit: SavedOutfit = {
  id: 11,
  name: "Opponent Outfit",
  previewUrl: "imageurl",
  topId: 13,
  bottomId: 12,
  outerId: 14,
  createdAt: "2023-10-01T00:00:00Z",
};

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [savedOutfits, setSavedOutfitsState] = useState<SavedOutfit[]>([]);
  const [deckSlot1, setDeckSlot1] = useState<SavedOutfit | undefined>(
    undefined,
  );
  const [deckSlot2, setDeckSlot2] = useState<SavedOutfit | undefined>(
    undefined,
  );
  const [selectedBattleOutfit, setSelectedBattleOutfit] =
    useState<SavedOutfit | null>(null);
  const [battleSessionId, setBattleSessionId] = useState<number | null>(null);
  const [opponentProfile, setOpponentProfile] = useState<{
    id: number;
    nickname: string;
    winCount: number;
  } | null>(null);
  const [battleMessage, setBattleMessage] = useState("");
  const [isWinner, setIsWinner] = useState(false);
  const [afterMessage, setAfterMessage] = useState("");
  const [isAfterSuccess, setIsAfterSuccess] = useState(false);
  const [opponentOutfitState, setOpponentOutfitState] =
    useState<SavedOutfit>(opponentOutfit);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const accessToken = localStorage.getItem("accessToken");
    const refreshTokenValue = localStorage.getItem("refreshToken");
    if (accessToken) {
      setToken(accessToken);
    }
    if (refreshTokenValue) {
      setRefreshToken(refreshTokenValue);
    }
  }, []);

  const setSessionTokens = (accessToken: string, refreshTokenValue: string) => {
    setToken(accessToken);
    setRefreshToken(refreshTokenValue);
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshTokenValue);
    }
  };

  const clearSessionTokens = () => {
    setToken(null);
    setRefreshToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
  };

  const setSavedOutfits = (outfits: SavedOutfit[]) => {
    setSavedOutfitsState(outfits);
  };

  const addOutfit = async (outfit: SavedOutfit) => {
    const name = outfit.name || `코디 ${savedOutfits.length + 1}`;
    const previewUrl = outfit.previewUrl ?? "";
    const response = await fetchWithAuth("/outfits", {
      method: "POST",
      body: JSON.stringify({
        name,
        topId: outfit.topId || null,
        bottomId: outfit.bottomId || null,
        outerId: outfit.outerId || null,
        previewUrl,
      }),
    });

    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as { id: number };
    const newOutfit: SavedOutfit = {
      id: data.id,
      name,
      topId: outfit.topId || 0,
      bottomId: outfit.bottomId || 0,
      outerId: outfit.outerId || 0,
      previewUrl,
      createdAt: new Date().toISOString(),
    };
    setSavedOutfitsState((prev) => [...prev, newOutfit]);
  };

  const updateOutfit = (id: number, updatedOutfit: SavedOutfit) => {
    setSavedOutfitsState((prev) =>
      prev.map((outfit) =>
        outfit.id === id ? { ...updatedOutfit, id } : outfit,
      ),
    );
  };

  const deleteOutfit = (id: number) => {
    setSavedOutfitsState((prev) => prev.filter((outfit) => outfit.id !== id));
    setDeckSlot1((prev) => (prev?.id === id ? undefined : prev));
    setDeckSlot2((prev) => (prev?.id === id ? undefined : prev));
    setSelectedBattleOutfit((prev) => (prev?.id === id ? null : prev));
  };

  const updateDeck = (slot: 1 | 2, outfit: SavedOutfit | undefined) => {
    if (slot === 1) {
      setDeckSlot1(outfit);
    } else {
      setDeckSlot2(outfit);
    }
  };

  const selectBattleOutfit = (outfit: SavedOutfit) => {
    setSelectedBattleOutfit(outfit);
    setBattleMessage("");
    setIsWinner(false);
    setAfterMessage("");
    setIsAfterSuccess(false);
  };

  const setOpponentOutfit = (outfit: SavedOutfit) => {
    setOpponentOutfitState(outfit);
  };

  const setBattleResult = (winner: boolean) => {
    setIsWinner(winner);
  };

  const submitAfterMessage = (message: string) => {
    setAfterMessage(message);
    const positiveKeywords = [
      "좋아",
      "사랑",
      "멋져",
      "예쁘",
      "함께",
      "데이트",
      "영화",
      "커피",
      "산책",
    ];
    const hasPositiveWord = positiveKeywords.some((keyword) =>
      message.includes(keyword),
    );
    const isLongEnough = message.length >= 10;
    const success = hasPositiveWord && isLongEnough;
    setIsAfterSuccess(success);
    return success;
  };

  const resetBattle = () => {
    setSelectedBattleOutfit(null);
    setBattleSessionId(null);
    setOpponentProfile(null);
    setBattleMessage("");
    setIsWinner(false);
    setAfterMessage("");
    setIsAfterSuccess(false);
  };

  const value = useMemo<AppState>(
    () => ({
      token,
      refreshToken,
      savedOutfits,
      deckSlot1,
      deckSlot2,
      selectedBattleOutfit,
      battleSessionId,
      opponentProfile,
      battleMessage,
      isWinner,
      afterMessage,
      isAfterSuccess,
      opponentOutfit: opponentOutfitState,
      setToken,
      setSessionTokens,
      clearSessionTokens,
      setSavedOutfits,
      addOutfit,
      updateOutfit,
      deleteOutfit,
      updateDeck,
      selectBattleOutfit,
      setBattleSessionId,
      setOpponentProfile,
      setOpponentOutfit,
      setBattleMessage,
      setBattleResult,
      submitAfterMessage,
      resetBattle,
    }),
    [
      token,
      refreshToken,
      savedOutfits,
      deckSlot1,
      deckSlot2,
      selectedBattleOutfit,
      battleSessionId,
      opponentProfile,
      battleMessage,
      isWinner,
      afterMessage,
      isAfterSuccess,
      opponentOutfitState,
    ],
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return context;
}
