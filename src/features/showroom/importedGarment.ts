import { Box3, Group, Mesh, MeshPhysicalMaterial, MeshStandardMaterial, Vector3 } from "three";
import type { BufferGeometry } from "three";
import { createMetalHanger } from "./metalHanger.ts";
import type { GarmentFinish } from "../catalog/modernWardrobe.ts";

export const SHARED_HANGER_FILE = "/assets/models/shared-hanger/wooden-hanger.glb";
export interface HangerFit { widthScale: number; drop: number; depth?: number }
export type HangerStyle = "wood" | "metal";
interface AssemblyOptions {
  hideNodes: readonly string[];
  finish?: GarmentFinish;
  accent?: string;
  hanger: { style?: "wood"; source: Group; fit: HangerFit } | { style: "metal"; fit: HangerFit };
}

/** Keep the original hook fixed while fitting the same wooden shoulders inside each collar. */
export function fitWoodenHanger(geometry: BufferGeometry, fit: HangerFit) {
  const position = geometry.getAttribute("position");
  for (let i = 0; i < position.count; i++) {
    const y = position.getY(i);
    const body = Math.max(0, Math.min(1, (1.36 - y) / .06));
    position.setXYZ(i, position.getX(i) * (1 + (fit.widthScale - 1) * body),
      y - fit.drop * body, position.getZ(i) + (fit.depth ?? 0) * body);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  if (geometry.index && geometry.hasAttribute("uv")) geometry.computeTangents();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

/** Cache geometry/textures, but give each canvas its own mutable materials. */
export function cloneImportedGarment(source: Group, color: string, colorMaterial: string, assembly?: AssemblyOptions) {
  const object = source.clone(true);
  const ownedGeometries: BufferGeometry[] = [];
  const ownedMaterials = new Set<MeshStandardMaterial>();
  if (assembly) {
    for (const name of assembly.hideNodes) object.getObjectByName(name)?.removeFromParent();
    if (assembly.hanger.style === "metal") {
      const hanger = createMetalHanger(assembly.hanger.fit);
      object.add(hanger.object);
      ownedGeometries.push(...hanger.geometries);
      ownedMaterials.add(hanger.material);
    } else {
      assembly.hanger.source.updateMatrixWorld(true);
      const original = assembly.hanger.source.getObjectByName("ShirtOnHanger_Hanger_0");
      if (!(original instanceof Mesh)) throw new Error("Shared wooden hanger is missing from the source model");
      const geometry = fitWoodenHanger(original.geometry.clone().applyMatrix4(original.matrixWorld), assembly.hanger.fit);
      const hanger = new Mesh(geometry, original.material);
      hanger.name = "RACK_shared_wooden_hanger";
      object.add(hanger);
      ownedGeometries.push(geometry);
    }
  }
  const clones = new Map<MeshStandardMaterial, MeshStandardMaterial>();
  object.traverse(node => {
    if (!(node instanceof Mesh)) return;
    const clone = (original: MeshStandardMaterial) => {
      let material = clones.get(original);
      if (!material) {
        material = ownedMaterials.has(original) ? original : original.clone();
        material.transparent = true;
        // The opaque cloth depth-writes correctly in one double-sided pass; fades stay uniform-only.
        material.forceSinglePass = true;
        material.opacity = 1;
        material.depthWrite = true;
        material.alphaTest = Math.max(material.alphaTest, .02);
        if (original.name === colorMaterial) material.color.set(color);
        if (assembly?.finish?.materials.includes(original.name)) {
          // Refinish cloth only. Keep its sculpted folds, normal/AO maps and all hardware.
          material.map = null;
          material.color.set(assembly.finish.accentMaterials?.includes(original.name) ? assembly.accent ?? color : color);
          material.roughness = assembly.finish.roughness;
          material.metalness = assembly.finish.metalness ?? 0;
          if (material instanceof MeshPhysicalMaterial) {
            material.sheen = assembly.finish.roughness > .7 ? .18 : .05;
            material.sheenColor.copy(material.color);
            material.sheenRoughness = .85;
          }
        }
        clones.set(original, material);
      }
      return material;
    };
    node.material = Array.isArray(node.material)
      ? node.material.map(clone) : clone(node.material);
    node.castShadow = node.receiveShadow = true;
    node.raycast = () => {};
  });
  const bounds = new Box3().setFromObject(object);
  const size = bounds.getSize(new Vector3());
  return { object, materials: [...clones.values()], ownedGeometries, hitWidth: size.x,
    hitHeight: size.y, hitDepth: size.z, hitCenter: bounds.getCenter(new Vector3()).toArray() as [number, number, number] };
}
