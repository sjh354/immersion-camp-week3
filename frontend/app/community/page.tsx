"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Upload, MessageCircle, RefreshCw } from "lucide-react";
import { PatternBackground } from "@/_components/PatternBackground";
import { useAuthGate } from "@/hooks/useAuthGate";
import { fetchWithAuth } from "@/utils/apiClient";

interface PostItem {
  postId: number;
  nickname: string;
  previewUrl: string;
  content: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  createdAt: string;
}

interface OutfitItem {
  id: number;
  name: string;
  previewUrl: string;
}

type FeedFilter = "all" | "me";

export default function CommunityRoute() {
  const router = useRouter();
  useAuthGate();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [outfits, setOutfits] = useState<OutfitItem[]>([]);
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [selectedOutfitId, setSelectedOutfitId] = useState<number | "">("");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const feedEndpoint = useMemo(
    () => (filter === "me" ? "/posts/me" : "/posts"),
    [filter],
  );

  const loadCommunity = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [postRes, outfitRes] = await Promise.all([
        fetchWithAuth(`${feedEndpoint}?page=0&size=12&sort=latest`),
        fetchWithAuth("/outfits"),
      ]);

      if (!postRes.ok) {
        throw new Error("커뮤니티 피드를 불러오지 못했어요.");
      }
      if (!outfitRes.ok) {
        throw new Error("코디 목록을 불러오지 못했어요.");
      }

      const postData = (await postRes.json()) as PostItem[];
      const outfitData = (await outfitRes.json()) as OutfitItem[];
      setPosts(postData);
      setOutfits(outfitData);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "불러오기에 실패했어요.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCommunity();
  }, [feedEndpoint]);

  const handleShare = async () => {
    if (!selectedOutfitId || !content.trim()) {
      setErrorMessage("코디와 내용을 모두 입력해주세요.");
      return;
    }

    setIsPosting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await fetchWithAuth("/posts", {
        method: "POST",
        body: JSON.stringify({
          outfitId: selectedOutfitId,
          content: content.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error("게시글 등록에 실패했어요.");
      }

      setContent("");
      setSelectedOutfitId("");
      setSuccessMessage("코디가 커뮤니티에 공유되었어요!");
      await loadCommunity();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "게시글 등록에 실패했어요.",
      );
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-yellow-100 via-pink-100 to-orange-100">
      <PatternBackground type="stars" />

      <div className="relative z-10 p-8">
        <div className="max-w-6xl mx-auto space-y-10">
          <header className="text-center">
            <div
              className="inline-block bg-white px-8 py-5 rounded-xl border-5 border-black shadow-[6px_6px_0px_rgba(0,0,0,0.35)]"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, #fff 0px, #fff 10px, #ffe7c7 10px, #ffe7c7 20px)",
              }}
            >
              <h1
                className="text-5xl font-black text-orange-500 [text-shadow:_3px_3px_0_rgb(0_0_0)]"
                style={{ fontFamily: "Impact, fantasy" }}
              >
                커뮤니티 💬
              </h1>
              <p
                className="text-xl font-black text-pink-500 mt-2 [text-shadow:_2px_2px_0_rgb(255_255_255)]"
                style={{ fontFamily: "Impact, fantasy" }}
              >
                내 코디를 공유하고 반응을 받아보세요!
              </p>
            </div>
          </header>

          <section className="bg-white rounded-2xl border-6 border-black shadow-[10px_10px_0px_rgba(0,0,0,0.4)] p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h2
                  className="text-3xl font-black text-black"
                  style={{ fontFamily: "Impact, fantasy" }}
                >
                  오늘의 코디를 올려볼까요?
                </h2>
                <p
                  className="text-lg font-bold text-gray-700 mt-2"
                  style={{ fontFamily: "Impact, fantasy" }}
                >
                  저장한 코디를 선택해서 커뮤니티에 공유하세요.
                </p>
              </div>
              <button
                onClick={() => router.push("/dressup")}
                className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-500 via-pink-500 to-red-500 text-white px-6 py-4 rounded-xl border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.35)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
              >
                <Upload className="w-6 h-6" strokeWidth={3} />
                <span
                  className="text-xl font-black"
                  style={{ fontFamily: "Impact, fantasy" }}
                >
                  코디 만들기
                </span>
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.2fr_2fr]">
              <div className="space-y-3">
                <label
                  className="text-base font-black text-black"
                  style={{ fontFamily: "Impact, fantasy" }}
                >
                  공유할 코디
                </label>
                <select
                  value={selectedOutfitId}
                  onChange={(event) =>
                    setSelectedOutfitId(
                      event.target.value ? Number(event.target.value) : "",
                    )
                  }
                  className="w-full border-4 border-black rounded-xl px-4 py-3 font-bold"
                >
                  <option value="">코디를 선택하세요</option>
                  {outfits.map((outfit) => (
                    <option key={outfit.id} value={outfit.id}>
                      {outfit.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs font-bold text-gray-600">
                  코디가 보이지 않으면 꾸미기에서 저장 후 다시 돌아와주세요.
                </p>
              </div>
              <div className="space-y-3">
                <label
                  className="text-base font-black text-black"
                  style={{ fontFamily: "Impact, fantasy" }}
                >
                  코디 설명
                </label>
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  className="w-full min-h-[120px] border-4 border-black rounded-xl px-4 py-3 font-bold"
                  placeholder="코디 소개나 한줄 코멘트를 적어주세요."
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="text-sm font-bold text-red-500">
                {errorMessage}
              </div>
              <div className="text-sm font-bold text-green-600">
                {successMessage}
              </div>
              <button
                onClick={handleShare}
                disabled={isPosting}
                className="inline-flex items-center gap-3 bg-black text-white px-6 py-3 rounded-xl border-4 border-black shadow-[4px_4px_0px_rgba(255,255,255,0.3)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Upload className="w-5 h-5" strokeWidth={3} />
                <span
                  className="text-lg font-black"
                  style={{ fontFamily: "Impact, fantasy" }}
                >
                  공유하기
                </span>
              </button>
            </div>
          </section>

          <section className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-xl border-4 border-black font-black ${
                filter === "all"
                  ? "bg-black text-white"
                  : "bg-white text-black"
              }`}
            >
              전체 피드
            </button>
            <button
              onClick={() => setFilter("me")}
              className={`px-4 py-2 rounded-xl border-4 border-black font-black ${
                filter === "me"
                  ? "bg-black text-white"
                  : "bg-white text-black"
              }`}
            >
              내 게시글
            </button>
            <button
              onClick={loadCommunity}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-4 border-black font-black bg-white"
            >
              <RefreshCw className="w-4 h-4" strokeWidth={3} />
              새로고침
            </button>
            {isLoading && (
              <span className="text-sm font-bold text-gray-700">
                불러오는 중...
              </span>
            )}
          </section>

          <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post.postId}
                className="bg-white border-6 border-black rounded-2xl shadow-[8px_8px_0px_rgba(0,0,0,0.35)] overflow-hidden"
              >
                <div className="h-48 bg-gradient-to-br from-cyan-100 via-pink-100 to-yellow-100 flex items-center justify-center overflow-hidden">
                  {post.previewUrl ? (
                    <img
                      src={post.previewUrl}
                      alt={post.content}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Sparkles className="w-14 h-14 text-orange-400" strokeWidth={3} />
                  )}
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3
                      className="text-2xl font-black text-black"
                      style={{ fontFamily: "Impact, fantasy" }}
                    >
                      {post.nickname}
                    </h3>
                    <span className="text-xs font-bold text-gray-500">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p
                    className="text-sm font-bold text-gray-700"
                    style={{ fontFamily: "Impact, fantasy" }}
                  >
                    {post.content}
                  </p>
                  <div className="flex items-center justify-between text-xs font-bold text-gray-600">
                    <span>좋아요 {post.likeCount}</span>
                    <span>댓글 {post.commentCount}</span>
                    <button className="inline-flex items-center gap-2 text-pink-500">
                      <MessageCircle className="w-4 h-4" strokeWidth={3} />
                      반응 달기
                    </button>
                  </div>
                </div>
              </article>
            ))}
            {!isLoading && posts.length === 0 && (
              <div className="col-span-full bg-white border-6 border-black rounded-2xl p-10 text-center shadow-[8px_8px_0px_rgba(0,0,0,0.35)]">
                <p
                  className="text-2xl font-black text-gray-600"
                  style={{ fontFamily: "Impact, fantasy" }}
                >
                  아직 공유된 코디가 없어요. 첫 게시글을 올려주세요!
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
