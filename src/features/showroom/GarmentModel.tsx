import { useEffect, useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { CatmullRomCurve3, DoubleSide, MeshPhysicalMaterial, SRGBColorSpace, TextureLoader, TubeGeometry, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { products } from "../catalog/products";
import { createGarment } from "./garmentGeometry";
import { createGarmentTexture } from "./garmentTexture";
import { createPhotoGarment, readPhotoPixels } from "./photoGeometry";
import { createFabricBump } from "./fabricTexture";
import { hangerBodyPoints, hookPoints } from "./garmentRig";
import { cloneImportedGarment, SHARED_HANGER_FILE } from "./importedGarment";
import type { HangerStyle } from "./importedGarment";
import { useGarmentAssetCache } from "./GarmentAssetScope";
const skipRaycast = () => {};

export function Tube({
  points,
  radius = 0.025,
  color = "#8b9090",
  metalness = 0.8,
}: {
  points: number[][];
  radius?: number;
  color?: string;
  metalness?: number;
}) {
  const geometry = useMemo(
    () =>
      new TubeGeometry(
        new CatmullRomCurve3(
          points.map((p) => new Vector3(...(p as [number, number, number]))),
        ),
        48,
        radius,
        8,
        false,
      ),
    [points, radius],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} raycast={skipRaycast} castShadow receiveShadow>
      <meshStandardMaterial
        color={color}
        metalness={metalness}
        roughness={0.3}
        transparent
      />
    </mesh>
  );
}
export function Hanger({ kind, drop = 0 }: { kind: (typeof products)[number]["kind"]; drop?: number }) {
  const barPoints = useMemo(() => hangerBodyPoints(kind).map(([x, y, z]) => [x, y - drop, z]), [kind, drop]);
  const fittedHook = useMemo(() => hookPoints.map((point, i) => i === 0 ? [point[0], point[1] - drop, point[2]] : point), [drop]);
  return (
    <group>
      <Tube points={fittedHook} radius={0.013} color="#959d9c" />
      <Tube
        points={barPoints}
        radius={0.025}
        color="#30312e"
        metalness={0.02}
      />
    </group>
  );
}

/** Each display owns its materials so focusing one garment cannot fade another. */
export function useGarmentModel(index: number, colorway: number, hangerStyle: HangerStyle = "wood") {
  const cache = useGarmentAssetCache();
  const product = products[index], way = product.colorways[colorway];
  const photos = useLoader(TextureLoader, product.photographs
    ? [product.photographs.front, product.photographs.back] : []);
  const models = useLoader(GLTFLoader, product.model ? [product.model.file] : []);
  const sharedHangers = useLoader(GLTFLoader, hangerStyle === "wood" ? [SHARED_HANGER_FILE] : []);
  const imported = useMemo(() => product.model && models[0]
    ? cache.get(`${product.id}:${colorway}:${hangerStyle}`, () => cloneImportedGarment(models[0].scene, way.color, product.model!.colorMaterial, {
      hideNodes: product.model!.hideNodes,
      finish: product.model!.finish,
      accent: way.accent,
      hanger: hangerStyle === "metal" ? { style: "metal", fit: product.model!.metalHangerFit ?? product.model!.hangerFit }
        : { source: sharedHangers[0].scene, fit: product.model!.hangerFit },
    }))
    : null, [cache, models, sharedHangers, product, colorway, way, hangerStyle]);
  const geometry = useMemo(() => imported ? null : product.photographs
    ? createPhotoGarment(readPhotoPixels(photos[0].image), readPhotoPixels(photos[1].image))
    : createGarment(product.kind), [product, photos, imported]);
  const fabric = useMemo(() => product.model ? null : createFabricBump(), [product.model]);
  const materials = useMemo(() => {
    if (imported) return imported.materials;
    const maps = product.photographs ? photos.map(source => {
      const texture = source.clone();
      texture.colorSpace = SRGBColorSpace;
      texture.anisotropy = 4;
      return texture;
    }) : [false, true].map(back => createGarmentTexture(product, way, back));
    return [
      ...maps.map(map => new MeshPhysicalMaterial({ map, roughness: .92,
        sheen: .55, sheenRoughness: .9, bumpMap: fabric, bumpScale: .004,
        side: DoubleSide, transparent: true, alphaTest: .05 })),
      new MeshPhysicalMaterial({ color: way.color, roughness: .9, side: DoubleSide, transparent: true }),
    ];
  }, [product, way, photos, fabric, imported]);
  const hitWidth = useMemo(() => {
    if (imported) return imported.hitWidth;
    geometry!.computeBoundingBox();
    return geometry!.boundingBox!.max.x - geometry!.boundingBox!.min.x;
  }, [geometry, imported]);
  const baseColors = useMemo(() => imported?.baseColors ?? materials.map(material => material.color.clone()), [materials, imported]);
  useEffect(() => () => geometry?.dispose(), [geometry]);
  useEffect(() => () => fabric?.dispose(), [fabric]);
  useEffect(() => () => materials.forEach(material => {
    if (!product.model) { material.map?.dispose(); material.dispose(); }
  }), [materials, product.model]);
  return { geometry, materials, baseColors, object: imported?.object ?? null, hitWidth,
    hitHeight: imported?.hitHeight ?? 2.65, hitDepth: imported?.hitDepth ?? .4,
    hitCenter: imported?.hitCenter ?? [0, .25, 0] as [number, number, number] };
}

export function GarmentBody({ asset }: { asset: ReturnType<typeof useGarmentModel> }) {
  return asset.object
    ? <primitive object={asset.object} dispose={null} />
    : <mesh geometry={asset.geometry!} material={asset.materials} castShadow receiveShadow raycast={skipRaycast} />;
}
