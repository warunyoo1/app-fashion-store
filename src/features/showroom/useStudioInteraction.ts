import { useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { createHangerSwing, createStudioInteraction } from "./studioInteraction";

export interface StudioInteractionProps {
  interactive?: boolean;
  onAngleChange?: (angle: number) => void;
  onZoomChange?: (zoom: number) => void;
  onInteracted?: () => void;
}

export function useStudioInteraction({ enabled, angle, zoom, requestKey, reduced,
  onAngleChange, onZoomChange, onInteracted }: StudioInteractionProps & {
  enabled: boolean; angle: number; zoom: number; requestKey: string; reduced: boolean;
}) {
  const { gl, invalidate } = useThree();
  const gesture = useMemo(() => createStudioInteraction(angle, zoom), []);
  const swing = useMemo(() => createHangerSwing(), []);
  const callbacks = useRef({ onAngleChange, onZoomChange, onInteracted, reduced });
  callbacks.current = { onAngleChange, onZoomChange, onInteracted, reduced };

  useEffect(() => {
    for (const id of gesture.pointerIds) {
      try { if (gl.domElement.hasPointerCapture(id)) gl.domElement.releasePointerCapture(id); } catch { /* External selection can interrupt a gesture. */ }
    }
    gesture.reset(angle, zoom); invalidate();
  }, [gesture, gl, angle, zoom, requestKey, invalidate]);
  useEffect(() => { swing.stop(); }, [swing, requestKey, reduced]);

  useEffect(() => {
    if (!enabled) return;
    const canvas = gl.domElement;
    const capture = () => {
      for (const id of gesture.pointerIds) {
        try { if (!canvas.hasPointerCapture(id)) canvas.setPointerCapture(id); } catch { /* Pointer may already be cancelled by native scrolling. */ }
      }
    };
    const down = (event: PointerEvent) => {
      if (event.button !== 0) return;
      gesture.down({ id: event.pointerId, x: event.clientX, y: event.clientY, touch: event.pointerType === "touch" }, canvas.getBoundingClientRect().width);
      if (gesture.mode === "pinch") capture();
    };
    const move = (event: PointerEvent) => {
      const result = gesture.move(event.pointerId, event.clientX, event.clientY);
      if (!result.claimed) return;
      event.preventDefault(); capture(); canvas.dataset.gesture = gesture.mode;
      if (result.began) callbacks.current.onInteracted?.();
      if (!callbacks.current.reduced) swing.impulse(result.turn * .5);
      if (result.changed) invalidate();
    };
    const finish = (event: PointerEvent) => {
      const result = gesture.up(event.pointerId);
      try { if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId); } catch { /* Capture can end before pointercancel. */ }
      if (!result) return;
      delete canvas.dataset.gesture;
      if (result.used) {
        callbacks.current.onAngleChange?.(result.angle);
        callbacks.current.onZoomChange?.(result.zoom);
        if (!callbacks.current.reduced && event.type === "pointerup") swing.impulse(result.release);
        invalidate();
      }
    };
    const preventNativePinch = (event: TouchEvent) => { if (event.touches.length > 1) event.preventDefault(); };
    const blur = () => {
      for (const id of gesture.pointerIds) {
        const result = gesture.up(id);
        if (result?.used) { callbacks.current.onAngleChange?.(result.angle); callbacks.current.onZoomChange?.(result.zoom); }
        try { if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id); } catch { /* Released by the browser. */ }
      }
      delete canvas.dataset.gesture; swing.stop(); invalidate();
    };
    canvas.dataset.interactive = "true";
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move, { passive: false });
    canvas.addEventListener("pointerup", finish);
    canvas.addEventListener("pointercancel", finish);
    canvas.addEventListener("lostpointercapture", finish);
    canvas.addEventListener("touchstart", preventNativePinch, { passive: false });
    canvas.addEventListener("touchmove", preventNativePinch, { passive: false });
    window.addEventListener("blur", blur);
    return () => {
      canvas.removeEventListener("pointerdown", down); canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", finish); canvas.removeEventListener("pointercancel", finish);
      canvas.removeEventListener("lostpointercapture", finish); canvas.removeEventListener("touchstart", preventNativePinch); canvas.removeEventListener("touchmove", preventNativePinch);
      window.removeEventListener("blur", blur);
      for (const id of gesture.pointerIds) { try { if (canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id); } catch { /* Canvas teardown. */ } }
      gesture.reset(gesture.pose.angle, gesture.pose.zoom); swing.stop();
      delete canvas.dataset.gesture; delete canvas.dataset.interactive;
    };
  }, [enabled, gl, gesture, swing, invalidate]);
  return { gesture, swing };
}
