import { writeFile } from 'node:fs/promises';
import { BufferGeometry, Float32BufferAttribute, Matrix4, Quaternion, Vector3 } from 'three';
import { readGlb, writeGarmentGlb } from './garment-glb.mjs';
const source = await readGlb('public/assets/models/studio-tee/studio-tee.glb');
let target;
function walk(index, parent) {
  const node = source.json.nodes[index], matrix = parent.clone().multiply(node.matrix ? new Matrix4().fromArray(node.matrix)
    : new Matrix4().compose(new Vector3(...node.translation ?? [0,0,0]), new Quaternion(...node.rotation ?? [0,0,0,1]), new Vector3(...node.scale ?? [1,1,1])));
  if (node.name === 'ShirtOnHanger_Hanger_0') target = { node, matrix };
  node.children?.forEach(child => walk(child, matrix));
}
source.json.scenes[source.json.scene ?? 0].nodes.forEach(index => walk(index, new Matrix4()));
const primitive = source.json.meshes[target.node.mesh].primitives[0];
const geometry = new BufferGeometry().setAttribute('position', new Float32BufferAttribute(source.accessor(primitive.attributes.POSITION), 3))
  .setAttribute('normal', new Float32BufferAttribute(source.accessor(primitive.attributes.NORMAL), 3)).applyMatrix4(target.matrix);
const material = structuredClone(source.json.materials[primitive.material]), images = [], textures = new Map();
for (const slot of [material.pbrMetallicRoughness.baseColorTexture, material.pbrMetallicRoughness.metallicRoughnessTexture, material.normalTexture, material.occlusionTexture]) {
  if (!slot) continue;
  const oldIndex = slot.index;
  if (!textures.has(oldIndex)) {
    textures.set(oldIndex, images.length);
    const image = source.json.images[source.json.textures[oldIndex].source], view = source.json.bufferViews[image.bufferView];
    images.push({ mimeType: image.mimeType, bytes: source.binary.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength) });
  }
  slot.index = textures.get(oldIndex);
}
const info = await writeGarmentGlb('public/assets/models/shared-hanger/wooden-hanger.glb', {
  name: 'ShirtOnHanger_Hanger_0', positions: geometry.getAttribute('position').array, normals: geometry.getAttribute('normal').array,
  uvs: source.accessor(primitive.attributes.TEXCOORD_0), indices: source.accessor(primitive.indices), material, images,
  copyright: 'Wooden hanger from CC0 - Shirt On Hanger by plaggy, CC BY 4.0. Source: https://sketchfab.com/3d-models/cc0-shirt-on-hanger-846d8f285fcb426498033ae67aee2d10',
  extras: { hookAnchor: [0,1.47,0], modifications: 'Extracted hanger only and baked the existing rail fit. Original shape, UVs and PBR maps retained.' },
});
geometry.dispose();
await writeFile('public/assets/models/shared-hanger/CREDITS.txt', 'Wooden hanger from CC0 - Shirt On Hanger by plaggy\nhttps://sketchfab.com/3d-models/cc0-shirt-on-hanger-846d8f285fcb426498033ae67aee2d10\nCC BY 4.0: https://creativecommons.org/licenses/by/4.0/\nExtracted the hanger only from the archived rail-fit model, retaining its original shape, UVs and PBR maps. Fitted per collar at runtime with a fixed hook anchor.\n');
console.log(JSON.stringify(info, null, 2));
