# Forest Tee — Meshy trial v1

Original AI-generated reference images for testing a single garment on the existing RACK clothing rail. Created on 2026-10-29 with the built-in image generation tool. These images are references, not photographs of a real SKU. A corresponding Meshy 3D garment was subsequently generated and inspected in the user's Meshy workspace; export is currently blocked by the account's subscription requirement.

## Files

- `forest-tee-front.png`: primary single-image input for the first Meshy trial.
- `forest-tee-back.png`: matching rear reference for a later multi-view trial or manual inspection. Do not upload it as a separate garment or combine both views in a collage.
- `prompts.json`: exact image-generation prompts and intended garment details.

Design: plain deep forest-green cotton crew-neck T-shirt, narrow warm ivory rib-knit collar, relaxed short sleeves, subtle gravity folds. No person, mannequin, hanger, logo or text. Front and back were visually checked for consistent cut, colours and sleeve/hem proportions. The rear is an AI interpretation, not a measured scan.

## Meshy browser trial

The front image was accepted by the Image to 3D upload panel at:

https://www.meshy.ai/workspace?sidebar=model&model-tab=image-to-3d&from=home&page=landing

Settings at the Generate attempt:

| Setting | Value |
| --- | --- |
| Model | Meshy 7.1 - Flagship |
| Model type | High Detail |
| Resolution | Standard |
| Texture | On |
| Texture resolution | 2K |
| Image Enhancement | Off |
| Multi-view | Off |
| Split | Off |
| Pose | Off |
| License shown before and after sign-in | CC BY 4.0 |
| Cost shown | 30 credits |

The first Generate attempt opened the sign-in dialog. After the user signed in, the front image was re-uploaded with the settings above and one generation was submitted. Geometry and a textured variant both completed. Both entries are visible under Assets, dated 2026-10-29; the green thumbnail is the textured variant. No separate second garment generation was requested. The rear reference image was not submitted to this single-image trial.

The textured result was opened in the actual 3D viewer and dragged to inspect its front, rear and side. It has a volumetric shirt silhouette, relaxed short sleeves, draped folds and a plain green rear. The ivory collar and forest-green body broadly match the reference. The viewer has a green Printability indicator; this is Meshy's own signal and is not evidence that the asset is ready for a clothing hanger or real-time website. Exact neck/sleeve openings, topology, dimensions, pivot, triangle count, texture payload and browser loading cannot be verified without the file.

## Export result and next step

The textured model's Download Settings panel offered GLB. Clicking Download opened **Subscribe to download**, stating **Download all formats after subscribing**. No GLB was downloaded and no subscription or payment was made. Export is blocked by the account's current entitlement, not by an unsupported GLB format. The page was returned to the textured model viewer for review. The account also showed automatic onboarding/check-in rewards, so the changing net credit balance is not a reliable statement of the generation's exact debit; 30 credits is the quote shown on the Generate control.

Once the account has download entitlement:

1. Open the green textured garment under Assets, then Download and choose GLB with embedded textures.
2. Inspect its bounds, pivot, material count, file size and mesh density locally. Check collar, sleeve and hem openings before fitting the existing hanger.
3. Create a lighter web version if necessary, preserving the original for comparison.
4. Test the imported garment with the existing rail controls before replacing a catalogue garment.

Evidence captured in the ignored `.qa/` folder:

- `meshy-forest-tee-front.png`: actual generated textured garment in the Meshy viewer.
- `meshy-forest-tee-back.png`: same garment rotated to its rear.
- `meshy-forest-tee-side.png`: same garment rotated to a side angle.
- `meshy-glb-download-requires-subscription.png`: the actual account's export gate.

This is a successful generation/viewer trial with an incomplete export/integration step. It is not an imported GLB or a production-ready garment.

No website garment, catalogue product, rail geometry or application code was changed for this reference trial. Source images stay outside `public/` so unused high-resolution references are not bundled into the deployed site.
