import test from "node:test";
import assert from "node:assert/strict";
import { createPhotoGarment } from "../src/features/showroom/photoGeometry.ts";

function shirtMask() {
  const width = 100,
    height = 140,
    data = new Uint8ClampedArray(width * height * 4);
  for (let y = 20; y <= 120; y++) {
    const half = y < 35 ? 20 : y < 60 ? 33 : 27;
    for (let x = 50 - half; x <= 50 + half; x++) {
      if (y < 28 && x > 46 && x < 54) continue;
      const i = (y * width + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = 150;
      data[i + 3] = 255;
    }
  }
  return { width, height, data };
}
test("photographic garments have separate front, back and sewn side surfaces", () => {
  const mask = shirtMask(),
    geometry = createPhotoGarment(mask, mask);
  try {
    assert.deepEqual(
      geometry.groups.map((g) => g.materialIndex),
      [0, 1, 2],
    );
    const position = geometry.getAttribute("position"),
      normal = geometry.getAttribute("normal"),
      half = position.count / 2;
    assert.ok(normal.getZ(28) > 0.5);
    assert.ok(normal.getZ(half + 28) < -0.5);
    geometry.computeBoundingBox();
    assert.ok(
      geometry.boundingBox.max.z - geometry.boundingBox.min.z > 0.15,
      "cloth must have actual volume rather than two flat photo planes",
    );
    for (const index of geometry.getIndex().array)
      assert.ok(index < position.count);
    for (const coordinate of position.array)
      assert.ok(Number.isFinite(coordinate));
  } finally {
    geometry.dispose();
  }
});
test("rear artwork reads correctly after a half turn", () => {
  const mask = shirtMask(),
    geometry = createPhotoGarment(mask, mask);
  try {
    const position = geometry.getAttribute("position"),
      uv = geometry.getAttribute("uv"),
      half = position.count / 2;
    assert.equal(position.getX(0), position.getX(half));
    assert.ok(uv.getX(0) < uv.getX(half));
  } finally {
    geometry.dispose();
  }
});
