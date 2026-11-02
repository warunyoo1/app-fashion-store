import { curatedProducts } from "./curatedProducts.ts";
import { modernizeProduct } from "./modernWardrobe.ts";
import type { GarmentFinish } from "./modernWardrobe.ts";

export type GarmentKind = "tee" | "jersey" | "tank" | "longsleeve" | "jacket";
export type Motif = "plain" | "stripes" | "bands" | "split" | "hoops" | "varsity" | "graphic";
export interface Colorway {
  color: string; accent: string; ink: string; colorName: string;
}
export interface Product {
  id: string; name: string; category: string; kind: GarmentKind;
  motif: Motif; number: string; price: number; colorways: Colorway[];
  photographs?: { front: string; back: string; source: string };
  model?: {
    file: string; thumbnails: string[]; colorMaterial: string;
    width: number; height: number; depth: number;
    hideNodes: string[]; hangerFit: { widthScale: number; drop: number; depth?: number };
    metalHangerFit?: { widthScale: number; drop: number; depth?: number };
    finish?: GarmentFinish;
    title: string; author: string; source: string; license: string;
  };
}
const nairaSource = "https://sketchfab.com/3d-models/clothes-54646263f96a47be9b3d2befe8d0555e";
function clothesModel(id: string, width: number, height: number, depth: number, hangerFit: { widthScale: number; drop: number }, sourceHasHanger = false): NonNullable<Product["model"]> {
  return {
    file: `/assets/models/${id}/${id}.glb`, thumbnails: [`/assets/models/${id}/original.png`],
    colorMaterial: "", width, height, depth, hangerFit,
    hideNodes: sourceHasHanger ? ["source_mesh_11", "source_mesh_7"] : [], title: "Clothes", author: "Naira",
    source: nairaSource, license: "https://creativecommons.org/licenses/by/4.0/",
  };
}
// Downloaded, sculpted GLB models. Names, sizes and prices are demonstration data.
const sourceProducts: Product[] = [
  {
    id: "relaxed-tee", name: "Relaxed Tee", category: "Everyday basics", kind: "tee", motif: "plain", number: "01", price: 690,
    model: {
      file: "/assets/models/relaxed-tee/relaxed-tee.glb",
      thumbnails: ["/assets/models/relaxed-tee/chalk.png", "/assets/models/relaxed-tee/ink.png"],
      colorMaterial: "RelaxedCotton", width: 2.001, height: 2.15, depth: .948,
      hideNodes: [], hangerFit: { widthScale: 1.1, drop: .11, depth: -.2 },
      title: "T Shirt", author: "funlab117",
      source: "https://sketchfab.com/3d-models/t-shirt-c1a3e5eb9b5445f4b7d4be82f1127eba",
      license: "https://creativecommons.org/licenses/by/4.0/",
    },
    colorways: [
      { color: "#f4f3ee", accent: "#d9d8d0", ink: "#2a2d2b", colorName: "Chalk" },
      { color: "#2b2d2d", accent: "#3a3d3c", ink: "#efefe8", colorName: "Ink" },
    ],
  },
  {
    id: "graphic-tee", name: "Graphic Tee", category: "Graphic essentials", kind: "tee", motif: "graphic", number: "02", price: 890,
    model: clothesModel("graphic-tee", 2.185, 2, .923, { widthScale: 1.25, drop: .17 }),
    colorways: [{ color: "#536830", accent: "#e08136", ink: "#faf5e6", colorName: "Olive / Orange" }],
  },
  {
    id: "cassette-hoodie", name: "Cassette Hoodie", category: "Statement layers", kind: "jacket", motif: "graphic", number: "03", price: 1890,
    model: clothesModel("cassette-hoodie", 2.664, 2.5, .816, { widthScale: 1.5, drop: .8 }),
    colorways: [{ color: "#126d7e", accent: "#dfdc79", ink: "#f4f1dc", colorName: "Teal / Butter" }],
  },
  {
    id: "leather-jacket", name: "Leather Jacket", category: "Outerwear", kind: "jacket", motif: "plain", number: "04", price: 3290,
    model: clothesModel("leather-jacket", 3.063, 2, 1.134, { widthScale: 1.4, drop: .3 }),
    colorways: [{ color: "#2c201f", accent: "#a8886e", ink: "#f3ece2", colorName: "Espresso" }],
  },
  {
    id: "check-shirt", name: "Crimson Check Shirt", category: "Off duty", kind: "tee", motif: "plain", number: "05", price: 1190,
    model: clothesModel("check-shirt", 1.66, 2, .409, { widthScale: 1.35, drop: .09 }, true),
    colorways: [{ color: "#67172a", accent: "#1c181b", ink: "#f4eee7", colorName: "Crimson / Black" }],
  },
  ...curatedProducts,
];
export const products = sourceProducts.map(modernizeProduct);
export const featuredProduct = products.findIndex(product => product.id === "western-shirt");
const hangerCredit = { title: "Wooden hanger from CC0 - Shirt On Hanger", author: "plaggy",
  source: "https://sketchfab.com/3d-models/cc0-shirt-on-hanger-846d8f285fcb426498033ae67aee2d10", license: "https://creativecommons.org/licenses/by/4.0/" };
export const modelCredits = [...new Map([...products.flatMap(product => product.model ? [[product.model.source, product.model] as const] : []), [hangerCredit.source, hangerCredit] as const]).values()];
export const sizes = ["S", "M", "L", "XL"] as const;
export type Size = (typeof sizes)[number];
