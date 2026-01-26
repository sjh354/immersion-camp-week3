"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit2, Trash2, Save, X } from "lucide-react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { PatternBackground } from "@/_components/PatternBackground";
import { useAppState } from "@/store/appState";
import { fetchWithAuth } from "@/utils/apiClient";
import { useAuthGate } from "@/hooks/useAuthGate";
import { SavedOutfit } from "@/types/models";

interface ProfilePageProps {
  username: string;
  nickname: string;
  winCount: number;
  lossCount: number;
  savedOutfits: SavedOutfit[];
  deck: (SavedOutfit | undefined)[];
  onBack: () => void;
  onUpdateOutfit: (id: number, outfit: SavedOutfit) => void;
  onDeleteOutfit: (id: number) => void;
  onUpdateDeck: (slot: 1 | 2, outfit: SavedOutfit | undefined) => void;
  onUpdateNickname: (nickname: string) => Promise<void>;
  onLogout: () => Promise<void>;
}

function DraggableOutfitCard({
  outfit,
  onEdit,
  onDelete,
  isInDeck,
}: {
  outfit: SavedOutfit;
  onEdit: () => void;
  onDelete: () => void;
  isInDeck: boolean;
}) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "outfit",
    item: outfit,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));
  const dragRef = useRef<HTMLDivElement | null>(null);
  drag(dragRef);

  return (
    <div
      ref={dragRef}
      className={`relative bg-white rounded-2xl border-5 border-black shadow-[6px_6px_0px_rgba(0,0,0,0.3)] p-4 transition-all hover:scale-105 cursor-move ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
      style={{
        backgroundImage: isInDeck
          ? "repeating-linear-gradient(45deg, #fff 0px, #fff 10px, #fef3c7 10px, #fef3c7 20px)"
          : "repeating-linear-gradient(45deg, #fff 0px, #fff 10px, #f0f9ff 10px, #f0f9ff 20px)",
      }}
    >
      {/* Deck Badge */}
      {isInDeck && (
        <div className="absolute -top-3 -left-3 bg-yellow-500 rounded-full px-3 py-1 border-3 border-black shadow-[2px_2px_0px_rgba(0,0,0,0.3)] z-10">
          <span
            className="text-xs font-black text-white"
            style={{ fontFamily: "Impact, fantasy" }}
          >
            🎴 덱
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="absolute top-2 right-2 flex gap-2 z-10">
        <button
          onClick={onEdit}
          className="bg-blue-500 p-2 rounded-lg border-3 border-black shadow-[2px_2px_0px_rgba(0,0,0,0.3)] hover:shadow-[3px_3px_0px_rgba(0,0,0,0.3)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
        >
          <Edit2 className="w-4 h-4 text-white" strokeWidth={3} />
        </button>
        <button
          onClick={onDelete}
          className="bg-red-500 p-2 rounded-lg border-3 border-black shadow-[2px_2px_0px_rgba(0,0,0,0.3)] hover:shadow-[3px_3px_0px_rgba(0,0,0,0.3)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
        >
          <Trash2 className="w-4 h-4 text-white" strokeWidth={3} />
        </button>
      </div>

      {/* Outfit Preview */}
      <div className="relative w-full h-64 bg-gradient-to-b from-purple-50 to-pink-50 rounded-xl overflow-hidden border-4 border-black mb-3">
        {outfit.previewUrl && (
          <img
            src={outfit.previewUrl}
            alt={outfit.name}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {/* Outfit Name */}
      <h3
        className="text-lg font-black text-purple-600 text-center [text-shadow:_2px_2px_0_rgb(255_255_255)]"
        style={{ fontFamily: "Impact, fantasy" }}
      >
        {outfit.name}
      </h3>
    </div>
  );
}

function DeckSlot({
  index,
  outfit,
  deck,
  onDrop,
  onRemove,
}: {
  index: number;
  outfit?: SavedOutfit;
  deck: (SavedOutfit | undefined)[];
  onDrop: (item: SavedOutfit, index: number) => void;
  onRemove: () => void;
}) {
  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: "outfit",
      canDrop: (item: SavedOutfit) => {
        // 현재 슬롯이 아닌 다른 슬롯에 이미 같은 코디가 있으면 드롭 불가
        const otherIndex = index === 0 ? 1 : 0;
        if (deck[otherIndex]?.id === item.id) {
          return false;
        }
        return true;
      },
      drop: (item: SavedOutfit) => {
        onDrop(item, index);
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop(),
      }),
    }),
    [deck, index],
  );
  const dropRef = useRef<HTMLDivElement | null>(null);
  drop(dropRef);

  return (
    <div
      ref={dropRef}
      className={`relative bg-white rounded-2xl border-5 shadow-[6px_6px_0px_rgba(0,0,0,0.3)] p-6 transition-all ${
        isOver && canDrop
          ? "border-pink-500 ring-4 ring-pink-400 scale-105"
          : isOver && !canDrop
            ? "border-red-500 ring-4 ring-red-400"
            : "border-black"
      }`}
      style={{
        backgroundImage: outfit
          ? "repeating-linear-gradient(45deg, #fff 0px, #fff 10px, #fef3c7 10px, #fef3c7 20px)"
          : "repeating-linear-gradient(45deg, #fff 0px, #fff 10px, #f3f3f3 10px, #f3f3f3 20px)",
      }}
    >
      {outfit ? (
        <>
          {/* Remove Button */}
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 bg-red-500 p-2 rounded-lg border-3 border-black shadow-[2px_2px_0px_rgba(0,0,0,0.3)] hover:shadow-[3px_3px_0px_rgba(0,0,0,0.3)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all z-10"
          >
            <X className="w-4 h-4 text-white" strokeWidth={3} />
          </button>

          {/* Outfit Preview */}
          <div className="relative w-full h-64 bg-gradient-to-b from-purple-50 to-pink-50 rounded-xl overflow-hidden border-4 border-black mb-3">
            {outfit.previewUrl && (
              <img
                src={outfit.previewUrl}
                alt={outfit.name}
                className="h-full w-full object-cover"
              />
            )}
          </div>

          <h3
            className="text-lg font-black text-yellow-600 text-center [text-shadow:_2px_2px_0_rgb(255_255_255)]"
            style={{ fontFamily: "Impact, fantasy" }}
          >
            {outfit.name}
          </h3>
        </>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center">
          <div className="text-6xl mb-4">📦</div>
          <p
            className="text-xl font-black text-gray-400 text-center"
            style={{ fontFamily: "Impact, fantasy" }}
          >
            덱 슬롯 {index + 1}
          </p>
          <p
            className="text-sm font-bold text-gray-500 text-center mt-2"
            style={{ fontFamily: "Impact, fantasy" }}
          >
            코디를 드래그해서 <br /> 여기에 놓으세요
          </p>
        </div>
      )}
    </div>
  );
}

function ProfilePageContent({
  username,
  nickname,
  winCount,
  lossCount,
  savedOutfits,
  deck,
  onBack,
  onUpdateOutfit,
  onDeleteOutfit,
  onUpdateDeck,
  onUpdateNickname,
  onLogout,
}: ProfilePageProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [nicknameDraft, setNicknameDraft] = useState(nickname);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setNicknameDraft(nickname);
  }, [nickname]);

  const handleDrop = (item: SavedOutfit, targetIndex: number) => {
    const targetSlot = (targetIndex + 1) as 1 | 2;

    // 타겟 슬롯에 추가 (canDrop에서 이미 검증됨)
    onUpdateDeck(targetSlot, item);
  };

  const handleRemoveFromDeck = (index: number) => {
    const slot = (index + 1) as 1 | 2;
    onUpdateDeck(slot, undefined);
  };

  const handleStartEdit = (outfit: SavedOutfit) => {
    setEditingId(outfit.id);
    setEditName(outfit.name);
  };

  const handleSaveEdit = () => {
    if (editingId) {
      const outfit = savedOutfits.find((o) => o.id === editingId);
      if (outfit) {
        onUpdateOutfit(editingId, { ...outfit, name: editName });
      }
      setEditingId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  return (
    <div className="h-screen bg-gradient-to-br from-purple-200 via-pink-200 to-cyan-200 relative overflow-hidden flex flex-col">
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
          👤 {username}의 프로필
        </h1>

        <div className="w-12"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 relative z-10">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border-5 border-black bg-white p-4 shadow-[4px_4px_0px_rgba(0,0,0,0.2)]">
              <p className="text-sm font-bold text-gray-500">승리</p>
              <p className="text-2xl font-black text-purple-600">{winCount}</p>
            </div>
            <div className="rounded-2xl border-5 border-black bg-white p-4 shadow-[4px_4px_0px_rgba(0,0,0,0.2)]">
              <p className="text-sm font-bold text-gray-500">패배</p>
              <p className="text-2xl font-black text-purple-600">{lossCount}</p>
            </div>
          </div>
          {/* Deck Section */}
          <div>
            <h2
              className="text-3xl font-black text-purple-600 mb-4 [text-shadow:_3px_3px_0_rgb(255_255_255)]"
              style={{ fontFamily: "Impact, fantasy" }}
            >
              🎴 내 덱 (최대 2개)
            </h2>
            <div className="grid grid-cols-2 gap-6">
              {[0, 1].map((index) => (
                <DeckSlot
                  key={index}
                  index={index}
                  outfit={deck[index]}
                  deck={deck}
                  onDrop={handleDrop}
                  onRemove={() => handleRemoveFromDeck(index)}
                />
              ))}
            </div>
          </div>

          {/* Saved Outfits Section */}
          <div>
            <h2
              className="text-3xl font-black text-purple-600 mb-4 [text-shadow:_3px_3px_0_rgb(255_255_255)]"
              style={{ fontFamily: "Impact, fantasy" }}
            >
              👔 저장된 코디
            </h2>
            <div className="grid grid-cols-3 gap-6">
              {savedOutfits.map((outfit) => (
                <div key={outfit.id}>
                  {editingId === outfit.id ? (
                    <div className="bg-white rounded-2xl border-5 border-black shadow-[6px_6px_0px_rgba(0,0,0,0.3)] p-4">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 text-lg font-bold border-4 border-black rounded-lg focus:outline-none focus:ring-4 focus:ring-purple-400 bg-white mb-3"
                        style={{ fontFamily: "Impact, fantasy" }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="flex-1 bg-green-500 p-2 rounded-lg border-3 border-black shadow-[2px_2px_0px_rgba(0,0,0,0.3)] hover:shadow-[3px_3px_0px_rgba(0,0,0,0.3)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
                        >
                          <Save
                            className="w-5 h-5 text-white mx-auto"
                            strokeWidth={3}
                          />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex-1 bg-gray-500 p-2 rounded-lg border-3 border-black shadow-[2px_2px_0px_rgba(0,0,0,0.3)] hover:shadow-[3px_3px_0px_rgba(0,0,0,0.3)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
                        >
                          <X
                            className="w-5 h-5 text-white mx-auto"
                            strokeWidth={3}
                          />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <DraggableOutfitCard
                      outfit={outfit}
                      onEdit={() => handleStartEdit(outfit)}
                      onDelete={() => onDeleteOutfit(outfit.id)}
                      isInDeck={deck.some((d) => d?.id === outfit.id)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border-5 border-black bg-white p-6 shadow-[6px_6px_0px_rgba(0,0,0,0.25)]">
            <h2
              className="text-2xl font-black text-purple-600 mb-4 [text-shadow:_2px_2px_0_rgb(255_255_255)]"
              style={{ fontFamily: "Impact, fantasy" }}
            >
              닉네임 수정
            </h2>
            <input
              className="w-full rounded-lg border-4 border-black bg-white px-4 py-3 text-lg font-bold focus:outline-none"
              value={nicknameDraft}
              onChange={(event) => setNicknameDraft(event.target.value)}
            />
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-lg border-4 border-black bg-pink-500 px-4 py-3 text-lg font-black text-white"
                disabled={!nicknameDraft.trim() || isSavingProfile}
                onClick={async () => {
                  setIsSavingProfile(true);
                  await onUpdateNickname(nicknameDraft.trim());
                  setIsSavingProfile(false);
                }}
              >
                수정하기
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg border-4 border-black bg-gray-200 px-4 py-3 text-lg font-black text-gray-800"
                disabled={isLoggingOut}
                onClick={async () => {
                  setIsLoggingOut(true);
                  await onLogout();
                  setIsLoggingOut(false);
                }}
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfilePage(props: ProfilePageProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <ProfilePageContent {...props} />
    </DndProvider>
  );
}

export default function ProfileRoute() {
  const router = useRouter();
  const {
    clearSessionTokens,
    savedOutfits,
    deckSlot1,
    deckSlot2,
    updateOutfit,
    deleteOutfit,
    updateDeck,
    setSavedOutfits,
  } = useAppState();
  const { skipAuth } = useAuthGate();
  const [profileNickname, setProfileNickname] = useState("플레이어");
  const [winCount, setWinCount] = useState(0);
  const [lossCount, setLossCount] = useState(0);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [profileRes, outfitsRes] = await Promise.all([
          fetchWithAuth("/members/me"),
          fetchWithAuth("/outfits"),
        ]);
        if (!profileRes.ok) {
          return;
        }
        const profileData = (await profileRes.json()) as {
          nickname: string;
          winCount: number;
          lossCount: number;
          deck?: Array<{
            outfitId: number;
            outfitName: string;
            previewUrl: string;
            topId?: number;
            bottomId?: number;
            outerId?: number;
            createdAt?: string;
          }>;
        };
        const deck = (profileData.deck ?? []).map((item) => ({
          id: item.outfitId,
          name: item.outfitName,
          previewUrl: item.previewUrl,
          topId: item.topId ?? 0,
          bottomId: item.bottomId ?? 0,
          outerId: item.outerId ?? 0,
          createdAt: item.createdAt ?? "",
        }));

        const outfitsPayload = outfitsRes.ok
          ? ((await outfitsRes.json()) as Array<{
              id: number;
              name: string;
              previewUrl: string;
              topId?: number;
              bottomId?: number;
              outerId?: number;
              createdAt?: string;
            }>)
          : [];
        const outfits =
          outfitsPayload.length > 0
            ? outfitsPayload.map((item) => ({
                id: item.id,
                name: item.name,
                previewUrl: item.previewUrl,
                topId: item.topId ?? 0,
                bottomId: item.bottomId ?? 0,
                outerId: item.outerId ?? 0,
                createdAt: item.createdAt ?? "",
              }))
            : (profileData.deck ?? []).map((item) => ({
                id: item.outfitId,
                name: item.outfitName,
                previewUrl: item.previewUrl,
                topId: 0,
                bottomId: 0,
                outerId: 0,
                createdAt: "",
              }));

        setProfileNickname(profileData.nickname ?? "플레이어");
        setWinCount(profileData.winCount ?? 0);
        setLossCount(profileData.lossCount ?? 0);
        setSavedOutfits(outfits);
        updateDeck(1, deck[0]);
        updateDeck(2, deck[1]);
      } catch {
        // ignore for now
      }
    };
    loadProfile();
  }, [skipAuth]);

  const handleUpdateNickname = async (nextNickname: string) => {
    const res = await fetchWithAuth("/members/me", {
      method: "PATCH",
      body: JSON.stringify({ nickname: nextNickname }),
    });
    if (!res.ok) {
      return;
    }
    setProfileNickname(nextNickname);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
    clearSessionTokens();
    router.push("/login");
  };

  return (
    <ProfilePage
      username={profileNickname || "플레이어"}
      nickname={profileNickname || "플레이어"}
      winCount={winCount}
      lossCount={lossCount}
      savedOutfits={savedOutfits}
      deck={[deckSlot1, deckSlot2]}
      onBack={() => router.push("/landing")}
      onUpdateOutfit={updateOutfit}
      onDeleteOutfit={deleteOutfit}
      onUpdateDeck={updateDeck}
      onUpdateNickname={handleUpdateNickname}
      onLogout={handleLogout}
    />
  );
}
