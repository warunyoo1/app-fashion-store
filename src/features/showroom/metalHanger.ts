import { CatmullRomCurve3, Group, Mesh, MeshStandardMaterial, TubeGeometry, Vector3 } from "three";
import type { HangerFit } from "./importedGarment.ts";
import { hookPoints } from "./garmentRig.ts";

/** Slim brushed-metal hanger; the fixed crown keeps the shared hook anchor. */
export function createMetalHanger(fit: HangerFit) {
  const object = new Group();
  object.name = "RACK_shared_metal_hanger";
  const material = new MeshStandardMaterial({ name: "RACK_brushed_metal", color: "#8b939a", metalness: .8, roughness: .32 });
  const depth = fit.depth ?? 0, apex = 1.28 - fit.drop;
  const shoulders = [
    [0, 1.28], [-.12, 1.25], [-.3, 1.13], [-.42, 1.01], [-.41, .97],
    [-.36, .955], [0, .955], [.36, .955], [.41, .97], [.42, 1.01], [.3, 1.13], [.12, 1.25],
  ].map(([x, y]) => new Vector3(x * fit.widthScale, y - fit.drop, depth));
  const crown = new CatmullRomCurve3(hookPoints.slice(1).map(([x, y, z]) => new Vector3(x, y, z)));
  const stem = new CatmullRomCurve3([
    new Vector3(0, apex, depth), new Vector3(0, (apex + 1.24) / 2, depth * .25), new Vector3(0, 1.24, 0),
  ]);
  const geometries = [
    new TubeGeometry(new CatmullRomCurve3(shoulders, true), 48, .012, 8, true),
    new TubeGeometry(stem, 8, .01, 8, false),
    new TubeGeometry(crown, 40, .01, 8, false),
  ];
  ["shoulders", "stem", "hook"].forEach((part, index) => {
    const mesh = new Mesh(geometries[index], material);
    mesh.name = `RACK_metal_${part}`;
    object.add(mesh);
  });
  return { object, geometries, material };
}
