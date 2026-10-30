import { BufferGeometry, Float32BufferAttribute } from "three";
import type { GarmentKind } from "../catalog/products";
import { clothDepth } from "./garmentRig.ts";

export interface GarmentShape {
  /** Half width of the flat garment at height y (y runs -1 hem to 1 shoulder). */
  halfWidth: (y: number) => number;
  neckRadius: number;
  neckDepth: number;
  /** Uniform scale relative to a tee, so outerwear reads bigger on the rail. */
  scale: number;
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const tee = (y: number) => {
  if (y < 0.28) return 0.5 + (0.035 * (y + 1)) / 1.28;
  if (y < 0.46) return 0.535 + ((y - 0.28) / 0.18) * 0.385;
  if (y < 0.73) return 0.92 - ((y - 0.46) / 0.27) * 0.07;
  return 0.85 - ((y - 0.73) / 0.27) * 0.49;
};
// Sleeves hang along the torso, so the outline stays wide down to the cuffs.
const longSleeve =
  (body: number, sleeve: number, cuff: number) => (y: number) => {
    if (y < cuff) return body;
    if (y < 0.5) return lerp(sleeve, sleeve - 0.03, (y - cuff) / (0.5 - cuff));
    if (y < 0.75) return sleeve - 0.03 - ((y - 0.5) / 0.25) * 0.06;
    return lerp(sleeve - 0.09, 0.38, (y - 0.75) / 0.25);
  };
export const shapes: Record<GarmentKind, GarmentShape> = {
  tee: { halfWidth: tee, neckRadius: 0.165, neckDepth: 0.2, scale: 1 },
  jersey: { halfWidth: tee, neckRadius: 0.17, neckDepth: 0.24, scale: 1.02 },
  tank: {
    halfWidth: (y) => {
      if (y < 0.3) return 0.48 + (0.03 * (y + 1)) / 1.3;
      if (y < 0.66)
        return 0.51 - Math.sin(((y - 0.3) / 0.36) * (Math.PI / 2)) * 0.19;
      return lerp(0.32, 0.28, (y - 0.66) / 0.34);
    },
    neckRadius: 0.2,
    neckDepth: 0.4,
    scale: 1,
  },
  longsleeve: {
    halfWidth: longSleeve(0.5, 0.78, -0.86),
    neckRadius: 0.16,
    neckDepth: 0.19,
    scale: 1.02,
  },
  jacket: {
    halfWidth: longSleeve(0.55, 0.86, -0.8),
    neckRadius: 0.19,
    neckDepth: 0.34,
    scale: 1.1,
  },
};
/** Dense front/back cloth surfaces, with a cut neckline and shallow sewn folds. */
export function createGarment(kind: GarmentKind) {
  const { halfWidth, neckRadius, neckDepth } = shapes[kind];
  const positions: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  let frontCount = 0;
  const rows = 72,
    cols = 64,
    count = (rows + 1) * (cols + 1);
  for (let side = 0; side < 2; side++) {
    const start = indices.length;
    for (let iy = 0; iy <= rows; iy++) {
      const y = -1 + (iy / rows) * 2,
        w = halfWidth(y);
      for (let ix = 0; ix <= cols; ix++) {
        const t = ix / cols,
          x = (t * 2 - 1) * w;
        const z = clothDepth(x, y, w) * (side ? -1 : 1);
        positions.push(x, y - 0.025 * Math.cos(x * 5) * Math.max(0, -y), z);
        uvs.push(side ? 0.5 - x / 2 : x / 2 + 0.5, (y + 1) / 2);
      }
    }
    for (let iy = 0; iy < rows; iy++)
      for (let ix = 0; ix < cols; ix++) {
        const y = -1 + ((iy + 0.5) / rows) * 2,
          x = (((ix + 0.5) / cols) * 2 - 1) * halfWidth(y);
        const openingDepth = side ? neckDepth * 0.22 : neckDepth;
        if (
          y > 1 - openingDepth &&
          Math.abs(x) <
            neckRadius *
              Math.sqrt(Math.max(0, 1 - ((1 - y) / openingDepth) ** 2))
        )
          continue;
        const a = side * count + iy * (cols + 1) + ix,
          b = a + 1,
          c = a + cols + 1,
          d = c + 1;
        if (side) indices.push(a, c, b, b, c, d);
        else indices.push(a, b, c, b, d, c);
      }
    // Material groups are assigned below after geometry construction.
    if (side === 0) frontCount = indices.length - start;
  }
  // Close the outer edges of the two cloth surfaces.
  for (let iy = 0; iy < rows; iy++)
    for (const ix of [0, cols]) {
      const a = iy * (cols + 1) + ix,
        b = a + cols + 1;
      indices.push(a, b, a + count, b, b + count, a + count);
    }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.addGroup(0, frontCount, 0);
  const sideCount = rows * 12;
  const backCount = indices.length - frontCount - sideCount;
  g.addGroup(frontCount, backCount, 1);
  g.addGroup(frontCount + backCount, sideCount, 2);
  g.computeVertexNormals();
  return g;
}
/** Closed loop around the neck opening (deep at the front, shallow at the back) for the collar trim. */
export function neckline(kind: GarmentKind) {
  const { neckRadius: r, neckDepth: d } = shapes[kind];
  return Array.from({ length: 25 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2,
      s = Math.sin(a);
    return [
      -Math.cos(a) * r,
      1 - (s > 0 ? s * d : -s * d * 0.2) - 0.01,
      s * 0.1,
    ];
  });
}
