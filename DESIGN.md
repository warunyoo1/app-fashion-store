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
  pagination:
    backgroundColor: "{colors.cream}"
    textColor: "{colors.ink}"
    rounded: "{rounded.capsule}"
    height: "54px"
  purchase:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.capsule}"
    height: "48px"
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

The frontmatter mirrors src/styles/theme.css. White and cream are the surfaces, charcoal is the main text/action color and muted olive is a small interaction accent. Only the browsing hero has a faint pink-to-mint surface; focused products sit on plain studio white. Keep original source GLBs on disk. modernWardrobe.ts owns the active product names, two colorways per refinished garment, finish material allowlists and matching thumbnails. The Relaxed Tee retains Chalk/Ink. Names, prices and sizes are demonstration data.

**The Material Rule.** Change only allowlisted clothing materials on a cloned assembly. Replace their printed diffuse map with the chosen solid color and tuned roughness; preserve sculpted folds, normal/AO maps, UVs, geometry, source textures and untouched hardware. Eleven garments have new two-color material edits; all twelve remain distinct source meshes. Do not replace real garments with procedural stand-ins.

## Typography

Self-hosted DM Sans carries headings and English UI; Noto Sans Thai carries Thai text. Keep Oswald only for the RACK wordmark. Headings use sentence case, medium weight and a clear 1.08 line-height. Hero caption is 20px desktop / 18px phone. Collection headings reach 68px; close-view headings reach 64px. Focused product names use 24px desktop / 20px phone. Body text is 13–14px and metadata is 11–12px. No decorative backdrop words behind the clothes. Keep real creator/source names visible in credits.

## Layout

The full-width rail occupies the first viewport below the sticky header (82px desktop, 69px phone). Keep the clear 64px band above the rail for the caption. Browsing controls and the slim 200px range slider remain below the garment. Space rail items using their actual width/depth and resting angle; reserve the full rotation envelope for a focused item.

Selecting a garment isolates it: fade neighbours fully out and hide the rail, then ease the camera into product framing. At 900px and above, place the model left and a 320px purchase panel right. Below 900px, center the garment above a bottom purchase panel, with a minimum 760px stage so short screens scroll instead of overlapping controls. Keep quiet rotation/selection tools at top left and the close action at top right.

The collection edit remains a copy/3D pair with three tabs: Essentials, Soft layers and Outerwear. The next section pairs the close-view garment with its picker/details action. At 900px adapt columns; at 600px stack copy and scenes with full-width product controls. Header navigation becomes a native popover below 741px. Footer links form a row below 901px, then stack below 641px. Preserve 44px targets, visible keyboard focus and stable scrollbar space.

## Elevation & Depth

Depth comes primarily from WebGL lighting, real cloth folds and subtle shadows. UI surfaces are matte: no beveled gradients or large text shadows. Raised light controls use a soft 0 4px 14px -7px shadow. Popups/dialogs use the stronger panel shadow. The garment picker uses a clean white surface without a visible border or raised shadow, including hover/open states; preserve its keyboard focus outline. Keep shadow vocabulary in theme.css, not scattered overrides.

## Shapes

Retain the user's capsule navbar. Header icons remain unfilled at rest. On the rail, matching white circular arrows flank a dark capsule details action without an outer tray. Arrow targets stay 44px; general main actions use 12px corners. Focused purchase uses a full-width 48px dark capsule and circular 44px sizes. The garment select has 16px corners and its popup has 8px gaps between items. Its pagination is one cream capsule: matching white circular previous/next buttons flank a centered tabular counter. Both arrows have the same default/hover treatment; the dark fill appears on hover rather than permanently privileging the next action. Colorway controls retain circular native-radio swatches with a selected ring/check and readable color name. Never obscure garments with oversized UI.

## Components

**Rail.** Wheel/trackpad, horizontal dragging, arrows and a keyboard-accessible range control reach all twelve garments. Pointer intent uses a short enter delay and leave tolerance. Low-polygon hit targets avoid detailed-cloth raycasting. Hover does not shift the pan anchor. A drag cannot become a click. Returning from focus restores the physical hook-to-rail alignment. Focus preserves rotation, sizes, favorites and the local bag. The initial featured garment retains source id western-shirt, now displayed as Tie-detail Shirt.

**Focused purchase.** Group price, inline color radios, size circles and the purchase capsule beside/below the isolated garment. Keep prices explicitly marked as demonstration values. Selected size is dark; the add action briefly changes to a checked confirmation for the exact product/color/size. Changes of color/size cannot inherit another selection's confirmation. Stop pointer input from purchase controls reaching model rotation. Closing returns to the same browsed item.

**Hangers.** The shared wooden hanger stays the default across hero, collection and menu previews. Only source id western-shirt in A closer look uses the wire-metal hanger. Its separate metalHangerFit (drop .32, depth -.13) positions the shoulders between the real front/back cloth surfaces. Keep the hook crown fixed and include hanger style in preparation/display/cache keys. Generated hanger geometry/materials are owned by the canvas cache and disposed with it.

**Studio scenes.** Existing 45-degree rotation and 1.0–1.65 zoom controls remain. On desktop/tablet, align their full-width row directly below the product picker's pagination in the right column. Use separate quiet cream rotation and zoom controls without an outer floating panel. On phones, show the same controlled component below the canvas with a 16px gap and a 590px artboard; CSS exposes only one control group at each breakpoint. The canvas clips magnified garments within its own area so controls never cover clothing. Switching products resets rotation/zoom. The Radix picker supports typeahead, arrows, Escape and outside dismissal. Its white popup uses cream for the selected row with a dark circular check; hover is a quiet paper fill and keyboard focus has its own inset outline. Keep 8px option gaps, uncropped garment previews and a small circular disclosure action on the trigger. Studio selection is independent until the details action opens that garment on the rail. Labels and creator notes must match the current garment.

**Direct garment interaction.** Only A closer look enables horizontal drag-to-rotate and two-pointer pinch at 1.0–1.65x. Keep vertical single-finger movement as native page scrolling; claim/capture horizontal intent only after a small threshold. Store pointer movement outside React and commit the final angle/zoom once on release. Rotation buttons continue from the dragged angle and describe that angle for assistive technology. The first-use gesture hint appears near the top-left of the scene and disappears after a real drag/pinch or use of the view controls. Collection and dialog previews retain their existing interaction.

**Physical feedback and exchanges.** Rotate/sway around the hook opening, keeping garment and hanger together and the suspension cord outside the sway pivot. Use a small analytic damped pendulum, cap its angle/velocity and settle exactly; disable decorative sway for reduced motion and stop when inactive. Prepare the next garment's shaders before exiting the displayed item. Fade/move the old assembly out in 180ms and reuse the new assembly's bounded entrance, with no simultaneous duplicate of a cached source object. Rapid changes cancel the old completion and recover from the displayed pose. Restore cached material opacity on cleanup without disposing shared geometry/textures or recompiling shaders. Only the latest prepared request may be displayed; reduced motion switches directly.

**Menus.** Native dialogs retain focus handling, Escape, sticky heading/close action and a single demand-rendered garment preview. Bag hover/focus previews its exact product/colorway; removing it selects a remaining item. Dialog actions restore focus/unlock the page before scrolling to the hero. Keep the demonstration-price label and the no-real-checkout explanation.

**Footer.** Use a smaller two-line invitation (40–64px), compact text navigation rows and unframed arrow icons. Keep only the back-to-top arrow in a small circular surface; avoid large pill menus or shadows on navigation. A single divider separates the invitation/navigation from the 44px wordmark and copyright. Keep all five creator source links visible; display the common license link once when their license URLs match, falling back to individual links otherwise. Credits wrap naturally into columns on phones, with 44px link targets. Preserve the shared text reveal and shorter, quiet link arrivals.

**Footer boundary.** Omit the outer section border. Fade the final 64px of the close-view canvas (48px on phones) into studio white, then blend white into cream across the first 96px of the footer (64px on phones). The top blend layer expands once with GSAP from scale .45 to 1 in 800ms as the footer enters; animate its transform rather than repainting a moving gradient. Keep the static full blend for reduced motion and script fallback. The blend stays behind content and never intercepts input; preserve the internal footer divider.

**Close-view details action.** Keep the details button inside the 360px selection group, directly after the view controls with the shared 12px gap. It fills the group width, aligns its arrow to the trailing edge and precedes the product/creator note. On phones it follows the product picker; view controls remain below the model.

**Motion and performance.** The collection headline is the focal text arrival: its four words unfold from line masks with a small perspective turn and a capped stagger. The close-view and footer headings use quieter two-line reveals; supporting Thai copy follows as a complete paragraph. Use GSAP ScrollTrigger at 88% of the viewport, expo.out, 650–800ms, once per page visit. Complete text immediately when fast scrolling past it. Keep full heading names accessible, text visible without animation, reduced motion static, and remove inline transforms/will-change when finished. Refresh trigger positions after font or page-height changes. Keep existing tab feedback, bounded footer controls and subtle studio parallax. No new continuous animation. Animate presentation parents independently from garment/camera controls. Honor reduced motion, stop inactive canvases, retain demand rendering and cap DPR at 1.5. Cache prepared assemblies per canvas/colorway/hanger. Reuse shaders; spread texture uploads/compilation across frames and cancel work at teardown. Keep the previous garment until the next is prepared. Do not dispose loader-owned geometry/textures during per-display cleanup or StrictMode reacquisition.

**Fallbacks and attribution.** Renderer failures retain the HTML catalogue/product thumbnails and disable rotation. Every modern thumbnail is a render of the actual assembled source mesh/material/colorway, not a recolored original photo. Keep linked CC BY 4.0 creator/license credits in footer/About and public asset records, including the material modifications. No payment, stock or API integration is implied.

## Do's and Don'ts

- Do let the real garments provide the visual detail.
- Do keep thumbnail, color name, selected state and 3D material consistent.
- Do use the existing source meshes, hanger fits and performance safeguards.
- Do preserve keyboard, reduced-motion and phone layouts.
- Don't add a walkable store or replace the rail hero.
- Don't recolor source texture files or mutate shared loader materials.
- Don't reintroduce heavy text shadows, beveled UI or decorative words behind clothing.
