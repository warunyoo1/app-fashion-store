import test from "node:test";
import assert from "node:assert/strict";
import {
  createRailHover,
  dampRail,
} from "../src/features/showroom/railMotion.ts";

function clock() {
  let time = 0,
    id = 0;
  const tasks = new Map();
  return {
    scheduler: {
      set(callback, delay) {
        const key = ++id;
        tasks.set(key, { at: time + delay, callback });
        return key;
      },
      clear(key) {
        tasks.delete(key);
      },
    },
    tick(milliseconds) {
      const end = time + milliseconds;
      while (true) {
        const due = [...tasks]
          .filter(([, t]) => t.at <= end)
          .sort((a, b) => a[1].at - b[1].at)[0];
        if (!due) break;
        time = due[1].at;
        tasks.delete(due[0]);
        due[1].callback();
      }
      time = end;
    },
  };
}

test("changing direction continues from the rendered pose instead of jumping to a target", () => {
  const forward = dampRail(0, 3, 1 / 60);
  assert.ok(forward > 0 && forward < 3);
  const reversed = dampRail(forward, -2, 1 / 60);
  assert.ok(reversed < forward && reversed > -2);
  assert.ok(Math.abs(reversed - forward) < 1);
});

test("animation duration is consistent at 30 and 120 frames per second", () => {
  const run = (fps) => {
    let x = 0;
    for (let frame = 0; frame < fps / 2; frame++) x = dampRail(x, 4, 1 / fps);
    return x;
  };
  assert.ok(Math.abs(run(30) - run(120)) < 0.00001);
});

test("motion settles exactly and reduced motion updates immediately", () => {
  let x = 0;
  for (let i = 0; i < 200; i++) x = dampRail(x, 3, 1 / 60);
  assert.equal(x, 3);
  assert.equal(dampRail(0, 3, 1 / 60, true), 3);
});

test("moving across parts of the same garment does not close and reopen the rail", () => {
  const timer = clock(),
    changes = [];
  const hover = createRailHover((i) => changes.push(i), timer.scheduler);
  hover.enter(3);
  timer.tick(70);
  hover.leave(3);
  timer.tick(40);
  hover.enter(3);
  timer.tick(250);
  assert.deepEqual(changes, [3]);
});

test("passing quickly over a neighbouring garment does not select it", () => {
  const timer = clock(),
    changes = [];
  const hover = createRailHover((i) => changes.push(i), timer.scheduler);
  hover.enter(1);
  timer.tick(70);
  hover.leave(1);
  hover.enter(2);
  timer.tick(20);
  hover.leave(2);
  hover.enter(1);
  timer.tick(300);
  assert.deepEqual(changes, [1]);
});

test("moving to another garment changes directly without a collapsed frame in between", () => {
  const timer = clock(),
    changes = [];
  const hover = createRailHover((i) => changes.push(i), timer.scheduler);
  hover.enter(1);
  timer.tick(70);
  hover.leave(1);
  hover.enter(2);
  timer.tick(70);
  assert.deepEqual(changes, [1, 2]);
  hover.leave(2);
  timer.tick(200);
  assert.deepEqual(changes, [1, 2, null]);
});

test("reset and unmount cancel pending hover changes", () => {
  const timer = clock(),
    changes = [];
  const hover = createRailHover((i) => changes.push(i), timer.scheduler);
  hover.enter(1);
  hover.reset();
  timer.tick(200);
  hover.enter(2);
  hover.dispose();
  timer.tick(200);
  assert.deepEqual(changes, []);
});

test("a late exit from the previous mesh cannot close the new garment", () => {
  const timer = clock(),
    changes = [];
  const hover = createRailHover((i) => changes.push(i), timer.scheduler);
  hover.enter(1);
  timer.tick(70);
  hover.enter(2);
  hover.leave(1);
  timer.tick(250);
  assert.deepEqual(changes, [1, 2]);
  hover.leave(1);
  timer.tick(250);
  assert.deepEqual(changes, [1, 2]);
});

test("exiting while crossing a pending neighbour eventually closes the rail", () => {
  const timer = clock(),
    changes = [];
  const hover = createRailHover((i) => changes.push(i), timer.scheduler);
  hover.enter(1);
  timer.tick(70);
  hover.leave(1);
  hover.enter(2);
  timer.tick(20);
  hover.leave(2);
  timer.tick(250);
  assert.deepEqual(changes, [1, null]);
});
