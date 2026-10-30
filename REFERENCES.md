# RACK: a 3D fashion landing page

Reviewed 28 October 2026. The user chose the original clothing-rack landing page, with 3D presentation throughout the page. The final direction is an editorial fashion website, rather than a walkable shop.

## References

- [Lusion](https://lusion.co/): the studio's own site combines 3D visual storytelling with conventional interface controls. Useful for spatial depth, restrained interface elements and motion that answers scrolling or pointer movement.
- [Dioriviera by Immersive Garden](https://immersive-g.com/projects/dioriviera-1/): the creator's case study describes collection storytelling through designed 3D environments. Useful for coherent lighting, materials and product-led composition. Its linked campaign demo has a browser certificate error and was not bypassed.
- [Lacoste Summer by Emperia](https://emperiavr.com/project/lacoste-summer/) and [UnderOutfit by MersivX](https://www.mersivx.com/case-studies/underoutfit) were researched as virtual-store alternatives. Their walkable-store direction is excluded from the final implementation after the user's clarification.

## Applied direction

The original interactive rail remains the full-viewport hero. The lower photographic stories are replaced with two actual WebGL scenes: a two-garment collection edit, and a close-view garment with rotation and zoom controls. Collection tabs change the displayed garments and link back to the corresponding product on the hero rail. Scene angles respond subtly to scrolling and pointer movement. No walking controls, floor plan, interior architecture or virtual checkout are included.

Palette: paper #F0F1EF, soft paper #F0F1EB, pale green #D7DFCA, forest #2A3C2C, ink #1D2120, signal green #35D03A. Oswald is the display face, DM Sans is Latin UI and Noto Sans Thai is Thai UI.

Scenes load near the viewport, render on demand, cap DPR at 1.5 and respect reduced motion. The garment geometry, woven bump maps and fitted hangers are shared with the original hero, with per-display materials to prevent cross-scene fading. The Blue Check Shirt uses original DummyJSON front/back sample images. Its volume is an authored approximation, not a garment scan. No assets were copied from reference sites.
