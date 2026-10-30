import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createGarmentAssetCache } from "./garmentAssetCache";
import { useThree } from "@react-three/fiber";
import { retainGarmentPreparation } from "./prepareGarment";

const AssetContext = createContext<ReturnType<typeof createGarmentAssetCache> | null>(null);

export function GarmentAssetScope({ children }: { children: ReactNode }) {
  const [cache] = useState(createGarmentAssetCache);
  const gl = useThree(store => store.gl);
  useEffect(() => cache.retain(), [cache]);
  useEffect(() => retainGarmentPreparation(gl), [gl]);
  return <AssetContext.Provider value={cache}>{children}</AssetContext.Provider>;
}

export function useGarmentAssetCache() {
  const cache = useContext(AssetContext);
  if (!cache) throw new Error("Garments must render inside their canvas asset scope");
  return cache;
}
