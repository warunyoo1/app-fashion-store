import { useLayoutEffect } from "react";
import type { RefObject } from "react";
import { gsap } from "./gsap";

export function useHeroMotion(root: RefObject<HTMLElement | null>, ready: boolean) {
  useLayoutEffect(() => {
    if (!ready || !root.current) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const caption = root.current!.querySelectorAll(".rack-caption p");
      const meta = root.current!.querySelector(".rack-meta");
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
      timeline.fromTo(caption, { y: 9, opacity: .55 },
        { y: 0, opacity: 1, duration: .6, stagger: .07, clearProps: "transform,opacity" });
      if (meta) timeline.fromTo(meta, { y: 7, opacity: .65 },
        { y: 0, opacity: 1, duration: .5, clearProps: "transform,opacity" }, .18);
    }, root);
    return () => media.revert();
  }, [root, ready]);
}
