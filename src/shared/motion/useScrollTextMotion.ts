import { useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";
import { gsap, ScrollTrigger } from "./gsap";

/** One typographic unfolding; no scrolling React state or continuous effects. */
export function useScrollTextMotion(root: RefObject<HTMLElement | null>) {
  const revealed = useRef(new WeakSet<HTMLElement>());

  useLayoutEffect(() => {
    const host = root.current;
    if (!host) return;
    const media = gsap.matchMedia();
    media.add({
      full: "(prefers-reduced-motion: no-preference)",
      phone: "(max-width: 600px)",
    }, context => {
      if (!context.conditions?.full) return;
      const phone = !!context.conditions.phone;
      for (const heading of host.querySelectorAll<HTMLElement>(".scroll-heading")) {
        if (revealed.current.has(heading)) continue;
        const words = heading.dataset.textReveal === "words";
        const targets = heading.querySelectorAll<HTMLElement>(words ? ".scroll-title-word" : ".scroll-title-line");
        const copy = heading.nextElementSibling?.matches("[data-scroll-copy]") ? heading.nextElementSibling : null;
        const timeline = gsap.timeline({ paused: true, defaults: { ease: "expo.out" },
          onComplete: () => { revealed.current.add(heading); } });
        timeline.fromTo(targets,
          { yPercent: words ? 110 : 80, xPercent: words ? 8 : 0, rotationX: phone ? -12 : words ? -36 : -18, opacity: .2 },
          { yPercent: 0, xPercent: 0, rotationX: 0, opacity: 1,
            duration: words ? .8 : .65, stagger: words ? .065 : .09,
            willChange: "transform,opacity", clearProps: "transform,opacity,willChange" }, 0);
        if (copy) timeline.fromTo(copy, { y: 6, opacity: .6 },
          { y: 0, opacity: 1, duration: .5, clearProps: "transform,opacity" }, .2);
        ScrollTrigger.create({ trigger: heading, start: "top 88%", end: "bottom top",
          once: true, fastScrollEnd: true, animation: timeline });
      }
    }, host);

    // Focusing a product changes hero height; keep the lower text triggers aligned.
    let disposed = false;
    let frame = 0;
    const refresh = () => {
      if (disposed || frame) return;
      frame = requestAnimationFrame(() => { frame = 0; ScrollTrigger.refresh(); });
    };
    const resize = new ResizeObserver(refresh);
    resize.observe(host);
    void document.fonts.ready.then(refresh);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      media.revert();
    };
  }, [root]);
}
