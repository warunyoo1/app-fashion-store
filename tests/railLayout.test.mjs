import test from "node:test";
import assert from "node:assert/strict";
import { products } from "../src/features/catalog/products.ts";
import { shapes } from "../src/features/showroom/garmentGeometry.ts";
import { GARMENT_GAP, planRail, REST_ANGLE } from "../src/features/showroom/railLayout.ts";

const dimensions = products.map(product => ({ width: product.model.width,
  depth: product.model.depth, scale: shapes[product.kind].scale }));

test("actual garment projections leave a clear gap beside every open item", () => {
  for (const open of [null, ...products.map((_, i) => i)]) {
    const plan = planRail(dimensions, open, false);
    for (let i = 1; i < products.length; i++) {
      const previousEdge = plan.positions[i - 1] + plan.spans[i - 1] / 2;
      const currentEdge = plan.positions[i] - plan.spans[i] / 2;
      assert.ok(currentEdge - previousEdge >= GARMENT_GAP - 1e-9);
    }
    for (const [i, item] of dimensions.entries()) {
      const angle = i === open ? -.06 : REST_ANGLE;
      const projected = (item.width * Math.abs(Math.cos(angle)) + item.depth * Math.abs(Math.sin(angle))) * item.scale;
      assert.ok(projected <= plan.spans[i] + 1e-9);
    }
  }
});

test("a focused garment can rotate through 360 degrees without entering its neighbours' reserved space", () => {
  for (const [open, item] of dimensions.entries()) {
    const plan = planRail(dimensions, open, true), scale = Math.min(item.scale * 1.22, 1.27);
    for (let degree = 0; degree <= 360; degree++) {
      const angle = degree * Math.PI / 180;
      const projected = (item.width * Math.abs(Math.cos(angle)) + item.depth * Math.abs(Math.sin(angle))) * scale;
      assert.ok(projected <= plan.spans[open] + 1e-9);
    }
  }
});
