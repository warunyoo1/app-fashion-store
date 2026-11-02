const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
export const STUDIO_ZOOM_MIN = 1, STUDIO_ZOOM_MAX = 1.65;
type Point = { id: number; x: number; y: number; touch: boolean };

/** Gesture intent stays outside React. A vertical touch remains page scrolling. */
export function createStudioInteraction(angle = 0, zoom = 1) {
  const points = new Map<number, Point>();
  const pose = { angle, zoom };
  let mode: "idle" | "pending" | "rotate" | "pinch" | "scroll" = "idle";
  let startX = 0, startY = 0, startAngle = angle, width = 1;
  let pinchDistance = 1, pinchZoom = zoom, used = false, lastTurn = 0;
  const distance = () => {
    const [a, b] = [...points.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };
  return {
    pose,
    get mode() { return mode; },
    get pointerIds() { return [...points.keys()]; },
    reset(nextAngle: number, nextZoom: number) {
      points.clear(); mode = "idle"; used = false; lastTurn = 0;
      pose.angle = nextAngle; pose.zoom = clamp(nextZoom, STUDIO_ZOOM_MIN, STUDIO_ZOOM_MAX);
    },
    down(point: Point, viewportWidth: number) {
      if (points.size >= 2 || points.has(point.id) || mode === "scroll") return false;
      points.set(point.id, point);
      if (points.size === 1) {
        startX = point.x; startY = point.y; startAngle = pose.angle;
        width = Math.max(1, viewportWidth); mode = "pending"; used = false; lastTurn = 0;
      } else {
        pinchDistance = Math.max(12, distance()); pinchZoom = pose.zoom; mode = "pinch";
      }
      return true;
    },
    move(id: number, x: number, y: number) {
      const point = points.get(id);
      if (!point) return { claimed: false, began: false, turn: 0, changed: false };
      point.x = x; point.y = y;
      const previousAngle = pose.angle, previousZoom = pose.zoom, wasUsed = used;
      if (mode === "pending") {
        const dx = Math.abs(x - startX), dy = Math.abs(y - startY);
        if (point.touch && dy > 7 && dy > dx * 1.15) mode = "scroll";
        else if (dx > 6 && dx >= dy * 1.1) mode = "rotate";
      }
      if (mode === "rotate") pose.angle = startAngle + (x - startX) / width * Math.PI * 2;
      if (mode === "pinch") pose.zoom = clamp(pinchZoom * distance() / pinchDistance, STUDIO_ZOOM_MIN, STUDIO_ZOOM_MAX);
      const changed = Math.abs(pose.angle - previousAngle) > .00001 || Math.abs(pose.zoom - previousZoom) > .00001;
      if (changed) used = true;
      const turn = pose.angle - previousAngle;
      if (Math.abs(turn) > .0001) lastTurn = turn;
      return { claimed: mode === "rotate" || mode === "pinch", began: used && !wasUsed, turn, changed };
    },
    up(id: number) {
      if (!points.delete(id)) return null;
      if (points.size) {
        const remaining = [...points.values()][0];
        startX = remaining.x; startY = remaining.y; startAngle = pose.angle; mode = "pending";
        return null;
      }
      const result = { ...pose, used, release: used ? Math.sign(lastTurn || 1) * .12 : 0 };
      mode = "idle"; used = false; lastTurn = 0;
      return result;
    },
  };
}

/** Analytic damped pendulum: frame-rate independent, bounded, and settles exactly. */
export function createHangerSwing() {
  let angle = 0, velocity = 0;
  return {
    get angle() { return angle; },
    get moving() { return angle !== 0 || velocity !== 0; },
    impulse(amount: number) { velocity = clamp(velocity + amount, -.65, .65); },
    stop() { angle = velocity = 0; },
    step(delta: number, reduced = false) {
      if (reduced || delta > .25) { angle = velocity = 0; return 0; }
      const time = Math.max(0, delta), decay = 5.85, frequency = Math.sqrt(81 - decay * decay);
      const cos = Math.cos(frequency * time), sin = Math.sin(frequency * time), envelope = Math.exp(-decay * time);
      const next = envelope * (angle * cos + (velocity + decay * angle) / frequency * sin);
      velocity = envelope * (velocity * cos - (decay * velocity + 81 * angle) / frequency * sin);
      angle = clamp(next, -.065, .065);
      if (Math.abs(angle) < .00015 && Math.abs(velocity) < .001) angle = velocity = 0;
      return angle;
    },
  };
}
