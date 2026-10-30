import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { Box3, MeshStandardMaterial, Vector3, DoubleSide } from "three";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { mergeGroups, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

// Three's browser-oriented exporter uses FileReader even when exporting only geometry.
class BlobReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer;
      this.onloadend?.({ target: this });
    }).catch((error) => this.onerror?.(error));
  }
}
globalThis.FileReader ??= BlobReader;

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const assetRoot = resolve(root, "assets/garments/plaggy-tshirt");
const sourceRoot = resolve(assetRoot, "source/T-Shirt and Hanger");
const outputPath = resolve(assetRoot, "plaggy-tshirt.glb");
const source = await readFile(resolve(sourceRoot, "T-ShirtandHanger.obj"), "utf8");
const atlas = await readFile(resolve(sourceRoot, "MB_T-ShirtHangerTexture1.jpg"));
const model = new OBJLoader().parse(source);
const sourceBounds = new Box3().setFromObject(model);
const sourceSize = sourceBounds.getSize(new Vector3());
const sourceCenter = sourceBounds.getCenter(new Vector3());
const scale = 1 / sourceSize.y;
let triangles = 0;
let vertices = 0;
let groups = 0;

model.name = "Plaggy_TShirt_With_Hanger";
model.userData = {
  title: "T-Shirt and Hanger",
  author: "plaggy",
  source: "https://opengameart.org/content/t-shirt-and-hanger",
  license: "CC0-1.0",
  adaptation: "OBJ converted to GLB; original UV atlas retained; normalized to 1m overall height; origin at hook-top height, horizontally centred.",
};

model.traverse((mesh) => {
  if (!mesh.isMesh) return;
  const geometry = mesh.geometry;
  geometry.translate(-sourceCenter.x, -sourceBounds.max.y, -sourceCenter.z);
  geometry.scale(scale, scale, scale);
  geometry.clearGroups();
  const uv = geometry.getAttribute("uv");
  let start = 0;
  let previousBand = -1;
  // The supplied atlas has cloth at the top, wood in the middle, metal below.
  // OBJ V coordinates start at the bottom of the original image.
  for (let index = 0; index < uv.count; index += 3) {
    const v = (uv.getY(index) + uv.getY(index + 1) + uv.getY(index + 2)) / 3;
    const band = v > 0.581 ? 0 : v > 0.365 ? 1 : 2;
    if (band !== previousBand) {
      if (previousBand !== -1) geometry.addGroup(start, index - start, previousBand);
      start = index;
      previousBand = band;
    }
  }
  geometry.addGroup(start, uv.count - start, previousBand);
  // glTF embeds the original image without Three's TextureLoader flipY step.
  for (let index = 0; index < uv.count; index++) uv.setY(index, 1 - uv.getY(index));
  mesh.geometry = mergeVertices(geometry, 1e-5);
  mergeGroups(mesh.geometry);
  geometry.dispose();
  mesh.material = [
    new MeshStandardMaterial({ name: "Cotton", roughness: 0.92, metalness: 0, side: DoubleSide }),
    new MeshStandardMaterial({ name: "Wooden_Hanger", roughness: 0.64, metalness: 0 }),
    new MeshStandardMaterial({ name: "Metal_Hook", roughness: 0.32, metalness: 0.72 }),
  ];
  triangles += mesh.geometry.index.count / 3;
  vertices += mesh.geometry.attributes.position.count;
  groups += mesh.geometry.groups.length;
});

const exported = Buffer.from(await new GLTFExporter().parseAsync(model, { binary: true }));
const jsonLength = exported.readUInt32LE(12);
const json = JSON.parse(exported.toString("utf8", 20, 20 + jsonLength));
const binHeader = 20 + jsonLength;
const binLength = exported.readUInt32LE(binHeader);
const originalBin = exported.subarray(binHeader + 8, binHeader + 8 + binLength);
const imageOffset = Math.ceil(originalBin.length / 4) * 4;
const payload = Buffer.alloc(imageOffset + atlas.length);
originalBin.copy(payload);
atlas.copy(payload, imageOffset);

const imageBufferView = json.bufferViews.length;
json.bufferViews.push({ buffer: 0, byteOffset: imageOffset, byteLength: atlas.length });
json.images = [{ name: "Original_plaggy_UV_atlas", mimeType: "image/jpeg", bufferView: imageBufferView }];
json.samplers = [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }];
json.textures = [{ sampler: 0, source: 0 }];
for (const material of json.materials) material.pbrMetallicRoughness.baseColorTexture = { index: 0 };
json.buffers[0].byteLength = payload.length;
json.asset.copyright = "T-Shirt and Hanger by plaggy, CC0-1.0. Source: https://opengameart.org/content/t-shirt-and-hanger";

const encoded = Buffer.from(JSON.stringify(json));
const paddedJson = Buffer.alloc(Math.ceil(encoded.length / 4) * 4, 0x20);
encoded.copy(paddedJson);
const paddedBin = Buffer.alloc(Math.ceil(payload.length / 4) * 4);
payload.copy(paddedBin);
const output = Buffer.alloc(12 + 8 + paddedJson.length + 8 + paddedBin.length);
output.writeUInt32LE(0x46546c67, 0);
output.writeUInt32LE(2, 4);
output.writeUInt32LE(output.length, 8);
output.writeUInt32LE(paddedJson.length, 12);
output.writeUInt32LE(0x4e4f534a, 16);
paddedJson.copy(output, 20);
const binStart = 20 + paddedJson.length;
output.writeUInt32LE(paddedBin.length, binStart);
output.writeUInt32LE(0x004e4942, binStart + 4);
paddedBin.copy(output, binStart + 8);
await mkdir(assetRoot, { recursive: true });
await writeFile(outputPath, output);

const bounds = new Box3().setFromObject(model);
const report = {
  asset: "plaggy-tshirt",
  file: "plaggy-tshirt.glb",
  author: "plaggy",
  source: model.userData.source,
  license: "CC0-1.0",
  preparedOn: "2026-10-29",
  sha256: createHash("sha256").update(output).digest("hex"),
  bytes: output.length,
  triangles,
  vertices,
  primitives: groups,
  materials: json.materials.length,
  embeddedImages: 1,
  decodersRequired: [],
  bounds: { min: bounds.min.toArray(), max: bounds.max.toArray(), size: bounds.getSize(new Vector3()).toArray() },
  placement: "Y up; 1m total height; hook top at Y=0; garment and hanger extend below origin; hook contact point must be fitted to the rail.",
  animation: "Static geometry. No cloth simulation or rig.",
};
await writeFile(resolve(assetRoot, "model-info.json"), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
