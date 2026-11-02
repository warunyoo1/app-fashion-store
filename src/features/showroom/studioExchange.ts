import { gsap } from "gsap";
import { Mesh } from "three";
import type { Group, Material } from "three";

/** A canvas owns these already-transparent materials; fades never compile a new shader. */
export function createStudioExchange(group: Group, render: () => void) {
  const materials = new Set<Material>();
  group.traverse(node => {
    if (node instanceof Mesh) (Array.isArray(node.material) ? node.material : [node.material]).forEach(material => {
      if (material.transparent) materials.add(material);
    });
  });
  const entries = [...materials];
  let timeline: gsap.core.Timeline | undefined;
  const stop = () => { timeline?.eventCallback("onComplete", null); timeline?.pause(); timeline?.kill(); };
  return {
    exit(commit: () => void) {
      stop();
      // Stop an unfinished entrance fade, preserving its displayed opacity.
      gsap.killTweensOf(entries);
      timeline = gsap.timeline({ onUpdate: render, onComplete: commit });
      timeline.to(group.position, { x: -.28, duration: .18, ease: "power2.in" }, 0);
      timeline.to(entries, { opacity: 0, duration: .18, ease: "power2.in" }, 0);
      return timeline;
    },
    cancel() {
      stop();
      gsap.killTweensOf(entries);
      timeline = gsap.timeline({ onUpdate: render });
      timeline.to(group.position, { x: 0, duration: .16, ease: "power3.out" }, 0);
      timeline.to(entries, { opacity: 1, duration: .16, ease: "power3.out" }, 0);
      return timeline;
    },
    dispose() {
      stop(); group.position.x = 0;
      // Cached RACK assemblies have a steady opacity of one, including an interrupted arrival.
      entries.forEach(material => { material.opacity = 1; });
    },
  };
}
