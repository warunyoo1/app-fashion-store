import type { GarmentKind } from "../catalog/products";

export const RAIL_HEIGHT = 3.44;
/** Centre of the hook opening, rather than the top of its metal curve. */
export const HOOK_ANCHOR = 1.47;
export function suspensionY(scale: number) {
  return RAIL_HEIGHT - HOOK_ANCHOR * scale;
}

export const hookPoints = [
  [0, 0.97, 0],
  [0, 1.24, 0],
  [-0.015, 1.34, 0],
  [-0.067, 1.39, 0],
  [-0.08, 1.47, 0],
  [-0.045, 1.535, 0],
  [0.025, 1.55, 0],
  [0.083, 1.5, 0],
  [0.084, 1.435, 0],
  [0.052, 1.405, 0],
];

export function hangerShoulder(kind: GarmentKind) {
  return kind === "tank"
    ? { x: 0.255, y: 0.93 }
    : kind === "jacket"
      ? { x: 0.63, y: 0.79 }
      : { x: kind === "longsleeve" ? 0.55 : 0.59, y: 0.79 };
}
export function hangerBodyPoints(kind: GarmentKind) {
  const { x, y } = hangerShoulder(kind);
  return [
    [0, 0.975, 0],
    [-x * 0.46, 0.975 - (0.975 - y) * 0.46, 0.015],
    [-x * 0.86, y + 0.025, 0.01],
    [-x, y, 0],
    [-x * 0.94, y - 0.045, 0],
    [0, y - 0.055, -0.008],
    [x * 0.94, y - 0.045, 0],
    [x, y, 0],
    [x * 0.86, y + 0.025, 0.01],
    [x * 0.46, 0.975 - (0.975 - y) * 0.46, 0.015],
    [0, 0.975, 0],
  ];
}

/** Volume collapses at sewn edges; soft folds run down from supported shoulders. */
export function clothDepth(x: number, y: number, width: number) {
  const edge = Math.max(0, 1 - (Math.abs(x) / Math.max(width, 0.01)) ** 2);
  const fullness = 0.115 * Math.pow(edge, 0.65) * (1 - 0.22 * Math.max(0, y));
  const vertical =
    (Math.sin(x * 22 + y * 1.7) * 0.018 + Math.sin(x * 43 - y * 3) * 0.007) *
    edge;
  const shoulder = Math.min(
    Math.hypot(x - 0.52, y - 0.82),
    Math.hypot(x + 0.52, y - 0.82),
  );
  const tension =
    Math.sin(shoulder * 34) * 0.016 * Math.exp(-shoulder * 2.8) * edge;
  return 0.006 + fullness + vertical + tension;
}
