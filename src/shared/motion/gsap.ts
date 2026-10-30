import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export { gsap, ScrollTrigger };

export function motionReduced(reduced: boolean) {
  return reduced || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
