import { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import type { Object3D } from "three";
import type { useGarmentModel } from "./GarmentModel";
import { isGarmentPrepared, prepareGarment } from "./prepareGarment";
import { useGarmentAssetCache } from "./GarmentAssetScope";

export function usePreparedGarment(asset: ReturnType<typeof useGarmentModel>, active = true) {
  const { gl, scene, camera, invalidate } = useThree();
  const cache = useGarmentAssetCache();
  const [result, setResult] = useState<{ object: Object3D | null; error?: Error } | null>(null);
  useEffect(() => {
    if (!active) return;
    let current = true;
    const pending = cache.track(prepareGarment(gl, scene, camera, asset));
    pending.then(() => { if (current) { setResult({ object: asset.object }); invalidate(); } }, error => {
      if (current) setResult({ object: asset.object, error: error instanceof Error ? error : new Error(String(error)) });
    });
    return () => { current = false; };
  }, [active, asset.object, asset.materials, cache, gl, scene, camera, invalidate]);
  if (result?.object === asset.object && result?.error) throw result.error;
  return isGarmentPrepared(gl, asset.object);
}
