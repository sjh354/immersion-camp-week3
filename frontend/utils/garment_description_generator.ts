import { ClothingItem } from "@/types/models";

type Item = {
  id: string;
  name: string;
  category: "top" | "bottom" | "outer";
  imageUrl: string;
  brand?: string;
  styleTags?: string[];
  sourceUrl?: string;
};

const PICK = {
  fit: ["오버핏", "루즈핏", "레귤러", "슬림", "와이드"],
  length: ["크롭", "롱", "하프"],
  neck: ["하이넥", "터틀넥", "라운드넥", "브이넥", "카라"],
  detail: ["반집업", "풀집업", "지퍼", "버튼", "후드", "스트링"],
};

function pickTokens(name: string, pool: string[]) {
  return pool.filter((t) => name.includes(t));
}

function extractColorInfo(name: string) {
  // "( 3Color )" / "(3Color)" / "3Color" 같은 패턴
  const m = name.match(/(\d+)\s*Color/i);
  if (m?.[1]) return `${m[1]}가지 컬러 옵션`;
  return "";
}

function categoryToLabel(category: string) {
  const c = category.toUpperCase();
  if (c === "TOP") return "탑";
  if (c === "OUTER") return "아우터";
  if (c === "PANTS") return "팬츠";
  if (c === "SHOES") return "슈즈";
  return "의류";
}

function inferMood(tokens: {
  fit: string[];
  length: string[];
  neck: string[];
  detail: string[];
}) {
  const mood: string[] = [];
  if (tokens.fit.includes("오버핏") || tokens.fit.includes("루즈핏"))
    mood.push("캐주얼", "스트릿");
  if (tokens.length.includes("크롭")) mood.push("트렌디");
  if (tokens.neck.includes("하이넥")) mood.push("미니멀");
  if (tokens.detail.some((d) => d.includes("집업") || d === "지퍼"))
    mood.push("스포티");
  // 중복 제거
  return Array.from(new Set(mood)).slice(0, 3);
}

export default function makeGarmentDes(item: ClothingItem) {
  const name = item.name.replace(/\s+/g, " ").trim();
  const brand = item.brand?.trim();
  const label = categoryToLabel(item.category);

  const tokens = {
    fit: pickTokens(name, PICK.fit),
    length: pickTokens(name, PICK.length),
    neck: pickTokens(name, PICK.neck),
    detail: pickTokens(name, PICK.detail),
  };

  const colorInfo = extractColorInfo(name);
  const mood = inferMood(tokens);

  // 핵심 특징 문장 만들기
  const features = [
    ...tokens.length,
    ...tokens.fit,
    ...tokens.neck,
    ...tokens.detail,
  ].filter(Boolean);

  const featuresText = features.length ? features.join(" ") : "베이직한 디테일";
  const moodText = mood.length ? `${mood.join("/")} 무드` : "데일리 무드";

  // 최종 garment_des
  const head = `${brand ? `${brand} ` : ""}${name} ${label}.`.replace(
    /\s+/g,
    " ",
  );
  const body1 = `${featuresText} 기반의 실루엣과 디테일.`;
  const body2 = [colorInfo, moodText].filter(Boolean).join(", ") + ".";

  return `${head} ${body1} ${body2}`.replace(/\s+/g, " ").trim();
}
