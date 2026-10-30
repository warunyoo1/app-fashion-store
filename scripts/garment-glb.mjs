import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

export async function readGlb(path) {
  const file = await readFile(path), length = file.readUInt32LE(12);
  const json = JSON.parse(file.toString('utf8', 20, 20 + length)), binary = file.subarray(28 + length);
  function accessor(index) {
    const a = json.accessors[index], v = json.bufferViews[a.bufferView], size = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type];
    const width = { 5121: 1, 5123: 2, 5125: 4, 5126: 4 }[a.componentType];
    const method = { 5121: 'readUInt8', 5123: 'readUInt16LE', 5125: 'readUInt32LE', 5126: 'readFloatLE' }[a.componentType];
    const output = new (a.componentType === 5126 ? Float32Array : Uint32Array)(a.count * size);
    for (let i = 0; i < a.count; i++) for (let k = 0; k < size; k++)
      output[i * size + k] = binary[method]((v.byteOffset ?? 0) + (a.byteOffset ?? 0) + i * (v.byteStride ?? size * width) + k * width);
    return output;
  }
  return { file, json, binary, accessor };
}

export async function writeGarmentGlb(path, { name, positions, normals, uvs, indices, material, images = [], extras = {}, copyright }) {
  const json = { asset: { version: '2.0', generator: 'RACK garment preparation', copyright }, scene: 0,
    scenes: [{ nodes: [0] }], nodes: [{ mesh: 0, name, extras }], meshes: [{ primitives: [{ attributes: {}, material: 0 }] }],
    materials: [material], accessors: [], bufferViews: [], buffers: [] };
  const chunks = []; let offset = 0;
  const append = (data, target) => {
    const padding = (4 - offset % 4) % 4;
    if (padding) { chunks.push(Buffer.alloc(padding)); offset += padding; }
    const index = json.bufferViews.length;
    json.bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: data.length, ...(target ? { target } : {}) });
    chunks.push(data); offset += data.length; return index;
  };
  const primitive = json.meshes[0].primitives[0];
  for (const [key, array, type, size] of [['POSITION', positions, 'VEC3', 3], ['NORMAL', normals, 'VEC3', 3], ['TEXCOORD_0', uvs, 'VEC2', 2], ['indices', indices, 'SCALAR', 1]]) {
    const entry = { bufferView: append(Buffer.from(array.buffer, array.byteOffset, array.byteLength), key === 'indices' ? 34963 : 34962),
      componentType: array instanceof Float32Array ? 5126 : 5125, count: array.length / size, type };
    if (key === 'POSITION') {
      entry.min = [Infinity, Infinity, Infinity]; entry.max = [-Infinity, -Infinity, -Infinity];
      for (let i = 0; i < array.length; i++) { const k = i % 3; entry.min[k] = Math.min(entry.min[k], array[i]); entry.max[k] = Math.max(entry.max[k], array[i]); }
    }
    const index = json.accessors.push(entry) - 1;
    if (key === 'indices') primitive.indices = index; else primitive.attributes[key] = index;
  }
  if (images.length) {
    json.images = images.map(image => ({ mimeType: image.mimeType, bufferView: append(image.bytes) }));
    json.samplers = [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }];
    json.textures = images.map((_, source) => ({ source, sampler: 0 }));
  }
  if (material.extensions) json.extensionsUsed = Object.keys(material.extensions);
  const padding = (4 - offset % 4) % 4;
  if (padding) { chunks.push(Buffer.alloc(padding)); offset += padding; }
  json.buffers = [{ byteLength: offset }];
  const encoded = Buffer.from(JSON.stringify(json)), text = Buffer.alloc(Math.ceil(encoded.length / 4) * 4, 0x20); encoded.copy(text);
  const binary = Buffer.concat(chunks), file = Buffer.alloc(28 + text.length + binary.length);
  file.writeUInt32LE(0x46546c67, 0); file.writeUInt32LE(2, 4); file.writeUInt32LE(file.length, 8);
  file.writeUInt32LE(text.length, 12); file.writeUInt32LE(0x4e4f534a, 16); text.copy(file, 20);
  file.writeUInt32LE(binary.length, 20 + text.length); file.writeUInt32LE(0x004e4942, 24 + text.length); binary.copy(file, 28 + text.length);
  await mkdir(dirname(path), { recursive: true }); await writeFile(path, file);
  return { bytes: file.length, triangles: indices.length / 3, vertices: positions.length / 3, bounds: json.accessors[0] };
}
