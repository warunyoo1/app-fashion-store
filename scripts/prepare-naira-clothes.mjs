import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Box3, Matrix4, Vector3 } from 'three';

// Split the downloaded collection without resculpting or replacing its textures.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const file = await readFile(resolve(root, 'assets/garments/naira-clothes/source.glb'));
const length = file.readUInt32LE(12);
const source = JSON.parse(file.toString('utf8', 20, 20 + length));
const binary = file.subarray(28 + length);
const world = new Matrix4().fromArray(source.nodes[0].matrix);
const dimensions = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
const bytes = { 5121: 1, 5123: 2, 5125: 4, 5126: 4 };
const read = { 5121: 'readUInt8', 5123: 'readUInt16LE', 5125: 'readUInt32LE', 5126: 'readFloatLE' };
function values(index) {
  const a = source.accessors[index], v = source.bufferViews[a.bufferView];
  const components = dimensions[a.type], width = bytes[a.componentType];
  return Array.from({ length: a.count }, (_, i) => Array.from({ length: components }, (_, j) =>
    binary[read[a.componentType]]((v.byteOffset ?? 0) + (a.byteOffset ?? 0) + i * (v.byteStride ?? components * width) + j * width)));
}
const cache = new Map();
function accessor(index) {
  if (!cache.has(index)) cache.set(index, values(index));
  return cache.get(index);
}
const primitive = index => source.meshes[index].primitives[0];
const specs = [
  { id: 'cassette-hoodie', meshes: [4, 5, 6], hardware: x => x < -125, height: 2.5, top: 1.36, center: -172.5, depth: 0, hasHanger: false },
  { id: 'graphic-tee', meshes: [0], height: 2, top: .98, center: -86.6, depth: 0, hasHanger: false },
  { id: 'leather-jacket', meshes: [1, 2, 3, 8], hardware: (x, y) => x >= -125 && !(x > 60 && y > 170), height: 2, top: 1, center: -.35, depth: 0, hasHanger: false },
  { id: 'check-shirt', meshes: [9, 10, 11], hardware: (x, y) => x > 60 && y > 170, height: 2, hasHanger: true },
];
const outputInfo = [];
for (const spec of specs) {
  const selections = spec.meshes.map(index => ({ index, triangles: null }));
  if (spec.hardware) {
    const p = primitive(7), positions = accessor(p.attributes.POSITION), indices = accessor(p.indices).flat();
    const triangles = [];
    for (let i = 0; i < indices.length; i += 3) {
      const x = (positions[indices[i]][0] + positions[indices[i + 1]][0] + positions[indices[i + 2]][0]) / 3;
      const y = (positions[indices[i]][2] + positions[indices[i + 1]][2] + positions[indices[i + 2]][2]) / 3;
      if (spec.hardware(x, y)) triangles.push(...indices.slice(i, i + 3));
    }
    selections.push({ index: 7, triangles });
  }
  const clothBounds = new Box3();
  for (const index of spec.meshes.filter(i => ![1, 8, 11].includes(i))) {
    const a = source.accessors[primitive(index).attributes.POSITION];
    clothBounds.union(new Box3(new Vector3().fromArray(a.min), new Vector3().fromArray(a.max)).applyMatrix4(world));
  }
  const scale = spec.height / clothBounds.getSize(new Vector3()).y;
  let fit;
  if (spec.hasHanger) {
    // Opening of the source hook, retained together with the wooden hanger.
    const hook = new Vector3(78.3, 176.5, -5.4285);
    fit = new Matrix4().makeTranslation(0, 1.47, 0).multiply(new Matrix4().makeScale(scale, scale, scale))
      .multiply(new Matrix4().makeTranslation(-hook.x, -hook.y, -hook.z));
  } else {
    fit = new Matrix4().makeTranslation(-spec.center * scale, spec.top - clothBounds.max.y * scale, -spec.depth * scale)
      .multiply(new Matrix4().makeScale(scale, scale, scale));
  }
  const document = { asset: { version: '2.0', generator: 'RACK lossless garment splitter', copyright: 'Clothes by Naira, CC BY 4.0' },
    scene: 0, scenes: [{ nodes: [0] }], nodes: [], meshes: [], accessors: [], bufferViews: [], buffers: [],
    materials: [], textures: [], images: [], samplers: source.samplers,
    extensionsUsed: source.extensionsUsed };
  const chunks = []; let offset = 0;
  function append(data, target) {
    const padding = (4 - offset % 4) % 4;
    if (padding) { chunks.push(Buffer.alloc(padding)); offset += padding; }
    const index = document.bufferViews.length;
    document.bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: data.length, ...(target ? { target } : {}) });
    chunks.push(data); offset += data.length; return index;
  }
  const materials = new Map(), textures = new Map(), images = new Map();
  function image(index) {
    if (!images.has(index)) {
      const original = source.images[index], v = source.bufferViews[original.bufferView];
      const bufferView = append(binary.subarray(v.byteOffset ?? 0, (v.byteOffset ?? 0) + v.byteLength));
      images.set(index, document.images.length);
      document.images.push({ ...original, bufferView });
    }
    return images.get(index);
  }
  function texture(index) {
    if (!textures.has(index)) {
      textures.set(index, document.textures.length);
      document.textures.push({ ...source.textures[index], source: image(source.textures[index].source) });
    }
    return textures.get(index);
  }
  function material(index) {
    if (!materials.has(index)) {
      const copy = structuredClone(source.materials[index]);
      function remapTextures(object) {
        for (const [key, value] of Object.entries(object)) {
          if (!value || typeof value !== 'object') continue;
          if (key.endsWith('Texture') && typeof value.index === 'number') value.index = texture(value.index);
          else remapTextures(value);
        }
      }
      remapTextures(copy);
      materials.set(index, document.materials.length); document.materials.push(copy);
    }
    return materials.get(index);
  }
  function packed(rows, original, target) {
    const width = bytes[original.componentType], size = dimensions[original.type];
    const data = Buffer.alloc(rows.length * size * width);
    const write = { 5121: 'writeUInt8', 5123: 'writeUInt16LE', 5125: 'writeUInt32LE', 5126: 'writeFloatLE' };
    rows.forEach((row, i) => row.forEach((value, j) => data[write[original.componentType]](value, (i * size + j) * width)));
    const entry = { bufferView: append(data, target), componentType: original.componentType, count: rows.length, type: original.type };
    if (original.normalized) entry.normalized = true;
    if (original.min) {
      entry.min = Array.from({ length: size }, (_, j) => Math.min(...rows.map(row => row[j])));
      entry.max = Array.from({ length: size }, (_, j) => Math.max(...rows.map(row => row[j])));
    }
    document.accessors.push(entry); return document.accessors.length - 1;
  }
  let triangles = 0;
  for (const selection of selections) {
    const p = primitive(selection.index), indices = selection.triangles ?? accessor(p.indices).flat();
    const vertices = [...new Set(indices)], remap = new Map(vertices.map((v, i) => [v, i]));
    const attributes = {};
    for (const [name, index] of Object.entries(p.attributes))
      attributes[name] = packed(vertices.map(v => accessor(index)[v]), source.accessors[index], 34962);
    const indexAccessor = packed(indices.map(v => [remap.get(v)]), { type: 'SCALAR', componentType: vertices.length > 65535 ? 5125 : 5123 }, 34963);
    const mesh = document.meshes.length;
    document.meshes.push({ name: source.meshes[selection.index].name, primitives: [{ attributes, indices: indexAccessor, material: material(p.material) }] });
    document.nodes.push({ name: `source_mesh_${selection.index}`, mesh });
    triangles += indices.length / 3;
  }
  const children = document.nodes.map((_, i) => i + 2);
  document.nodes.unshift({ name: 'RACK_rail_fit', matrix: fit.toArray(), children: [1], extras: { hookAnchor: [0, 1.47, 0], sourceCollection: 'Clothes by Naira', hasHanger: spec.hasHanger } },
    { name: 'source_coordinate_system', matrix: world.toArray(), children });
  const bounds = clothBounds.clone().applyMatrix4(fit);
  const size = bounds.getSize(new Vector3());
  const info = { id: spec.id, hasHanger: spec.hasHanger, width: size.x, height: size.y, bounds: { min: bounds.min.toArray(), max: bounds.max.toArray() }, triangles, sourceMeshes: selections.map(s => s.index) };
  document.nodes[0].extras.fit = info;
  const padding = (4 - offset % 4) % 4;
  if (padding) { chunks.push(Buffer.alloc(padding)); offset += padding; }
  document.buffers = [{ byteLength: offset }];
  const bin = Buffer.concat(chunks), encoded = Buffer.from(JSON.stringify(document));
  const json = Buffer.alloc(Math.ceil(encoded.length / 4) * 4, 0x20); encoded.copy(json);
  const result = Buffer.alloc(28 + json.length + bin.length);
  result.writeUInt32LE(0x46546c67, 0); result.writeUInt32LE(2, 4); result.writeUInt32LE(result.length, 8);
  result.writeUInt32LE(json.length, 12); result.writeUInt32LE(0x4e4f534a, 16); json.copy(result, 20);
  result.writeUInt32LE(bin.length, 20 + json.length); result.writeUInt32LE(0x004e4942, 24 + json.length); bin.copy(result, 28 + json.length);
  const destination = resolve(root, `public/assets/models/${spec.id}`);
  await mkdir(destination, { recursive: true });
  await writeFile(resolve(destination, `${spec.id}.glb`), result);
  await writeFile(resolve(destination, 'CREDITS.txt'), 'Clothes by Naira\nhttps://sketchfab.com/3d-models/clothes-54646263f96a47be9b3d2befe8d0555e\nCC BY 4.0: https://creativecommons.org/licenses/by/4.0/\nAdapted for RACK: extracted garment and relevant hardware, removed unused data, uniformly scaled and repositioned for the rail. Original sculpted geometry, UVs and PBR textures retained. Original source.glb is archived in assets/garments/naira-clothes. Separate procedural hangers support garments without their own hanger. Prices and product names are illustrative.\n');
  outputInfo.push({ ...info, bytes: result.length, images: document.images.length });
}
await writeFile(resolve(root, 'assets/garments/naira-clothes/rail-models.json'), JSON.stringify(outputInfo, null, 2) + '\n');
console.log(JSON.stringify(outputInfo, null, 2));
