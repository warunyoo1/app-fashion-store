import test from "node:test";
import assert from "node:assert/strict";
import {
  RAIL_HEIGHT,
  HOOK_ANCHOR,
  suspensionY,
  hangerShoulder,
} from "../src/features/showroom/garmentRig.ts";
import {
  shapes,
  createGarment,
} from "../src/features/showroom/garmentGeometry.ts";

test("hook opening stays on the rail while a garment enlarges", () => {
  for (const scale of [1, 1.02, 1.1, 1.22, 1.27])
    assert.ok(
      Math.abs(suspensionY(scale) + HOOK_ANCHOR * scale - RAIL_HEIGHT) < 1e-9,
    );
});
test("hanger shoulders remain inside every garment silhouette", () => {
  for (const [kind, shape] of Object.entries(shapes)) {
    const tip = hangerShoulder(kind);
    assert.ok(
      tip.x + 0.012 < shape.halfWidth(tip.y),
      kind + " hanger protrudes beyond its garment shoulder",
    );
    assert.ok(
      tip.y < 1,
      kind + " shoulder support must sit below the garment shoulder",
    );
  }
});
test("front and back geometry groups cover all triangles without overlap", () => {
  for (const kind of Object.keys(shapes)) {
    const geometry = createGarment(kind);
    try {
      let offset = 0;
      for (const group of geometry.groups) {
        assert.equal(group.start, offset);
        offset += group.count;
      }
      assert.equal(offset, geometry.getIndex().count);
    } finally {
      geometry.dispose();
    }
  }
});
