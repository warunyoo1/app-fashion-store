# app-fashion-store

Interactive fashion landing page inspired by the clothing-rack interaction at https://www.instagram.com/p/Dez5Qf4Bdnz/.

## Run

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5175/. `npm run build` checks TypeScript and builds the production site. `npm run preview` serves the build on port 4175.

## Features

- Minimal & Clean white/cream theme, with shared color and material roles in `src/styles/theme.css`, tactile rail/detail controls and restrained popup shadows. Garment materials and colorways retain their original designs.
- A floating cream capsule navbar follows the supplied reference's shape, with a sliding white selection, section-aware links, left-aligned wordmark and circular saved/bag actions. Its colors, warm shadows and focus ring use the shared white/cream theme tokens; the native mobile popover uses the same palette below 741px. Header styling is owned by `src/features/landing/storeHeader.css`.
- A matching cream footer uses raised capsule links and a tactile back-to-top action. Creator/source and license links remain fully visible in a separate responsive credit list. The footer stacks its layout on smaller screens, with reduced motion and keyboard focus retained.
- A scrolling landing page led by the original full-viewport interactive 3D rack hero, followed by an interactive 3D collection edit, close-view 3D garment and footer.
- Collection tabs select three style pairings; CTA buttons open the matching item on the hero. The close-view scene supports rotation and zoom. No walkable store is included.
- Twelve distinct imported GLB garments with their original surface details, fitted to one consistent wooden hanger. Earlier photographic and procedural samples remain archived.
- Western Shirt uses a slim brushed-metal hanger specifically in A closer look. Other garments and presentations retain the shared wooden hanger. Each assembly variant has its own prepared cache entry and owned geometry/materials.
- Browse the long rail with a wheel/trackpad, horizontal drag, arrow buttons or the accessible range control.
- Hover swings a garment forward; arrow buttons do the same for keyboard and touch.
- Focus, drag to rotate, front/back button, return to rack.
- Size selection, local favourites, bag quantities and demo totals.
- Responsive layout, reduced motion, native modal focus handling.
- Tactile menu controls, section-aware navigation and a complete mobile navigation popover. Bag, favorites and About have an actual 3D product preview with rotation/zoom; bag previews follow the selected item and colorway. The original camera and rail movement are preserved.
- GSAP entrances for the hero rail and changing studio garments; ScrollTrigger coordinates studio arrivals and subtle scroll-driven viewing angles.
- The collection edit uses grouped spacing, underline tabs and a clearer garment CTA. GSAP coordinates its heading reveal, shared tab marker and changing description; keyboard navigation and reduced motion remain available.

RACK names, sizes and prices are demonstration content. There is no live inventory, order submission or payment system. Bag and favourites reset on refresh. Garments by funlab117, Naira, Style3D CG and Obridje, and the wooden hanger by plaggy, have linked CC BY 4.0 credits in the footer and About. These are static sculpted models, not cloth simulations. Archived photographs and procedural prototypes remain in the repo but are not used in the current catalogue.

## Imported garments

Preparation scripts reproduce public GLBs from unchanged source downloads in `assets/garments/`. Clothes is split into four products, including the correct hardware for each garment. Every source triangle and all 27 source texture images are retained across those four exports; unused meshes and duplicate whole-collection buffers are omitted. The active catalogue also uses the reduced Relaxed Tee, seven curated garments and an extracted shared wooden hanger, as described below.

The hook opening aligns to the rail anchor. All displayed garments use the same wooden hanger from Studio Tee, fitted per collar; embedded source hangers are hidden in the display assembly. Mobile focus and close-view framing account for garment dimensions. The hero opens with Western Shirt facing forward. Collection pairings, product dropdown, previews and thumbnails use the same twelve products. Per-display cloned materials isolate tint and fading while cached geometry/textures remain shared. Chalk/Ink tint only Relaxed Tee; Naira’s original material colours are preserved.

Public credits are retained in each model folder and `public/assets/sources.json`. More source details live in `assets/garments/README.md`.

## Motion verification

`npm test` covers frame-rate-independent easing, rapid hover changes, gaps between garment parts and pending hover cleanup. Animated meshes receive their initial pose once; target changes are interpolated in the frame loop. Pointer picking uses a low-polygon proxy per garment. Frames are requested only while a transition is running, with DPR capped at 1.5.

GSAP timelines animate outer presentation groups independently from interactive garment poses and camera zoom. ScrollTrigger observes the studio canvases without taking over page scrolling. Spatial entrances respect reduced motion. Tests also cover demand-render callbacks, preserving the child garment pose and reverting interrupted animations without leaving active tweens.

Imported-garment tests check material/colour isolation between rail and menu previews, retention of cached geometry/textures, and the shipped GLB's hook alignment at browsing and enlarged focus scales.

## Structure

The current Modern wardrobe edit lives in `src/features/catalog/modernWardrobe.ts`: eleven real garments receive two neutral colorways and an explicit clothing-material allowlist. The renderer changes cloned diffuse colors/roughness while retaining source geometry, normal/AO maps and untouched hardware. All 22 new thumbnails in `public/assets/modern-wardrobe/` are renders of those exact assemblies. `DESIGN.md` and `.impeccable/design.json` record the lighter contemporary typography, matte surfaces and shared UI tokens.

`src/app/` owns page state and composition. `src/features/landing/` contains the hero, collection edit, close-view controls, footer and responsive styling. `src/features/catalog/` contains typed demonstration products. `src/features/showroom/` owns shared garment geometry/materials, texture creation, the rail scene and the additional studio scenes. `src/shared/` contains reusable UI and the shared GSAP setup, hero hook and Three.js entrance timelines in `motion/`. `src/styles/` contains the responsive design system. No source files from the skincare project were copied.

## Consistent hangers and rail spacing

All twelve products use the same wooden hanger from plaggy’s Studio Tee GLB. The shared source is cached once; each display hides the original embedded hanger, clones the shared hanger materials and fits the wooden shoulders to its collar without moving the hook opening. Hoodies keep the shoulders below the hood opening. Newly created hanger geometry is disposed with its display. Rail slots use each garment’s width, depth and resting rotation plus a clear gap; open/focused slots reserve the full rotation envelope. Both desktop and mobile frame a readable portion of the rail around the browsed item. Thumbnails use the same assembled models.

## Replacement tee

The active first product is Relaxed Tee, using T Shirt by funlab117 (CC BY 4.0), replacing the archived CHEESE sample. Source geometry is simplified from 237,938 to 29,116 triangles with locked boundaries, normal/UV weights and a .003 error limit. Matching surfaces are merged into one draw call; the public GLB is about .9 MB. The source has no texture images; cotton roughness/sheen and Chalk/Ink material tints are added. It uses the common wooden hanger, now extracted into a separate 3.7 MB GLB without the old shirt body or artwork. Product slot 0, thumbnails, collection, close view and all menu previews use the new model. The hero CTA follows the featured product name. Keep both funlab117 garment credit and plaggy hanger credit.

Rebuild from unchanged sources with `node scripts/prepare-relaxed-tee.mjs` and `node scripts/prepare-shared-hanger.mjs` from the repository root. Meshoptimizer is used only by preparation scripts; there is no new browser decoder dependency.

## Curated long rail

The catalogue contains twelve distinct imported garments, including seven additional CC BY 4.0 models from Style3D CG and Obridje. Geometry preparation preserves the original embedded PBR maps, fits the shared wooden hanger, and reduces dense source meshes. curated-models.json records download sources; curated-rail-models.json records sizes and simplification results; write-curated-catalog.mjs writes the typed product entries. Source material names are retained; Rose Leather Jacket applies an additional demonstration rose tint. Opaque garment pixels write depth even when their source uses BLEND, preventing inner surfaces from drawing over the front in close views. Alpha testing preserves actual cutouts while material clones still support fading.

The hero is a long rail at a readable camera scale. Wheel/trackpad movement over the rack, horizontal pointer dragging, a themed accessible range control, arrow buttons, and range keyboard Home/End/arrow keys all reach every item. Vertical wheel scrolling returns to the page at either end; product focus leaves wheel events to page scrolling and keeps drag-to-rotate. The pan anchor is independent of hover spacing. Input is coalesced to animation frames, hover pauses during panning, and a drag cannot become a product click. Render only the visible neighbourhood plus a small margin, with per-garment Suspense so an unseen asset does not block the whole rack. Keep demand rendering, cloned materials, reduced motion, and the existing shirt selection, favourites, bag and studio flows.

Rebuild the additional assets with `node scripts/prepare-curated-garments.mjs`, then `node scripts/write-curated-catalog.mjs`. The original source downloads stay unchanged in assets/garments. The hero now features Western Shirt, and the three collection pairings include the new garments.

## Interaction performance

Each canvas keeps its own garment objects, cloned materials and fitted hanger geometry for its lifetime. Reopening an item reuses compiled GPU programs; geometry and source textures remain loader-shared, while fades and colorways stay isolated between canvases. Cached resources are released when their canvas closes, after pending preparation settles. StrictMode reacquisition cancels premature disposal.

Before displaying a new garment, the renderer uploads one texture or starts one mesh compilation per frame. It polls `KHR_parallel_shader_compile` completion when supported. The preparation path snapshots program handles and cancels on canvas teardown, avoiding Three r180's asynchronous material-property polling after disposal. Browsers without that extension retain paced uploads/compilation, but may still stall on first shader use. Studio scenes keep the previous garment visible while preparing the requested one, with a loading status tied to the requested product. Hero readiness also tracks the selected colorway. Offscreen canvases stop rendering and do not start new preparation; stable props isolate the hero, collection and detail updates.

Local development measurements on 2026-10-29 used the same 1280×720 in-app browser, 1.8-second animation-frame samples after each click, and a frozen copy of the original source. The comparable collection baseline below had a warm driver shader cache. These are single-machine diagnostic samples, not field INP or a guarantee for mobile hardware.

| Interaction | Before: longest frame | After: longest frame |
| --- | ---: | ---: |
| Open / return from hero garment | 250 / 216 ms | 17 / 17 ms |
| Collection: Graphic play / Off duty / Everyday | 350 / 250 / 250 ms | 17 / 33 / 17 ms |
| Close view: next / previous / next again | 416 / 133 / 150 ms | 17 / 17 / 17 ms |

The optimized samples in the table had no tasks over 50 ms; revisiting a prepared garment required no new shader compilation. Opening a menu with a new WebGL context measured a 50 ms longest frame / 67 ms task; subsequent preview rotation and closing measured 33 ms longest frames. Context creation and first-use performance still depend on the device and driver. The models, original texture images, rail spacing and material-depth UI remain intact. `npm test` covers preparation deduplication, paced/shared uploads, asynchronous readiness, retry, teardown cancellation, resource ownership and StrictMode reuse in addition to the garment and motion checks.
