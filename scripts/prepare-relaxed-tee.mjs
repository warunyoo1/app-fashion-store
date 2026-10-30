import { writeFile } from 'node:fs/promises';
import { MeshoptSimplifier } from 'meshoptimizer';
import { readGlb, writeGarmentGlb } from './garment-glb.mjs';

const source = await readGlb('assets/garments/funlab-tee/source.glb');
await MeshoptSimplifier.ready; MeshoptSimplifier.useExperimentalFeatures = true;
const positions = [], normals = [], uvs = [], indices = [];
let sourceTriangles = 0, worstError = 0;
for (const mesh of source.json.meshes) for (const primitive of mesh.primitives) {
  const p = source.accessor(primitive.attributes.POSITION), n = source.accessor(primitive.attributes.NORMAL), uv = source.accessor(primitive.attributes.TEXCOORD_0), index = source.accessor(primitive.indices);
  const attributes = new Float32Array(p.length / 3 * 5);
  for (let i = 0; i < p.length / 3; i++) attributes.set([n[i * 3], n[i * 3 + 1], n[i * 3 + 2], uv[i * 2], uv[i * 2 + 1]], i * 5);
  const [simplified, error] = MeshoptSimplifier.simplifyWithAttributes(index, p, 3, attributes, 5, [.5, .5, .5, .01, .01], null,
    Math.max(3, Math.floor(index.length * .12 / 3) * 3), .003, ['LockBorder']);
  sourceTriangles += index.length / 3; worstError = Math.max(worstError, error);
  const vertices = [...new Set(simplified)], start = positions.length / 3, remap = new Map(vertices.map((value, i) => [value, start + i]));
  for (const vertex of vertices) { positions.push(...p.subarray(vertex * 3, vertex * 3 + 3)); normals.push(...n.subarray(vertex * 3, vertex * 3 + 3)); uvs.push(...uv.subarray(vertex * 2, vertex * 2 + 2)); }
  for (const value of simplified) indices.push(remap.get(value));
}
// The source garment is Y-up; remove Sketchfab's presentation-only camera pose.
let minY = Infinity, maxY = -Infinity, minX = Infinity, maxX = -Infinity;
for (let i = 0; i < positions.length; i += 3) { minX = Math.min(minX, positions[i]); maxX = Math.max(maxX, positions[i]); minY = Math.min(minY, positions[i + 1]); maxY = Math.max(maxY, positions[i + 1]); }
const scale = 2.15 / (maxY - minY), centerX = (minX + maxX) / 2;
for (let i = 0; i < positions.length; i += 3) { positions[i] = (positions[i] - centerX) * scale; positions[i + 1] = (positions[i + 1] - maxY) * scale + 1.1; positions[i + 2] *= scale; }
const info = await writeGarmentGlb('public/assets/models/relaxed-tee/relaxed-tee.glb', {
  name: 'RACK_Relaxed_Tee', positions: new Float32Array(positions), normals: new Float32Array(normals), uvs: new Float32Array(uvs), indices: new Uint32Array(indices),
  material: { name: 'RelaxedCotton', doubleSided: true, pbrMetallicRoughness: { metallicFactor: 0, roughnessFactor: .92 },
    extensions: { KHR_materials_sheen: { sheenColorFactor: [.18, .18, .18], sheenRoughnessFactor: .9 } } },
  copyright: 'T Shirt by funlab117, CC BY 4.0. https://sketchfab.com/3d-models/t-shirt-c1a3e5eb9b5445f4b7d4be82f1127eba',
  extras: { sourceTriangles, simplificationError: worstError, garmentHeight: 2.15, hookAnchor: [0, 1.47, 0], modifications: 'Simplified with locked borders and normal/UV weighting; merged matching cotton surfaces; removed presentation rotation; fitted uniformly to rail. Original sculpted folds retained.' },
});
await writeFile('assets/garments/funlab-tee/rail-model-info.json', JSON.stringify({ ...info, sourceTriangles, worstError, scale }, null, 2) + '\n');
await writeFile('public/assets/models/relaxed-tee/CREDITS.txt', 'T Shirt by funlab117\nhttps://sketchfab.com/3d-models/t-shirt-c1a3e5eb9b5445f4b7d4be82f1127eba\nCC BY 4.0: https://creativecommons.org/licenses/by/4.0/\nAdapted for RACK: simplified mesh with locked boundaries, merged matching surfaces, removed presentation rotation, uniformly scaled and repositioned. Original sculpted folds retained. Cotton roughness/sheen and Chalk/Ink demonstration tints added. The shared wooden hanger is by plaggy (separate credit). Product names, sizes and prices are illustrative.\n');
console.log(JSON.stringify({ ...info, sourceTriangles, worstError }, null, 2));
