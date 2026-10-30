import { useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";
import { gsap, ScrollTrigger, motionReduced } from "../../shared/motion/gsap";

/** Keep the text and tab marker in step with the existing 3D collection change. */
export function useCollectionMotion(root: RefObject<HTMLElement | null>, index: number, reduced: boolean) {
  const previous = useRef(index);
  useLayoutEffect(() => {
    if (!root.current || motionReduced(reduced)) return;
    const context = gsap.context(() => {
      const lines = root.current!.querySelectorAll(".edit-title-line");
      const entrance = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
      entrance.fromTo(lines, { yPercent: 38, opacity: .6 },
        { yPercent: 0, opacity: 1, duration: .7, stagger: .08, clearProps: "transform,opacity" });
      ScrollTrigger.create({ trigger: root.current, start: "top 82%", once: true, animation: entrance });
    }, root);
    return () => context.revert();
  }, [root, reduced]);

  useLayoutEffect(() => {
    const marker = root.current?.querySelector<HTMLElement>(".edit-tab-marker");
    if (!marker) return;
    const tween = gsap.to(marker, { xPercent: index * 100,
      duration: motionReduced(reduced) ? 0 : .32, ease: "power3.out", overwrite: true });
    // Killing rather than reverting preserves the rendered position on rapid tab changes.
    return () => { tween.kill(); };
  }, [root, index, reduced]);

  useLayoutEffect(() => {
    const changed = previous.current !== index;
    previous.current = index;
    if (!root.current || !changed || motionReduced(reduced)) return;
    const context = gsap.context(() => {
      const story = root.current!.querySelector(".edit-story");
      gsap.fromTo(story, { x: 12, opacity: .55 },
        { x: 0, opacity: 1, duration: .36, ease: "power3.out", clearProps: "transform,opacity" });
    }, root);
    return () => context.revert();
  }, [root, index, reduced]);
}
