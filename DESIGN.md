---
name: RACK Modern Wardrobe
description: An interactive 3D clothing rail with a quiet contemporary wardrobe.
colors:
  paper: "#fafaf7"
  surface: "#ffffff"
  cream: "#f0efe9"
  ink: "#292d2a"
  muted: "#62685f"
  line: "#dcded5"
  accent: "#56634f"
  selected: "#dfe4dc"
  focus: "#4f6948"
typography:
  display:
    fontFamily: "DM Sans, Noto Sans Thai, sans-serif"
    fontSize: "clamp(44px, 5.3vw, 68px)"
    fontWeight: 500
    lineHeight: 1.08
    letterSpacing: "-0.04em"
  body:
    fontFamily: "DM Sans, Noto Sans Thai, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.85
rounded:
  control: "12px"
  picker: "16px"
  capsule: "999px"
spacing:
  small: "8px"
  control: "16px"
  group: "24px"
  section: "80px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.control}"
    height: "48px"
    padding: "12px 18px"
  nav:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.muted}"
    rounded: "{rounded.capsule}"
  picker:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.picker}"
---

# RACK storefront

## Overview

**Creative North Star: "Modern wardrobe, physical presence."**

The clothing rail remains the hero. Refine the existing white/cream RACK identity into a quieter fashion studio; the garments supply the depth, material and color. This is an evolution of the existing landing page, with its navigation, rail and product flows preserved. The source interaction remains the Instagram reference recorded in REFERENCES.md.

**Key Characteristics:**
- Actual sculpted garments, calm colorways and distinct cloth/leather finishes.
- Mixed-case typography with a lighter visual rhythm.
- White and cream surfaces with restrained capsule controls.
- Interactive 3D throughout the rail, collection edit, close view and open menus.

## Colors

The frontmatter mirrors src/styles/theme.css. White and cream are the surfaces, charcoal is the main text/action color and muted olive is a small interaction accent. Keep original source GLBs on disk. modernWardrobe.ts owns the active product names, two colorways per refinished garment, finish material allowlists and matching thumbnails. The Relaxed Tee retains Chalk/Ink. Names, prices and sizes are demonstration data.

**The Material Rule.** Change only allowlisted clothing materials on a cloned assembly. Replace their printed diffuse map with the chosen solid color and tuned roughness; preserve sculpted folds, normal/AO maps, UVs, geometry, source textures and untouched hardware. Eleven garments have new two-color material edits; all twelve remain distinct source meshes. Do not replace real garments with procedural stand-ins.

## Typography

Self-hosted DM Sans carries headings and English UI; Noto Sans Thai carries Thai text. Keep Oswald only for the RACK wordmark. Headings use sentence case, medium weight and a clear 1.08 line-height. Hero caption is 28px desktop / 25px phone. Collection headings reach 68px; close-view headings reach 64px. Body text is 13–14px and metadata is 11–12px. No decorative backdrop words behind the clothes. Keep real creator/source names visible in credits.

## Layout

The full-width rail occupies the first viewport below the sticky header (82px desktop, 69px phone). Keep the clear 64px band above the rail for the focused back action; zoom must never raise the rail through controls. Browsing controls and the range slider remain below the garment. Space rail items using their actual width/depth and resting angle; reserve the full rotation envelope for a focused item.

The collection edit remains a copy/3D pair with three tabs: Essentials, Soft layers and Outerwear. The next section pairs the close-view garment with its picker/details action. At 900px adapt columns; at 600px stack copy and scenes with full-width product controls. Header navigation becomes a native popover below 741px. Footer links form a row below 901px, then stack below 641px. Preserve 44px targets, visible keyboard focus and stable scrollbar space.

## Elevation & Depth

Depth comes primarily from WebGL lighting, real cloth folds and subtle shadows. UI surfaces are matte: no beveled gradients or large text shadows. Raised light controls use a soft 0 4px 14px -7px shadow. Popups/dialogs use the stronger panel shadow. The garment picker uses a fine border without a raised shadow. Keep shadow vocabulary in theme.css, not scattered overrides.

## Shapes

Retain the user's capsule navbar and single capsule rail picker. Inner arrows have 44px targets; main actions use 12px corners. The garment select has 16px corners and its popup has 8px gaps between items. Colorway controls retain circular native-radio swatches with a selected ring/check and readable color name. Never obscure garments with oversized UI.

## Components

**Rail.** Wheel/trackpad, horizontal dragging, arrows and a keyboard-accessible range control reach all twelve garments. Pointer intent uses a short enter delay and leave tolerance. Low-polygon hit targets avoid detailed-cloth raycasting. Hover does not shift the pan anchor. A drag cannot become a click. Focus preserves hook-to-rail alignment, rotation, sizes, favorites and the local bag. The initial featured garment retains source id western-shirt, now displayed as Tie-detail Shirt.

**Hangers.** The shared wooden hanger stays the default across hero, collection and menu previews. Only source id western-shirt in A closer look uses the wire-metal hanger. Its separate metalHangerFit (drop .32, depth -.13) positions the shoulders between the real front/back cloth surfaces. Keep the hook crown fixed and include hanger style in preparation/display/cache keys. Generated hanger geometry/materials are owned by the canvas cache and disposed with it.

**Studio scenes.** Existing 45-degree rotation and 1.0–1.65 zoom controls remain. Switching products resets rotation/zoom. The Radix picker supports typeahead, arrows, Escape and outside dismissal. Its white popup uses cream for the selected row with a dark circular check; hover is a quiet paper fill and keyboard focus has its own inset outline. Keep 8px option gaps, uncropped garment previews and a small circular disclosure action on the trigger. Studio selection is independent until the details action opens that garment on the rail. Labels and creator notes must match the current garment.

**Menus.** Native dialogs retain focus handling, Escape, sticky heading/close action and a single demand-rendered garment preview. Bag hover/focus previews its exact product/colorway; removing it selects a remaining item. Dialog actions restore focus/unlock the page before scrolling to the hero. Keep the demonstration-price label and the no-real-checkout explanation.

**Motion and performance.** Preserve existing bounded GSAP arrivals, the tab marker and subtle studio parallax. No new continuous animation. Animate presentation parents independently from garment/camera controls. Honor reduced motion, stop inactive canvases, retain demand rendering and cap DPR at 1.5. Cache prepared assemblies per canvas/colorway/hanger. Reuse shaders; spread texture uploads/compilation across frames and cancel work at teardown. Keep the previous garment until the next is prepared. Do not dispose loader-owned geometry/textures during per-display cleanup or StrictMode reacquisition.

**Fallbacks and attribution.** Renderer failures retain the HTML catalogue/product thumbnails and disable rotation. Every modern thumbnail is a render of the actual assembled source mesh/material/colorway, not a recolored original photo. Keep linked CC BY 4.0 creator/license credits in footer/About and public asset records, including the material modifications. No payment, stock or API integration is implied.

## Do's and Don'ts

- Do let the real garments provide the visual detail.
- Do keep thumbnail, color name, selected state and 3D material consistent.
- Do use the existing source meshes, hanger fits and performance safeguards.
- Do preserve keyboard, reduced-motion and phone layouts.
- Don't add a walkable store or replace the rail hero.
- Don't recolor source texture files or mutate shared loader materials.
- Don't reintroduce heavy text shadows, beveled UI or decorative words behind clothing.
