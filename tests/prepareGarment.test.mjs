import test from "node:test";
import assert from "node:assert/strict";
import { BoxGeometry, Group, Mesh, MeshStandardMaterial, PerspectiveCamera, Scene, Texture } from "three";
import { isGarmentPrepared, prepareGarment, retainGarmentPreparation } from "../src/features/showroom/prepareGarment.ts";

const flush = () => new Promise(resolve => setImmediate(resolve));
function fixture() {
  const object = new Group(), geometry = new BoxGeometry(), texture = new Texture();
  const material = new MeshStandardMaterial({ map: texture, normalMap: texture });
  object.add(new Mesh(geometry, material), new Mesh(geometry, material));
  const jobs = [], uploads = [], compiles = [];
  let ready = true;
  const properties = new Map(), context = {
    getExtension: () => ({ COMPLETION_STATUS_KHR: 0x91b1 }),
    isContextLost: () => false, getProgramParameter: () => ready,
  };
  const renderer = { initTexture: map => uploads.push(map),
    properties: { get: entry => properties.get(entry) }, getContext: () => context,
    compile: mesh => { compiles.push(mesh); properties.set(material, { currentProgram: { program: {} } }); return new Set([material]); } };
  return { asset: { object, materials: [material] }, renderer, scene: new Scene(), camera: new PerspectiveCamera(),
    setReady: value => { ready = value; },
    jobs, uploads, compiles, schedule: callback => jobs.push(callback),
    frame: async () => { jobs.shift()?.(0); await flush(); },
    clean: () => { geometry.dispose(); texture.dispose(); material.dispose(); } };
}
test("preparation is deduplicated and uploads one shared map once across objects", async () => {
  const f = fixture(), { renderer, scene, camera, asset, schedule } = f;
  const pending = prepareGarment(renderer, scene, camera, asset, schedule);
  assert.equal(prepareGarment(renderer, scene, camera, asset, schedule), pending);
  assert.equal(isGarmentPrepared(renderer, asset.object), false);
  await f.frame(); assert.equal(f.uploads.length, 1); assert.equal(f.compiles.length, 0);
  while (f.jobs.length) await f.frame();
  await pending; assert.equal(isGarmentPrepared(renderer, asset.object), true);
  assert.equal(f.compiles.length, 2);
  const second = { ...asset, object: asset.object.clone() };
  const next = prepareGarment(renderer, scene, camera, second, schedule);
  while (f.jobs.length) await f.frame();
  await next; assert.equal(f.uploads.length, 1);
  assert.equal(isGarmentPrepared(renderer, null), true);
  f.clean();
});
test("models stay hidden until asynchronous shader compilation completes", async () => {
  const f = fixture(); f.setReady(false);
  const pending = prepareGarment(f.renderer, f.scene, f.camera, f.asset, f.schedule);
  await f.frame(); await f.frame();
  assert.equal(isGarmentPrepared(f.renderer, f.asset.object), false);
  f.setReady(true);
  while (f.jobs.length) await f.frame();
  await pending; assert.equal(isGarmentPrepared(f.renderer, f.asset.object), true);
  f.clean();
});
test("failed shader preparation is retryable and never marks an object ready", async () => {
  const f = fixture();
  const compile = f.renderer.compile;
  f.renderer.compile = () => { throw new Error("shader unavailable"); };
  const pending = prepareGarment(f.renderer, f.scene, f.camera, f.asset, f.schedule);
  const rejected = assert.rejects(pending, /shader unavailable/);
  while (f.jobs.length) await f.frame();
  await rejected; assert.equal(isGarmentPrepared(f.renderer, f.asset.object), false);
  f.renderer.compile = compile;
  const retry = prepareGarment(f.renderer, f.scene, f.camera, f.asset, f.schedule);
  while (f.jobs.length) await f.frame();
  await retry; assert.equal(isGarmentPrepared(f.renderer, f.asset.object), true);
  f.clean();
});

test("closing a canvas cancels queued work and shader polls before renderer teardown", async () => {
  const f = fixture(); f.setReady(false);
  const release = retainGarmentPreparation(f.renderer);
  const pending = prepareGarment(f.renderer, f.scene, f.camera, f.asset, f.schedule);
  const cancelled = assert.rejects(pending, { name: "AbortError" });
  await f.frame(); await f.frame(); release(); release();
  // Any later access would be invalid after the renderer's properties are cleared.
  f.renderer.properties.get = () => { throw new Error("disposed renderer accessed"); };
  while (f.jobs.length) await f.frame();
  await cancelled; assert.equal(isGarmentPrepared(f.renderer, f.asset.object), false);
  f.clean();
});
