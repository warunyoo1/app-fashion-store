import { gsap } from "gsap";
import type { Object3D } from "three";

type Entrance = "hero" | "collection" | "detail" | "product";

/** Animate an outer presentation group; garment poses and camera remain independent. */
export function createObjectEntrance(object: Object3D, kind: Entrance, render: () => void) {
  const duration = kind === "product" ? .48 : .8;
  const timeline = gsap.timeline({ paused: true, defaults: { duration, ease: "power3.out" }, onUpdate: render });
  if (kind === "hero") {
    timeline.fromTo(object.position, { y: -.14 }, { y: 0 }, 0);
  } else {
    timeline.fromTo(object.position, kind === "product" ? { x: .14 } : { y: kind === "collection" ? -.16 : -.08 },
      kind === "product" ? { x: 0 } : { y: 0 }, 0);
    timeline.fromTo(object.rotation, { y: kind === "product" ? -.16 : -.08 }, { y: 0 }, 0);
    timeline.fromTo(object.scale, { x: .97, y: .97, z: .97 }, { x: 1, y: 1, z: 1 }, 0);
  }
  return timeline;
}
