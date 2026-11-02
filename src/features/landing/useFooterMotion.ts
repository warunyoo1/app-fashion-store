import { useLayoutEffect } from "react";
import type { RefObject } from "react";
import { gsap, ScrollTrigger } from "../../shared/motion/gsap";

/** Quiet arrivals for the footer links; heading choreography is shared. */
export function useFooterMotion(root: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    if (!root.current) return;
    const footer = root.current;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const main = footer.querySelector<HTMLElement>(".footer-main")!;
      const bottom = footer.querySelector<HTMLElement>(".footer-bottom")!;
      const intro = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
      intro.fromTo(footer, { "--footer-blend-scale": .45 },
        { "--footer-blend-scale": 1, duration: .8, clearProps: "--footer-blend-scale" }, 0);
      intro.fromTo(footer.querySelectorAll(".footer-navigation > a, .footer-navigation > button"),
        { x: 8, opacity: .75 },
        { x: 0, opacity: 1, duration: .45, stagger: .055, clearProps: "transform,opacity" }, .12);
      ScrollTrigger.create({ trigger: footer, start: "top 92%", once: true, animation: intro });

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
