"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Star } from "lucide-react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { PatternBackground } from "@/_components/PatternBackground";
import { useAppState } from "@/store/appState";
import { fetchWithAuth } from "@/utils/apiClient";
import { useAuthGate } from "@/hooks/useAuthGate";
import { ClothingItem, ClothingCategory, SavedOutfit } from "@/types/models";

interface DressUpPageProps {
  username: string;
  onBack: () => void;
  onComplete: (outfit: SavedOutfit) => void;
}

// Draggable Clothing Item Component
function DraggableClothingItem({ item }: { item: ClothingItem }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "clothing",
    item: item,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));
  const dragRef = useRef<HTMLDivElement | null>(null);
  drag(dragRef);

  return (
    <div
      ref={dragRef}
      className={`rounded-xl border-4 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,0.3)] cursor-move transition-all hover:scale-105 ${
        isDragging ? "opacity-50" : "opacity-100"
      }`}
    >
      <div className="aspect-square flex flex-col items-center justify-center p-1">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="h-30 w-30 object-cover rounded-lg border-3 border-black shadow-[2px_2px_0px_rgba(0,0,0,0.25)]"
        />
        <span
          className="mt-2 text-xs font-black text-center [text-shadow:_1px_1px_0_rgb(255_255_255)]"
          style={{ fontFamily: "Impact, fantasy" }}
        >
          {item.name}
        </span>
      </div>
    </div>
  );
}

// Drop Zone Component
function DropZone({
  onDrop,
  outfit,
  resultImageUrl,
  isGenerating,
}: {
  onDrop: (item: ClothingItem) => void;
  outfit: any;
  resultImageUrl: string;
  isGenerating: boolean;
}) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "clothing",
    drop: (item: ClothingItem) => {
      if (isGenerating) return;
      onDrop(item);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));
  const dropRef = useRef<HTMLDivElement | null>(null);
  drop(dropRef);

  return (
    <div
      ref={dropRef}
      className={`w-full h-full bg-white rounded-2xl border-6 border-black shadow-[10px_10px_0px_rgba(0,0,0,0.4)] overflow-hidden transition-all ${
        isOver ? "ring-8 ring-purple-500 scale-[1.02]" : ""
      }`}
      style={{
        backgroundImage:
          "repeating-linear-gradient(45deg, #fff 0px, #fff 15px, #f0f9ff 15px, #f0f9ff 30px)",
      }}
    >
      <div className="w-full h-full flex items-center justify-center relative">
        <img
          src={resultImageUrl}
          alt="try-on preview"
          className="h-full w-full object-contain"
        />
        {!outfit.top && !outfit.bottom && !outfit.outer && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p
              className="rounded-xl border-4 border-black bg-white px-6 py-4 text-2xl font-black text-gray-400 shadow-[4px_4px_0px_rgba(0,0,0,0.3)]"
              style={{ fontFamily: "Impact, fantasy" }}
            >
              옷을 끌어다 놓으세요
            </p>
          </div>
        )}
        {isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <p
              className="rounded-xl border-4 border-black bg-white px-6 py-4 text-xl font-black text-purple-600 shadow-[4px_4px_0px_rgba(0,0,0,0.3)]"
              style={{ fontFamily: "Impact, fantasy" }}
            >
              이미지 합성 중...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function DressUpPageContent({
  username,
  onBack,
  onComplete,
}: DressUpPageProps) {
  const [categories, setCategories] = useState<ClothingCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<
    ClothingCategory | "ALL"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [isLoadingClothes, setIsLoadingClothes] = useState(false);
  const [clothesError, setClothesError] = useState<string | null>(null);
  const [outfit, setOutfit] = useState<{
    top?: ClothingItem;
    bottom?: ClothingItem;
    outer?: ClothingItem;
  }>({});
  const [resultImageUrl, setResultImageUrl] = useState<string>(
    process.env.NEXT_PUBLIC_DEFAULT_MODEL_URL || "/default_model1.jpg",
  );
  const latestResultRef = useRef<string>(resultImageUrl);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isSavingPreview, setIsSavingPreview] = useState(false);

  const filteredItems = useMemo(() => {
    if (selectedCategory === "ALL") return clothes;
    return clothes.filter((item) => item.category === selectedCategory);
  }, [clothes, selectedCategory]);

  const loadCategories = async () => {
    try {
      const response = await fetchWithAuth("/clothes/categories");
      if (!response.ok) {
        throw new Error("failed");
      }
      const data = (await response.json()) as {
        categories: ClothingCategory[];
      };
      setCategories(data.categories || []);
    } catch {
      setCategories([]);
    }
  };

  const loadClothes = async () => {
    setIsLoadingClothes(true);
    setClothesError(null);
    try {
      let endpoint = "/clothes?page=0&size=50";
      const keyword = searchQuery.trim();
      if (keyword || selectedCategory !== "ALL") {
        const params = new URLSearchParams();
        params.set("keyword", keyword);
        if (selectedCategory !== "ALL") {
          params.set("category", selectedCategory);
        }
        endpoint = `/clothes/search?${params.toString()}`;
      }
      const response = await fetchWithAuth(endpoint);
      if (!response.ok) {
        throw new Error("failed");
      }
      const data = (await response.json()) as Array<{
        id: number;
        name: string;
        category: ClothingCategory;
        imageUrl: string;
        brand?: string;
        styleTags?: string;
        sourceUrl?: string;
      }>;
      setClothes(
        data.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          imageUrl: item.imageUrl,
          brand: item.brand,
          styleTags: item.styleTags,
          sourceUrl: item.sourceUrl,
        })),
      );
    } catch {
      setClothes([]);
      setClothesError("의상을 불러오지 못했습니다.");
    } finally {
      setIsLoadingClothes(false);
    }
  };

  const handleDrop = (item: ClothingItem) => {
    if (isGenerating) {
      return;
    }
    const categoryKey =
      item.category === "TOP"
        ? "top"
        : item.category === "BOTTOM"
          ? "bottom"
          : "outer";
    setOutfit((prev) => ({
      ...prev,
      [categoryKey]: item,
    }));
    setGenerationError(null);
    setIsGenerating(true);

    const modelImageUrl = latestResultRef.current;

    fetch("/api/replicate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modelImageUrl,
        item: item,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("replicate failed");
        }
        const data = (await response.json()) as { output?: string };
        if (data.output) {
          latestResultRef.current = data.output;
          setResultImageUrl(data.output);
        } else {
          throw new Error("missing output");
        }
      })
      .catch(() => {
        setGenerationError("합성에 실패했습니다.");
      })
      .finally(() => {
        setIsGenerating(false);
      });
  };

  const handleComplete = async () => {
    if (isSavingPreview) return;
    setIsSavingPreview(true);
    setGenerationError(null);
    try {
      const uploadResponse = await fetch("/api/images/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceUrl: resultImageUrl }),
      });
      if (!uploadResponse.ok) {
        throw new Error("preview upload failed");
      }
      const data = (await uploadResponse.json()) as { imageUrl?: string };
      if (!data.imageUrl) {
        throw new Error("missing preview url");
      }
      const payload: SavedOutfit = {
        id: Date.now(),
        name: `코디 ${Date.now()}`,
        topId: outfit.top?.id ?? 0,
        bottomId: outfit.bottom?.id ?? 0,
        outerId: outfit.outer?.id ?? 0,
        previewUrl: data.imageUrl,
        createdAt: new Date().toISOString(),
      };
      onComplete(payload);
    } catch {
      setGenerationError("프리뷰 저장에 실패했습니다.");
    } finally {
      setIsSavingPreview(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadClothes();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  return (
    <div className="h-screen bg-gradient-to-br from-purple-200 via-pink-200 to-cyan-200 relative overflow-hidden flex flex-col">
      {/* Pattern background */}
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
          ✨ 코디 스타일링 ✨
        </h1>

        <div className="w-12"></div>
      </div>

      {/* Main Content */}
      <div
        className="flex gap-6 p-6 relative z-10"
        style={{ height: "calc(100vh - 88px)" }}
      >
        {/* Left Side - Image Area */}
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          <div className="w-full h-full max-w-4xl">
            <DropZone
              onDrop={handleDrop}
              outfit={outfit}
              resultImageUrl={resultImageUrl}
              isGenerating={isGenerating}
            />
            {generationError && (
              <p className="mt-3 text-center text-sm font-bold text-red-500">
                {generationError}
              </p>
            )}
          </div>
        </div>

        {/* Right Side - Search & Items */}
        <div className="w-96 flex flex-col gap-4 flex-shrink-0">
          {/* Search Bar */}
          <div
            className="bg-white p-4 rounded-xl border-5 border-black shadow-[6px_6px_0px_rgba(0,0,0,0.3)] flex-shrink-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, #fff 0px, #fff 8px, #ffe0f0 8px, #ffe0f0 16px)",
            }}
          >
            <div className="mb-3 flex gap-2">
              <select
                value={selectedCategory}
                onChange={(event) =>
                  setSelectedCategory(
                    event.target.value as ClothingCategory | "ALL",
                  )
                }
                className="w-full rounded-lg border-4 border-black bg-white px-3 py-2 text-sm font-bold"
              >
                <option value="ALL">전체</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                strokeWidth={3}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="옷 검색..."
                className="w-full pl-11 pr-4 py-3 text-lg font-bold border-4 border-black rounded-lg focus:outline-none focus:ring-4 focus:ring-purple-400 bg-white"
                style={{ fontFamily: "Impact, fantasy" }}
              />
            </div>
          </div>

          {/* Clothing Items Grid */}
          <div
            className="flex-1 bg-white rounded-xl border-5 border-black shadow-[6px_6px_0px_rgba(0,0,0,0.3)] overflow-hidden min-h-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, #fff 0px, #fff 12px, #f0e6ff 12px, #f0e6ff 24px)",
            }}
          >
            <div className="h-full overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-3">
                {isLoadingClothes && (
                  <p className="col-span-2 text-center text-sm font-bold text-gray-500">
                    로딩 중...
                  </p>
                )}
                {!isLoadingClothes && clothesError && (
                  <p className="col-span-2 text-center text-sm font-bold text-red-500">
                    {clothesError}
                  </p>
                )}
                {!isLoadingClothes &&
                  !clothesError &&
                  filteredItems.map((item) => (
                    <DraggableClothingItem key={item.id} item={item} />
                  ))}
              </div>
            </div>
          </div>

          {/* Complete Button */}
          <button
            onClick={handleComplete}
            disabled={!outfit.top && !outfit.bottom && !outfit.outer}
            className="bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 p-6 rounded-xl border-5 border-black shadow-[6px_6px_0px_rgba(0,0,0,0.3)] hover:shadow-[8px_8px_0px_rgba(0,0,0,0.3)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <div className="flex items-center justify-center gap-3">
              <Star
                className="w-8 h-8 text-white"
                fill="currentColor"
                strokeWidth={0}
              />
              <span
                className="text-2xl font-black text-white [text-shadow:_2px_2px_0_rgb(0_0_0)]"
                style={{ fontFamily: "Impact, fantasy" }}
              >
                완성!
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function DressUpPage(props: DressUpPageProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <DressUpPageContent {...props} />
    </DndProvider>
  );
}

export default function DressUpRoute() {
  const router = useRouter();
  const { addOutfit } = useAppState();
  useAuthGate();

  return (
    <DressUpPage
      username="플레이어"
      onBack={() => router.push("/landing")}
      onComplete={(outfit) => {
        addOutfit(outfit);
        router.push("/landing");
      }}
    />
  );
}
