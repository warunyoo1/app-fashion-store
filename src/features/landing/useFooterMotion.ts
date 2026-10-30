import { useLayoutEffect } from "react";
import type { RefObject } from "react";
import { gsap, ScrollTrigger } from "../../shared/motion/gsap";

/** A single arrival for the invitation and its raised navigation controls. */
export function useFooterMotion(root: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    if (!root.current) return;
    const footer = root.current;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const main = footer.querySelector<HTMLElement>(".footer-main")!;
      const bottom = footer.querySelector<HTMLElement>(".footer-bottom")!;
      const intro = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
      intro.fromTo(footer.querySelectorAll(".footer-title-line"),
        { yPercent: 30, opacity: .65 },
        { yPercent: 0, opacity: 1, duration: .72, stagger: .08, clearProps: "transform,opacity" }, 0);
      intro.fromTo(footer.querySelector(".footer-invitation p"),
        { y: 8 },
        { y: 0, duration: .5, clearProps: "transform" }, .18);
      intro.fromTo(footer.querySelectorAll(".footer-navigation > a, .footer-navigation > button"),
        { y: 20, rotationX: 9, transformPerspective: 800, opacity: .75 },
        { y: 0, rotationX: 0, opacity: 1, duration: .62, stagger: .075, clearProps: "transform,opacity" }, .18);
      ScrollTrigger.create({ trigger: main, start: "top 88%", once: true, animation: intro });

      // On phones this row arrives later, after the stacked navigation links.
      const closing = gsap.fromTo(bottom.querySelectorAll(".footer-signoff, .back-top, .footer-credits"),
        { y: 10 },
        { y: 0, duration: .5, stagger: .06, paused: true, ease: "power3.out", clearProps: "transform" });
      ScrollTrigger.create({ trigger: bottom, start: "top 90%", once: true, animation: closing });

      const onFocus = (event: FocusEvent) => {
        if (!(event.target instanceof HTMLElement) || !event.target.matches(":focus-visible")) return;
        // Keyboard navigation never has to follow a moving target.
        if (main.contains(event.target)) intro.progress(1).pause();
        if (bottom.contains(event.target)) closing.progress(1).pause();
      };
      footer.addEventListener("focusin", onFocus);
      return () => footer.removeEventListener("focusin", onFocus);
    }, root);
    return () => media.revert();
  }, [root]);
}
