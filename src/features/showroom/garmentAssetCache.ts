import type { Color } from "three";
import type { cloneImportedGarment } from "./importedGarment";

type ImportedAsset = ReturnType<typeof cloneImportedGarment>;
export type CachedGarment = ImportedAsset & { baseColors: Color[] };

/** One cache per canvas: keep compiled materials, never share mutable fades between scenes. */
export function createGarmentAssetCache() {
  const entries = new Map<string, CachedGarment>();
  const pending = new Set<Promise<void>>();
  let owners = 0, disposed = false, revision = 0, timer: ReturnType<typeof setTimeout> | undefined;
  const destroy = () => {
    if (disposed) return;
    disposed = true;
    for (const asset of entries.values()) {
      asset.materials.forEach(material => material.dispose());
      asset.ownedGeometries.forEach(geometry => geometry.dispose());
    }
    entries.clear();
  };
  const dispose = () => {
    const request = ++revision;
    if (pending.size) void Promise.allSettled([...pending]).then(() => { if (revision === request) destroy(); });
    else destroy();
  };
  return {
    get(key: string, create: () => ImportedAsset) {
      if (disposed) throw new Error("Garment cache has been disposed");
      let asset = entries.get(key);
      if (!asset) {
        const imported = create();
        asset = { ...imported, baseColors: imported.materials.map(material => material.color.clone()) };
        entries.set(key, asset);
      }
      return asset;
    },
    retain() {
      revision++;
      if (timer !== undefined) clearTimeout(timer);
      owners++;
      let released = false;
      return () => {
        if (released) return;
        released = true; owners--;
        // StrictMode immediately reacquires the owner. Real canvas teardown disposes once.
        if (owners === 0) timer = setTimeout(dispose, 0);
      };
    },
    track(promise: Promise<void>) {
      pending.add(promise);
      void promise.then(() => pending.delete(promise), () => pending.delete(promise));
      return promise;
    },
    dispose,
  };
}
