import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { BoxGeometry, BufferGeometry, Float32BufferAttribute, Group, Mesh, MeshStandardMaterial, Texture, Vector3, Matrix4 } from "three";
import { cloneImportedGarment, fitWoodenHanger, SHARED_HANGER_FILE } from "../src/features/showroom/importedGarment.ts";
import { HOOK_ANCHOR, RAIL_HEIGHT, suspensionY } from "../src/features/showroom/garmentRig.ts";
import { products, modelCredits } from "../src/features/catalog/products.ts";

test("replacement tee ships a reduced real mesh and loads only the shared hanger from the old asset", () => {
  const tee = products[0];
  assert.equal(tee.id, "relaxed-tee");
  const file = readFileSync(new URL("../public" + tee.model.file, import.meta.url));
  const json = JSON.parse(file.toString("utf8", 20, 20 + file.readUInt32LE(12)));
  assert.equal(file.readUInt32LE(8), file.length);
  assert.ok(file.length < 1100000);
  assert.equal(json.meshes.length, 1);
  const triangles = json.accessors[json.meshes[0].primitives[0].indices].count / 3;
  assert.ok(triangles > 10000 && triangles < 35000);
  assert.equal(json.nodes[0].extras.sourceTriangles, 237938);
  assert.ok(json.nodes[0].extras.simplificationError <= .003);
  const position = json.accessors[json.meshes[0].primitives[0].attributes.POSITION];
  assert.ok(Math.abs(position.max[1] - position.min[1] - 2.15) < 1e-5);
  assert.ok(modelCredits.some(credit => credit.author === "funlab117"));
  assert.ok(modelCredits.some(credit => credit.author === "plaggy"));
  assert.equal(SHARED_HANGER_FILE, "/assets/models/shared-hanger/wooden-hanger.glb");
  const hangerFile = readFileSync(new URL("../public" + SHARED_HANGER_FILE, import.meta.url));
  const hanger = JSON.parse(hangerFile.toString("utf8", 20, 20 + hangerFile.readUInt32LE(12)));
  assert.equal(hanger.meshes.length, 1);
  assert.equal(hanger.materials.length, 1);
  assert.equal(hanger.materials[0].name, "Hanger");
  assert.equal(hanger.images.length, 3);
  assert.equal(hanger.accessors[hanger.meshes[0].primitives[0].indices].count / 3, 474);
});

test("fitting wooden shoulders for a hoodie leaves the hook opening at the same rail anchor", () => {
  const source = new BufferGeometry().setAttribute("position", new Float32BufferAttribute([
    0, HOOK_ANCHOR, 0, -.4, 1, 0, .4, 1, 0,
  ], 3));
  const fitted = fitWoodenHanger(source.clone(), { widthScale: 1.5, drop: .55, depth: -.2 });
  try {
    const positions = fitted.getAttribute("position");
    assert.ok(Math.abs(positions.getY(0) - HOOK_ANCHOR) < 1e-6);
    assert.equal(positions.getZ(0), 0);
    assert.ok(Math.abs(positions.getZ(1) + .2) < 1e-6);
    assert.ok(Math.abs(positions.getX(1) + .6) < 1e-6);
    assert.ok(Math.abs(positions.getY(1) - .45) < 1e-6);
    assert.equal(source.getAttribute("position").getY(1), 1);
  } finally { source.dispose(); fitted.dispose(); }
});

test("shared wooden hanger replaces an embedded hanger without changing cached source geometry", () => {
  const source = new Group(), hangerSource = new Group(), geometry = new BoxGeometry(.8, .2, .05);
  const material = new MeshStandardMaterial({ name: "Hanger" });
  const oldHanger = new Mesh(geometry, material); oldHanger.name = "old_hanger";
  const wooden = new Mesh(geometry, material); wooden.name = "ShirtOnHanger_Hanger_0";
  wooden.position.y = 1.1;
  source.add(oldHanger); hangerSource.add(wooden);
  const assembled = cloneImportedGarment(source, "#ffffff", "", {
    hideNodes: ["old_hanger"], hanger: { source: hangerSource, fit: { widthScale: 1.2, drop: .17 } },
  });
  try {
    assert.equal(assembled.object.getObjectByName("old_hanger"), undefined);
    assert.ok(source.getObjectByName("old_hanger"));
    const replacement = assembled.object.getObjectByName("RACK_shared_wooden_hanger");
    assert.ok(replacement);
    assert.notEqual(replacement.geometry, geometry);
    assert.notEqual(replacement.material, material);
    assert.equal(assembled.ownedGeometries.length, 1);
    assert.equal(geometry.getAttribute("position").getY(0), Math.fround(.1));
  } finally {
    assembled.ownedGeometries.forEach(entry => entry.dispose());
    assembled.materials.forEach(entry => entry.dispose());
    geometry.dispose(); material.dispose();
  }
});

test("imported rail and dialog previews share assets but never share fading or colour state", () => {
  const source = new Group(), geometry = new BoxGeometry(), texture = new Texture();
  const shirt = new MeshStandardMaterial({ map: texture, name: "Shirt", transparent: true, depthWrite: false });
  const hanger = new MeshStandardMaterial({ color: "#ffffff", name: "Hanger" });
  source.add(new Mesh(geometry, shirt), new Mesh(geometry, hanger));
  const rail = cloneImportedGarment(source, "#f4f3ee", "Shirt");
  const dialog = cloneImportedGarment(source, "#2b2d2d", "Shirt");
  try {
    rail.materials[0].opacity = .2;
    rail.materials[0].color.set("#ff0000");
    assert.equal(shirt.opacity, 1);
    assert.equal(shirt.depthWrite, false);
    assert.equal(dialog.materials[0].depthWrite, true);
    assert.equal(dialog.materials[0].forceSinglePass, true);
    assert.equal(shirt.forceSinglePass, false);
    assert.ok(dialog.materials[0].alphaTest > 0);
    assert.equal(dialog.materials[0].opacity, 1);
    assert.equal(dialog.materials[0].color.getHexString(), "2b2d2d");
    assert.equal(dialog.materials[1].color.getHexString(), "ffffff");
    assert.equal(rail.object.children[0].geometry, geometry);
    assert.equal(dialog.materials[0].map, texture);
    assert.notEqual(rail.materials[0], dialog.materials[0]);
    let textureDisposed = false;
    texture.addEventListener("dispose", () => { textureDisposed = true; });
    rail.materials.forEach(material => material.dispose());
    assert.equal(textureDisposed, false);
  } finally {
    dialog.materials.forEach(material => material.dispose());
    shirt.dispose(); hanger.dispose(); geometry.dispose(); texture.dispose();
  }
});

test("shipped GLB places its hook on the rail at browse and focused scales", () => {
  const file = readFileSync(new URL("../public/assets/models/studio-tee/studio-tee.glb", import.meta.url));
  assert.equal(file.readUInt32LE(0), 0x46546c67);
  const document = JSON.parse(file.toString("utf8", 20, 20 + file.readUInt32LE(12)));
  const fit = document.nodes.find(node => node.name === "RACK_rail_fit");
  assert.ok(fit);
  const hook = new Vector3().fromArray(fit.extras.sourceHook).applyMatrix4(new Matrix4().fromArray(fit.matrix));
  assert.ok(Math.abs(hook.x) < 1e-8 && Math.abs(hook.z) < 1e-8);
  assert.ok(Math.abs(hook.y - HOOK_ANCHOR) < 1e-8);
  for (const scale of [1, 1.1, 1.22, 1.27])
    assert.ok(Math.abs(suspensionY(scale) + hook.y * scale - RAIL_HEIGHT) < 1e-8);
  assert.equal(document.meshes.length, 2);
  assert.equal(document.images.length, 6);
  assert.ok(document.images.every(image => image.bufferView !== undefined && !image.uri));
});

test("four Clothes exports retain every source triangle and texture, including specular maps", () => {
  const parse = path => {
    const file = readFileSync(new URL(path, import.meta.url));
    assert.equal(file.readUInt32LE(0), 0x46546c67);
    assert.equal(file.readUInt32LE(8), file.length);
    const length = file.readUInt32LE(12);
    return { json: JSON.parse(file.toString("utf8", 20, 20 + length)), binary: file.subarray(28 + length) };
  };
  const source = parse("../assets/garments/naira-clothes/source.glb");
  const hashes = ({ json, binary }) => json.images.map(image => {
    const view = json.bufferViews[image.bufferView];
    return createHash("sha256").update(binary.subarray(view.byteOffset, view.byteOffset + view.byteLength)).digest("hex");
  });
  let triangles = 0;
  const imageHashes = [];
  for (const id of ["cassette-hoodie", "graphic-tee", "leather-jacket", "check-shirt"]) {
    const model = parse(`../public/assets/models/${id}/${id}.glb`), json = model.json;
    assert.deepEqual(json.nodes[0].extras.hookAnchor, [0, HOOK_ANCHOR, 0]);
    imageHashes.push(...hashes(model));
    for (const view of json.bufferViews) assert.ok(view.byteOffset + view.byteLength <= model.binary.length);
    for (const mesh of json.meshes) for (const primitive of mesh.primitives) {
      assert.ok(json.materials[primitive.material]);
      triangles += json.accessors[primitive.indices].count / 3;
    }
    const checkTextures = object => {
      for (const [key, value] of Object.entries(object)) {
        if (!value || typeof value !== "object") continue;
        if (key.endsWith("Texture")) assert.ok(json.textures[value.index], `${id}: ${key} must reference an exported texture`);
        else checkTextures(value);
      }
    };
    json.materials.forEach(checkTextures);
    assert.ok(json.images.every(image => image.bufferView !== undefined && !image.uri));
  }
  assert.equal(triangles, 93087);
  assert.deepEqual(imageHashes.sort(), hashes(source).sort());
});
