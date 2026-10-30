export const REST_ANGLE = -1.15;
export const FOCUS_SCALE = 1.22;
export const GARMENT_GAP = .3;
export interface RailDimensions { width: number; depth: number; scale: number }

/** Fit the visible projection of each real garment, rather than a fixed narrow slot. */
export function planRail(items: readonly RailDimensions[], open: number | null, focused: boolean) {
  const spans = items.map(({ width, depth, scale }, index) => index === open
    ? Math.hypot(width, depth) * (focused ? Math.min(scale * FOCUS_SCALE, 1.27) : scale)
    : (width * Math.abs(Math.cos(REST_ANGLE)) + depth * Math.abs(Math.sin(REST_ANGLE))) * scale);
  const width = spans.reduce((sum, span) => sum + span, 0) + Math.max(0, items.length - 1) * GARMENT_GAP;
  let cursor = -width / 2;
  const positions = spans.map(span => {
    const x = cursor + span / 2;
    cursor += span + GARMENT_GAP;
    return x;
  });
  return { positions, spans, width };
}
