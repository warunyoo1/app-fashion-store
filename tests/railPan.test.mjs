import test from "node:test";
import assert from "node:assert/strict";
import { products } from "../src/features/catalog/products.ts";
import { shapes } from "../src/features/showroom/garmentGeometry.ts";
import { planRail } from "../src/features/showroom/railLayout.ts";
import { clampRailPan, nearestRailItem, visibleRailItems } from "../src/features/showroom/railPan.ts";

const resting = planRail(products.map(product => ({ width: product.model.width, depth: product.model.depth, scale: shapes[product.kind].scale })), null, false);
test("long-rack navigation reaches every garment and stops at both ends", () => {
  assert.equal(products.length, 12);
  assert.equal(clampRailPan(-1000, resting.positions), resting.positions[0]);
  assert.equal(clampRailPan(1000, resting.positions), resting.positions.at(-1));
  resting.positions.forEach((position, i) => assert.equal(nearestRailItem(position, resting.positions), i));
});
test("the rack mounts the visible neighbourhood instead of all twelve GLBs", () => {
  for (const [index, center] of resting.positions.entries()) {
    const visible = visibleRailItems(resting.positions, center, 5.7);
    assert.ok(visible.includes(index));
    assert.ok(visible.length < products.length);
    assert.ok(visible.every(i => i >= 0 && i < products.length));
  }
  assert.ok(visibleRailItems(resting.positions, resting.positions.at(-1), 5.7).includes(11));
});
test("hover spacing does not move the browsed item's scroll anchor", () => {
  const dimensions = products.map(product => ({ width: product.model.width, depth: product.model.depth, scale: shapes[product.kind].scale }));
  for (let i = 0; i < products.length; i++) {
    const open = planRail(dimensions, i, false);
    assert.ok(Math.abs(open.positions[i] - resting.positions[i]) < 1e-8);
  }
});
