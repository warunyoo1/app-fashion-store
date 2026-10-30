import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { MeshoptSimplifier } from 'meshoptimizer';
import { Box3, Matrix3, Matrix4, Quaternion, Vector3 } from 'three';
import { readGlb } from './garment-glb.mjs';

const specs = JSON.parse(await readFile('assets/garments/curated-models.json', 'utf8'));
await MeshoptSimplifier.ready; MeshoptSimplifier.useExperimentalFeatures = true;
const catalogue = [];
for (const spec of specs) {
  const source = await readGlb(`assets/garments/${spec.archive}/source.glb`), doc = source.json;
  const leaves = [];
  function walk(index, parent) {
    const node = doc.nodes[index];
    const local = node.matrix ? new Matrix4().fromArray(node.matrix) : new Matrix4().compose(
      new Vector3(...node.translation ?? [0,0,0]), new Quaternion(...node.rotation ?? [0,0,0,1]), new Vector3(...node.scale ?? [1,1,1]));
    const matrix = parent.clone().multiply(local);
    if (node.mesh !== undefined) for (const primitive of doc.meshes[node.mesh].primitives) leaves.push({ primitive, matrix });
    node.children?.forEach(child => walk(child, matrix));
  }
  doc.scenes[doc.scene ?? 0].nodes.forEach(index => walk(index, new Matrix4()));
  const totalTriangles = leaves.reduce((sum, { primitive }) => sum + doc.accessors[primitive.indices].count / 3, 0);
  const ratio = Math.min(.3, 30000 / totalTriangles), groups = new Map(), bounds = new Box3();
  let worstError = 0;
  for (const { primitive, matrix } of leaves) {
    const p = source.accessor(primitive.attributes.POSITION), n = source.accessor(primitive.attributes.NORMAL), uv = source.accessor(primitive.attributes.TEXCOORD_0);
    const index = source.accessor(primitive.indices), normalMatrix = new Matrix3().getNormalMatrix(matrix), point = new Vector3();
    for (let i = 0; i < p.length; i += 3) {
      point.fromArray(p, i).applyMatrix4(matrix); point.toArray(p, i); bounds.expandByPoint(point);
      point.fromArray(n, i).applyMatrix3(normalMatrix).normalize().toArray(n, i);
    }
    const attributes = new Float32Array(p.length / 3 * 5);
    for (let i = 0; i < p.length / 3; i++) attributes.set([n[i*3], n[i*3+1], n[i*3+2], uv[i*2], uv[i*2+1]], i*5);
    const [simplified, error] = index.length < 900 ? [index, 0] : MeshoptSimplifier.simplifyWithAttributes(index, p, 3,
      attributes, 5, [.35,.35,.35,.1,.1], null, Math.max(3, Math.floor(index.length * ratio / 3) * 3), .003, ['LockBorder']);
    worstError = Math.max(worstError, error);
    const group = groups.get(primitive.material) ?? { p: [], n: [], uv: [], indices: [] };
    const vertices = [...new Set(simplified)], start = group.p.length / 3, remap = new Map(vertices.map((v,i) => [v,start+i]));
    for (const v of vertices) { group.p.push(...p.subarray(v*3,v*3+3)); group.n.push(...n.subarray(v*3,v*3+3)); group.uv.push(...uv.subarray(v*2,v*2+2)); }
    for (const v of simplified) group.indices.push(remap.get(v));
    groups.set(primitive.material, group);
  }
  const size = bounds.getSize(new Vector3()), center = bounds.getCenter(new Vector3()), scale = spec.height / size.y;
  const json = { asset: { version: '2.0', generator: 'RACK curated garment preparation',
    copyright: `${spec.title} by ${spec.author}, CC BY 4.0. ${spec.source}` }, scene: 0, scenes: [{ nodes: [0] }],
    nodes: [{ name: spec.id, children: [], extras: { sourceTriangles: totalTriangles, simplificationError: worstError, hookAnchor: [0,1.47,0] } }],
    meshes: [], accessors: [], bufferViews: [], buffers: [], materials: doc.materials, textures: doc.textures,
    samplers: doc.samplers, images: [], extensionsUsed: doc.extensionsUsed };
  const chunks = []; let offset = 0, triangles = 0;
  function append(data, target) {
    const padding = (4-offset%4)%4; if (padding) { chunks.push(Buffer.alloc(padding)); offset += padding; }
    const index = json.bufferViews.length; json.bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: data.length, ...(target ? { target } : {}) });
    chunks.push(data); offset += data.length; return index;
  }
  function pack(array, type, components, target) {
    const index = json.accessors.length;
    const accessor = { bufferView: append(Buffer.from(array.buffer), target), componentType: array instanceof Float32Array ? 5126 : 5125, count: array.length/components, type };
    if (type === 'VEC3') {
      accessor.min=[Infinity,Infinity,Infinity]; accessor.max=[-Infinity,-Infinity,-Infinity];
      for(let i=0;i<array.length;i++){const k=i%3;accessor.min[k]=Math.min(accessor.min[k],array[i]);accessor.max[k]=Math.max(accessor.max[k],array[i]);}
    }
    json.accessors.push(accessor); return index;
  }
  for (const [material, group] of groups) {
    for (let i=0;i<group.p.length;i+=3) { group.p[i]=(group.p[i]-center.x)*scale; group.p[i+1]=(group.p[i+1]-bounds.max.y)*scale+spec.top; group.p[i+2]=(group.p[i+2]-center.z)*scale; }
    const attributes={ POSITION:pack(new Float32Array(group.p),'VEC3',3,34962), NORMAL:pack(new Float32Array(group.n),'VEC3',3,34962), TEXCOORD_0:pack(new Float32Array(group.uv),'VEC2',2,34962) };
    const indices=pack(new Uint32Array(group.indices),'SCALAR',1,34963), mesh=json.meshes.length;
    json.meshes.push({ name:`${spec.id}_${material}`, primitives:[{ attributes, indices, material }] });
    json.nodes[0].children.push(json.nodes.length); json.nodes.push({mesh,name:`${spec.id}_surface_${material}`}); triangles+=group.indices.length/3;
  }
  for (const image of doc.images ?? []) {
    const view=doc.bufferViews[image.bufferView];
    json.images.push({mimeType:image.mimeType,bufferView:append(source.binary.subarray(view.byteOffset??0,(view.byteOffset??0)+view.byteLength))});
  }
  const pad=(4-offset%4)%4;if(pad){chunks.push(Buffer.alloc(pad));offset+=pad;}json.buffers=[{byteLength:offset}];
  const encoded=Buffer.from(JSON.stringify(json)),text=Buffer.alloc(Math.ceil(encoded.length/4)*4,0x20);encoded.copy(text);
  const binary=Buffer.concat(chunks),file=Buffer.alloc(28+text.length+binary.length);
  file.writeUInt32LE(0x46546c67,0);file.writeUInt32LE(2,4);file.writeUInt32LE(file.length,8);file.writeUInt32LE(text.length,12);file.writeUInt32LE(0x4e4f534a,16);text.copy(file,20);
  file.writeUInt32LE(binary.length,20+text.length);file.writeUInt32LE(0x004e4942,24+text.length);binary.copy(file,28+text.length);
  const destination=`public/assets/models/${spec.id}`;await mkdir(destination,{recursive:true});await writeFile(`${destination}/${spec.id}.glb`,file);
  const credit=`${spec.title} by ${spec.author}\n${spec.source}\nCC BY 4.0: https://creativecommons.org/licenses/by/4.0/\nAdapted for RACK: world transforms baked, geometry simplified with locked borders and normal/UV weighting, matching-material surfaces merged, uniformly fitted to the clothing rail. Original PBR texture images retained. Shared wooden hanger by plaggy is added separately. Product names, sizes and prices are demonstration data.\n`;
  await writeFile(`${destination}/CREDITS.txt`,credit);await writeFile(`assets/garments/${spec.archive}/CREDITS.txt`,credit);
  const info={...spec,width:size.x*scale,depth:size.z*scale,triangles,sourceTriangles:totalTriangles,worstError,bytes:file.length,images:json.images.length,materials:groups.size,
    sourceSha256:createHash('sha256').update(source.file).digest('hex'),downloadedOn:'2026-10-29'};
  await writeFile(`assets/garments/${spec.archive}/model-info.json`,JSON.stringify(info,null,2)+'\n');catalogue.push(info);
  console.log(JSON.stringify({id:spec.id,width:info.width,depth:info.depth,triangles,bytes:file.length,materials:groups.size,images:json.images.length}));
}
await writeFile('assets/garments/curated-rail-models.json',JSON.stringify(catalogue,null,2)+'\n');
