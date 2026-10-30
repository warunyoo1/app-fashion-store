import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const assets = [
  {
    id: "funlab-tee", title: "T Shirt", author: "funlab117", authorUrl: "https://sketchfab.com/funlab117",
    source: "https://sketchfab.com/3d-models/t-shirt-c1a3e5eb9b5445f4b7d4be82f1127eba",
    license: "CC-BY-4.0", role: "Active Relaxed Tee, reduced and fitted by prepare-relaxed-tee.mjs. Uses the separately extracted shared wooden hanger.",
    licenseNote: "Official download panel permits commercial use with author attribution. Source geometry is unmodified here; rail-model-info.json records the simplified display asset.",
  },
  {
    id: "plaggy-pbr-shirt", title: "CC0 - Shirt On Hanger", author: "plaggy",
    authorUrl: "https://sketchfab.com/plaggy",
    source: "https://sketchfab.com/3d-models/cc0-shirt-on-hanger-846d8f285fcb426498033ae67aee2d10",
    license: "CC-BY-4.0", role: "Primary T-shirt candidate with baked PBR fabric detail and a wooden hanger.",
    licenseNote: "Title and description say CC0; the actual Sketchfab download panel says CC Attribution. Retain attribution and follow CC BY 4.0 for this download.",
  },
  {
    id: "dudecon-longsleeve", title: "Hangers and Long Sleeve Shirt", author: "dudecon",
    authorUrl: "https://sketchfab.com/dudecon",
    source: "https://sketchfab.com/3d-models/hangers-and-long-sleeve-shirt-14cc81980a06473a820f811596418fae",
    license: "CC-BY-4.0", role: "Lightweight long-sleeve shirt and five hanger styles. Select the garment and one hanger before rail integration.",
    licenseNote: "Author description mentions public domain; downloaded under the panel's explicit CC Attribution licence. Includes a demonstration web-address texture that should be replaced for RACK.",
  },
  {
    id: "naira-clothes", title: "Clothes", author: "Naira", authorUrl: "https://sketchfab.com/naira001",
    source: "https://sketchfab.com/3d-models/clothes-54646263f96a47be9b3d2befe8d0555e",
    license: "CC-BY-4.0", role: "Four-garment collection: patterned hoodie, green graphic tee, leather jacket and hanging check shirt. Separate garment meshes and adjust hanger placement before using as individual products.",
    licenseNote: "Download panel explicitly permits commercial use with author attribution.",
  },
];

for (const asset of assets) {
  const folder = resolve(root, "assets/garments", asset.id);
  const buffer = await readFile(resolve(folder, "source.glb"));
  if (buffer.readUInt32LE(0) !== 0x46546c67 || buffer.readUInt32LE(4) !== 2 || buffer.readUInt32LE(8) !== buffer.length) throw new Error(`${asset.id}: invalid GLB header`);
  const jsonLength = buffer.readUInt32LE(12);
  if (buffer.readUInt32LE(16) !== 0x4e4f534a) throw new Error(`${asset.id}: JSON chunk missing`);
  const json = JSON.parse(buffer.toString("utf8", 20, 20 + jsonLength));
  const binHeader = 20 + jsonLength;
  if (buffer.readUInt32LE(binHeader + 4) !== 0x004e4942) throw new Error(`${asset.id}: BIN chunk missing`);
  const binLength = buffer.readUInt32LE(binHeader);
  if (json.buffers.some(b => b.uri || b.byteLength > binLength)) throw new Error(`${asset.id}: external or truncated buffer`);
  if ((json.images ?? []).some(image => image.uri || image.bufferView === undefined)) throw new Error(`${asset.id}: image is not embedded`);
  for (const view of json.bufferViews) if ((view.byteOffset ?? 0) + view.byteLength > json.buffers[view.buffer].byteLength) throw new Error(`${asset.id}: out-of-range buffer view`);
  const meshes = json.meshes.map((mesh, index) => ({
    index, name: mesh.name,
    primitives: mesh.primitives.map(p => ({
      triangles: (json.accessors[p.indices ?? p.attributes.POSITION].count / 3),
      vertices: json.accessors[p.attributes.POSITION].count,
      material: json.materials[p.material]?.name,
      normals: p.attributes.NORMAL !== undefined,
      uv: p.attributes.TEXCOORD_0 !== undefined,
    })),
  }));
  Object.assign(asset, {
    file: `${asset.id}/source.glb`, downloadedOn: "2026-10-29", textureVariant: asset.id === "funlab-tee" ? "Official GLB; no embedded texture images" : "1K GLB from the official download panel",
    bytes: buffer.length, sha256: createHash("sha256").update(buffer).digest("hex"),
    triangles: meshes.flatMap(mesh => mesh.primitives).reduce((sum, p) => sum + p.triangles, 0),
    primitives: meshes.reduce((sum, mesh) => sum + mesh.primitives.length, 0),
    materials: json.materials.map(material => material.name), embeddedImages: json.images?.length ?? 0,
    extensionsRequired: json.extensionsRequired ?? [], animations: json.animations?.length ?? 0,
    structuralCheck: "GLB 2 header, embedded buffers/images and buffer-view ranges passed; full Khronos validation not run.",
    nodes: json.nodes.map((node, index) => ({ index, name: node.name, mesh: node.mesh, children: node.children })),
    meshes,
    attribution: `\"${asset.title}\" by ${asset.author} (${asset.source}), licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/).`,
  });
  await writeFile(resolve(folder, "model-info.json"), JSON.stringify(asset, null, 2) + "\n");
  await writeFile(resolve(folder, "CREDITS.txt"), asset.attribution + "\n\n" + asset.licenseNote + "\nOriginal source.glb is unmodified.\n");
  console.log(JSON.stringify({ id: asset.id, triangles: asset.triangles, bytes: asset.bytes, primitives: asset.primitives, embeddedImages: asset.embeddedImages }));
}
const curated = JSON.parse(await readFile(resolve(root, "assets/garments/curated-rail-models.json"), "utf8"));
await writeFile(resolve(root, "assets/garments/catalog.json"), JSON.stringify({
  reviewedOn: "2026-10-29", integration: "Twelve distinct imported garments on a scrollable rail: five existing products and seven curated Style3D/Obridje models; source downloads remain unchanged.",
  assets, curated, fallback: "plaggy-tshirt/plaggy-tshirt.glb",
}, null, 2) + "\n");
