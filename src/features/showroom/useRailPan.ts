import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent, RefObject } from "react";
import { clampRailPan, nearestRailItem } from "./railPan";

export function useRailPan(viewport: RefObject<HTMLDivElement | null>, positions: readonly number[], front: number | null,
  active: boolean, unit: number, onBrowse: (index: number) => void) {
  const [pan, setPan] = useState(positions[front ?? 0] ?? 0), [panning, setPanning] = useState(false);
  const current = useRef(pan), frame = useRef<number | null>(null), timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moving = useRef(false), drag = useRef<{ x: number; y: number; pan: number; pointer: number; started: boolean } | null>(null);
  const cancelIdle = useCallback(() => { if (timer.current !== null) clearTimeout(timer.current); timer.current = null; }, []);
  const finish = useCallback(() => {
    cancelIdle(); moving.current = false; setPanning(false);
    onBrowse(nearestRailItem(current.current, positions));
  }, [cancelIdle, onBrowse, positions]);
  const move = useCallback((value: number) => {
    const next = clampRailPan(value, positions);
    if (next === current.current) return;
    current.current = next; moving.current = true; setPanning(true);
    if (frame.current === null) frame.current = requestAnimationFrame(() => { frame.current = null; setPan(current.current); });
    cancelIdle(); timer.current = setTimeout(finish, 180);
  }, [positions, cancelIdle, finish]);
  useEffect(() => {
    if (front === null) return;
    cancelIdle(); moving.current = false; drag.current = null; setPanning(false);
    const next = positions[front] ?? 0; current.current = next; setPan(next);
  }, [front, active, positions, cancelIdle]);
  useEffect(() => {
    if (!active) { cancelIdle(); moving.current = false; drag.current = null; setPanning(false); }
  }, [active, cancelIdle]);
  useEffect(() => {
    const element = viewport.current;
    if (!element || !active) return;
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) return;
      const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientHeight : 1;
      const delta = (Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY) * scale;
      const next = clampRailPan(current.current + Math.max(-180, Math.min(180, delta)) / unit, positions);
      if (next === current.current) { if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) event.preventDefault(); return; }
      event.preventDefault(); move(next);
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, [viewport, active, positions, unit, move]);
  useEffect(() => () => { cancelIdle(); if (frame.current !== null) cancelAnimationFrame(frame.current); }, [cancelIdle]);
  const pointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!active || event.button !== 0) return;
    drag.current = { x: event.clientX, y: event.clientY, pan: current.current, pointer: event.pointerId, started: false };
  };
  const pointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const gesture = drag.current;
    if (!gesture || !active) return;
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    if (!gesture.started) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { drag.current = null; return; }
      if (Math.abs(dx) < 9 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      gesture.started = true; event.currentTarget.setPointerCapture(event.pointerId);
    }
    event.preventDefault(); event.stopPropagation(); move(gesture.pan - dx / unit);
    // A held pointer must not snap merely because the visitor pauses mid-drag.
    cancelIdle();
  };
  const pointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    const gesture = drag.current; drag.current = null;
    if (!gesture?.started) return;
    event.stopPropagation();
    if (event.currentTarget.hasPointerCapture(gesture.pointer)) event.currentTarget.releasePointerCapture(gesture.pointer);
    finish();
  };
  const nearest = nearestRailItem(pan, positions), min = positions[0] ?? 0, max = positions.at(-1) ?? min;
  const keyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const index = event.key === "ArrowRight" || event.key === "ArrowUp" ? Math.min(positions.length - 1, nearest + 1)
      : event.key === "ArrowLeft" || event.key === "ArrowDown" ? Math.max(0, nearest - 1)
      : event.key === "Home" ? 0 : event.key === "End" ? positions.length - 1 : null;
    if (index === null) return;
    event.preventDefault(); cancelIdle(); moving.current = false; setPanning(false); onBrowse(index);
  };
  return { pan, panning, nearest, progress: max === min ? 0 : (pan - min) / (max - min) * 1000,
    setProgress: (value: number) => move(min + value / 1000 * (max - min)), keyDown,
    pointerHandlers: { onPointerDownCapture: pointerDown, onPointerMoveCapture: pointerMove,
      onPointerUpCapture: pointerEnd, onPointerCancelCapture: pointerEnd } };
}
