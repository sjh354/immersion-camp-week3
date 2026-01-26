"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PatternBackground } from "@/_components/PatternBackground";
import { fetchWithAuth } from "@/utils/apiClient";

type AvailabilityState = "idle" | "checking" | "available" | "taken" | "error";

export default function NicknameSetupPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [availability, setAvailability] = useState<AvailabilityState>("idle");
  const [isSaving, setIsSaving] = useState(false);

  const trimmedNickname = useMemo(() => nickname.trim(), [nickname]);

  const checkAvailability = async () => {
    if (!trimmedNickname) return;
    setAvailability("checking");
    try {
      const res = await fetchWithAuth(
        `/members/check?nickname=${encodeURIComponent(trimmedNickname)}`,
      );
      if (!res.ok) {
        throw new Error("check failed");
      }
      const data = (await res.json()) as { isAvailable: boolean };
      setAvailability(data.isAvailable ? "available" : "taken");
    } catch {
      setAvailability("error");
    }
  };

  const handleSave = async () => {
    if (!trimmedNickname) return;
    setIsSaving(true);
    try {
      const res = await fetchWithAuth("/members/onboarding", {
        method: "POST",
        body: JSON.stringify({ nickname: trimmedNickname }),
      });
      if (!res.ok) {
        throw new Error("onboarding failed");
      }
      await res.json();
      router.push("/landing");
    } catch {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-200 via-yellow-100 to-cyan-200 flex items-center justify-center p-6">
      <PatternBackground type="hearts" />
      <div className="w-full max-w-md z-101 rounded-2xl border-4 border-black bg-white p-6 shadow-[6px_6px_0px_rgba(0,0,0,0.35)]">
        <h1 className="text-2xl font-black text-purple-600">닉네임 설정</h1>
        <p className="mt-2 text-sm text-gray-600">
          새 회원이라면 닉네임을 입력해주세요.
        </p>
        <input
          className="mt-4 w-full rounded-lg border-4 border-black bg-white px-4 py-3 text-lg font-bold focus:outline-none"
          placeholder="닉네임"
          value={nickname}
          onChange={(event) => {
            setNickname(event.target.value);
            setAvailability("idle");
          }}
          onBlur={checkAvailability}
        />
        <p className="mt-2 text-sm text-gray-700">
          {availability === "checking" && "중복 확인 중..."}
          {availability === "available" && "사용 가능한 닉네임입니다."}
          {availability === "taken" && "이미 사용 중인 닉네임입니다."}
          {availability === "error" && "중복 확인에 실패했습니다."}
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-lg border-4 border-black bg-white px-4 py-3 text-lg font-black"
            onClick={checkAvailability}
            disabled={!trimmedNickname || availability === "checking"}
          >
            중복 확인
          </button>
          <button
            type="button"
            className="flex-1 rounded-lg border-4 border-black bg-pink-500 px-4 py-3 text-lg font-black text-white"
            disabled={
              !trimmedNickname || availability !== "available" || isSaving
            }
            onClick={handleSave}
          >
            저장하기
          </button>
        </div>
      </div>
    </main>
  );
}
