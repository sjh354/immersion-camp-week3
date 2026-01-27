export type ClothingCategory = "TOP" | "BOTTOM" | "OUTER";

export interface ClothingItem {
  id: number;
  category: ClothingCategory;
  name: string;
  imageUrl: string;
  brand?: string;
  styleTags?: string;
  sourceUrl?: string;
}

export interface Outfit {
  top?: ClothingItem;
  bottom?: ClothingItem;
  outer?: ClothingItem;
}

export interface SavedOutfit {
  id: number;
  name: string;
  previewUrl: string;
  topId: number;
  bottomId: number;
  outerId: number;
  createdAt: string;
}
