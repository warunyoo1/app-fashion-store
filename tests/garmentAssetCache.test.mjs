import test from "node:test";
import assert from "node:assert/strict";
import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Texture } from "three";
import { createGarmentAssetCache } from "../src/features/showroom/garmentAssetCache.ts";
import { cloneImportedGarment } from "../src/features/showroom/importedGarment.ts";

const tick = () => new Promise(resolve => setTimeout(resolve, 5));
function fixture() {
  const source = new Group(), geometry = new BoxGeometry(), texture = new Texture();
  const material = new MeshStandardMaterial({ map: texture, color: "#eeddbb" });
  source.add(new Mesh(geometry, material));
  return { source, geometry, texture, material,
    create: () => cloneImportedGarment(source, "#ffffff", ""),
    clean: () => { geometry.dispose(); material.dispose(); texture.dispose(); } };
}

test("canvas cache reuses prepared objects and preserves unfaded base colours", () => {
  const data = fixture(), cache = createGarmentAssetCache();
  let calls = 0;
  const create = () => { calls++; return data.create(); };
  const first = cache.get("tee:0", create), base = first.baseColors[0].getHex();
  first.materials[0].opacity = .2; first.materials[0].color.set("#ff0000");
  const second = cache.get("tee:0", create);
  assert.equal(calls, 1); assert.equal(second, first);
  assert.equal(second.baseColors[0].getHex(), base);
  const other = createGarmentAssetCache(), independent = other.get("tee:0", create);
  assert.notEqual(independent.object, first.object);
  assert.notEqual(independent.materials[0], first.materials[0]);
  assert.equal(independent.materials[0].map, data.texture);
  assert.equal(independent.object.children[0].geometry, data.geometry);
  assert.equal(independent.materials[0].opacity, 1);
  cache.dispose(); other.dispose(); data.clean();
});

test("teardown disposes owned resources once without disposing loader sources", () => {
  const data = fixture(), cache = createGarmentAssetCache();
  const derived = new BoxGeometry();
  const asset = cache.get("tee", () => ({ ...data.create(), ownedGeometries: [derived] }));
  let materials = 0, geometry = 0, source = 0;
  asset.materials[0].addEventListener("dispose", () => materials++);
  derived.addEventListener("dispose", () => geometry++);
  [data.geometry, data.texture, data.material].forEach(resource => resource.addEventListener("dispose", () => source++));
  cache.dispose(); cache.dispose();
  assert.equal(materials, 1); assert.equal(geometry, 1); assert.equal(source, 0);
  assert.throws(() => cache.get("tee", data.create), /disposed/);
  data.clean();
});

test("StrictMode reacquisition cancels disposal; last owner releases the cache", async () => {
  const data = fixture(), cache = createGarmentAssetCache();
  const asset = cache.get("tee", data.create); let disposed = 0;
  asset.materials[0].addEventListener("dispose", () => disposed++);
  const release = cache.retain(); release(); release();
  const finalRelease = cache.retain();
  await tick(); assert.equal(disposed, 0);
  finalRelease(); await tick(); assert.equal(disposed, 1);
  data.clean();
});

test("pending shader preparation holds resources through teardown and reacquisition", async () => {
  const data = fixture(), cache = createGarmentAssetCache();
  const asset = cache.get("tee", data.create); let disposed = 0, complete;
  asset.materials[0].addEventListener("dispose", () => disposed++);
  const pending = new Promise(resolve => { complete = resolve; });
  cache.track(pending);
  const release = cache.retain(); release(); await tick(); assert.equal(disposed, 0);
  const finalRelease = cache.retain(); complete(); await pending; await tick();
  assert.equal(disposed, 0);
  finalRelease(); await tick(); assert.equal(disposed, 1);
  data.clean();
});
