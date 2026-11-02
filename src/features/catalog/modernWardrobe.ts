import type { Product } from "./products.ts";

export interface GarmentFinish {
  materials: readonly string[];
  accentMaterials?: readonly string[];
  roughness: number;
  metalness?: number;
}

type WardrobeEdit = { name: string; category?: string; finish: GarmentFinish; colors: [string, string, string][] };
const edits: Record<string, WardrobeEdit> = {
  "graphic-tee": { name: "Studio Tee", finish: { materials: ["tshirt1"], roughness: .9 }, colors: [["#aaa99e", "#aaa99e", "Stone"], ["#393d3c", "#393d3c", "Ink"]] },
  "cassette-hoodie": { name: "Essential Hoodie", finish: { materials: ["hood3", "ties2", "pocket2blinn1SG"], accentMaterials: ["ties2"], roughness: .91 }, colors: [["#404c5a", "#c8c5bb", "Navy"], ["#b9b3a3", "#68675f", "Sand"]] },
  "leather-jacket": { name: "Leather Jacket", finish: { materials: ["buckle1coat4"], roughness: .43, metalness: .03 }, colors: [["#4c4036", "#9b958a", "Espresso"], ["#303335", "#a9aaa4", "Black"]] },
  "check-shirt": { name: "Camp Collar Shirt", category: "Shirts & layers", finish: { materials: ["tshirtonhanger3"], roughness: .86 }, colors: [["#c8c2ae", "#c8c2ae", "Bone"], ["#4e5a56", "#4e5a56", "Sage"]] },
  "western-shirt": { name: "Tie-detail Shirt", finish: { materials: ["uniform_1001"], roughness: .81 }, colors: [["#98a8ad", "#6f7e84", "Blue grey"], ["#c2b7a7", "#8b8173", "Parchment"]] },
  "utility-jacket": { name: "Utility Jacket", finish: { materials: ["uniform_1001"], roughness: .83 }, colors: [["#404d47", "#a3aaa1", "Forest grey"], ["#9a9c8f", "#444c46", "Limestone"]] },
  "rose-leather-jacket": { name: "Cropped Leather Jacket", finish: { materials: ["uniform_1001", "-Button"], accentMaterials: ["-Button"], roughness: .4, metalness: .02 }, colors: [["#c2b7a5", "#5e605a", "Ecru"], ["#5b5148", "#aaa295", "Mocha"]] },
  "khaki-overshirt": { name: "Panel Hoodie", finish: { materials: ["uniform_1001"], roughness: .9 }, colors: [["#777b6b", "#b7b3a6", "Olive stone"], ["#3b4141", "#a5aaa1", "Graphite"]] },
  "urban-hoodie": { name: "Relaxed Hoodie", finish: { materials: ["CORDON_FRONT_5197366", "HOODIE_FRONT_5197361"], accentMaterials: ["CORDON_FRONT_5197366"], roughness: .92 }, colors: [["#3d4143", "#b2b0a5", "Washed ink"], ["#aaa99c", "#5b5d55", "Ash"]] },
  "studio-graphic-tee": { name: "Boxy Tee", category: "Everyday basics", finish: { materials: ["col_FRONT_6003013", "logo_FRONT_6003008", "t-shirt_FRONT_6003003"], roughness: .92 }, colors: [["#616859", "#616859", "Moss"], ["#ccc7b8", "#ccc7b8", "Chalk"]] },
  "rose-hoodie": { name: "Soft Hoodie", finish: { materials: ["uniform_1001"], roughness: .94 }, colors: [["#beb49f", "#928a79", "Oat"], ["#8c9392", "#616967", "Silver grey"]] },
};

/** A material edit of the credited source meshes; product identity and fit stay stable. */
export function modernizeProduct(product: Product): Product {
  const edit = edits[product.id];
  if (!edit || !product.model) return product;
  return {
    ...product,
    name: edit.name,
    category: edit.category ?? product.category,
    colorways: edit.colors.map(([color, accent, colorName]) => ({ color, accent, colorName, ink: "#292d2a" })),
    model: { ...product.model, finish: edit.finish,
      thumbnails: edit.colors.map((_, index) => `/assets/modern-wardrobe/${product.id}-${index}.jpg`) },
  };
}
