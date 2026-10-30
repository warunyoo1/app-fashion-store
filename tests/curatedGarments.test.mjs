import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { curatedProducts } from "../src/features/catalog/curatedProducts.ts";

function parse(path) {
  const file = readFileSync(new URL(path, import.meta.url)), length = file.readUInt32LE(12);
  assert.equal(file.readUInt32LE(0), 0x46546c67);
  assert.equal(file.readUInt32LE(8), file.length);
  return { file, json: JSON.parse(file.toString("utf8", 20, 20 + length)), binary: file.subarray(28 + length) };
}
function imageHashes({ json, binary }) {
  return (json.images ?? []).map(image => {
    const view = json.bufferViews[image.bufferView];
    return createHash("sha256").update(binary.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength)).digest("hex");
  }).sort();
}
test("seven distinct curated GLBs retain the original PBR images with valid reduced mesh buffers", () => {
  const specs = JSON.parse(readFileSync(new URL("../assets/garments/curated-models.json", import.meta.url), "utf8"));
  assert.equal(curatedProducts.length, 7);
  assert.equal(new Set(curatedProducts.map(product => product.model.file)).size, 7);
  for (const product of curatedProducts) {
    const spec = specs.find(item => item.id === product.id), model = parse("../public" + product.model.file);
    const source = parse(`../assets/garments/${spec.archive}/source.glb`), { json, binary } = model;
    assert.deepEqual(imageHashes(model), imageHashes(source), `${product.name}: source textures are preserved`);
    assert.ok(json.nodes[0].extras.simplificationError <= .003);
    for (const view of json.bufferViews) assert.ok((view.byteOffset ?? 0) + view.byteLength <= binary.length);
    for (const mesh of json.meshes) for (const primitive of mesh.primitives) {
      const position = json.accessors[primitive.attributes.POSITION], normal = json.accessors[primitive.attributes.NORMAL], uv = json.accessors[primitive.attributes.TEXCOORD_0];
      assert.equal(normal.count, position.count); assert.equal(uv.count, position.count);
      const indices = json.accessors[primitive.indices], view = json.bufferViews[indices.bufferView];
      for (let i = 0; i < indices.count; i++) assert.ok(binary.readUInt32LE(view.byteOffset + i * 4) < position.count);
    }
    const image = readFileSync(new URL("../public" + product.model.thumbnails[0], import.meta.url));
    assert.equal(image.readUInt16BE(0), 0xffd8);
    let offset = 2, dimensions;
    while (offset < image.length) {
      assert.equal(image[offset], 0xff);
      const marker = image[offset + 1], length = image.readUInt16BE(offset + 2);
      if ([0xc0, 0xc1, 0xc2].includes(marker)) { dimensions = [image.readUInt16BE(offset + 7), image.readUInt16BE(offset + 5)]; break; }
      offset += length + 2;
    }
    assert.deepEqual(dimensions, [320, 400]);
  }
});
