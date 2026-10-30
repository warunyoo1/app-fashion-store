/** Scroll coordinates stay independent of hover/focus spacing. */
export function clampRailPan(value: number, positions: readonly number[]) {
  return Math.max(positions[0] ?? 0, Math.min(positions.at(-1) ?? 0, value));
}
export function nearestRailItem(value: number, positions: readonly number[]) {
  let nearest = 0;
  for (let i = 1; i < positions.length; i++)
    if (Math.abs(positions[i] - value) < Math.abs(positions[nearest] - value)) nearest = i;
  return nearest;
}
export function visibleRailItems(positions: readonly number[], center: number, viewWidth: number, padding = 3) {
  return positions.flatMap((x, index) => Math.abs(x - center) <= viewWidth / 2 + padding ? [index] : []);
}
