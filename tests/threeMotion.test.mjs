import test from 'node:test';
import assert from 'node:assert/strict';
import { Group } from 'three';
import { gsap } from 'gsap';
import { createObjectEntrance } from '../src/shared/motion/threeMotion.ts';

test('entrances animate a presentation parent without changing the garment pose', () => {
  const parent = new Group(), garment = new Group();
  garment.position.set(1.2, 2.1, -.4);
  garment.rotation.set(.1, .7, -.04);
  parent.add(garment);
  const pose = garment.matrix.clone();
  garment.updateMatrix();
  pose.copy(garment.matrix);
  let renders = 0;
  const timeline = createObjectEntrance(parent, 'product', () => renders++);
  timeline.progress(.5);
  assert.notEqual(parent.position.x, 0);
  timeline.progress(1);
  assert.equal(parent.position.x, 0);
  assert.equal(parent.rotation.y, 0);
  assert.equal(parent.scale.x, 1);
  assert.ok(renders > 0);
  garment.updateMatrix();
  assert.deepEqual(garment.matrix.elements, pose.elements);
  timeline.revert();
});

test('React-style cleanup reverts unfinished motion and removes its active tweens', () => {
  const parent = new Group();
  let timeline;
  const context = gsap.context(() => { timeline = createObjectEntrance(parent, 'collection', () => {}); });
  timeline.progress(.35);
  assert.notEqual(parent.position.y, 0);
  context.revert();
  assert.equal(parent.position.y, 0);
  assert.equal(parent.rotation.y, 0);
  assert.equal(parent.scale.x, 1);
  assert.equal(gsap.getTweensOf(parent.position).length, 0);
  assert.equal(gsap.getTweensOf(parent.rotation).length, 0);
  assert.equal(gsap.getTweensOf(parent.scale).length, 0);
});

test.after(() => gsap.ticker.sleep());
