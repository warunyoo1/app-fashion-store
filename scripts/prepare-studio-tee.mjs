import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Box3, Matrix4, Quaternion, Vector3 } from "three";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = await readFile(resolve(root, "assets/garments/plaggy-pbr-shirt/source.glb"));
const jsonLength = source.readUInt32LE(12);
const json = JSON.parse(source.toString("utf8", 20, 20 + jsonLength));
const binary = source.subarray(20 + jsonLength);
const matrices = new Map();
function walk(index, parent) {
  const node = json.nodes[index];
  const local = node.matrix ? new Matrix4().fromArray(node.matrix) : new Matrix4().compose(
    new Vector3().fromArray(node.translation ?? [0, 0, 0]),
    new Quaternion().fromArray(node.rotation ?? [0, 0, 0, 1]),
    new Vector3().fromArray(node.scale ?? [1, 1, 1]),
  );
  const world = parent.clone().multiply(local);
  matrices.set(index, world);
  node.children?.forEach(child => walk(child, world));
}
const scene = json.scenes[json.scene ?? 0];
scene.nodes.forEach(index => walk(index, new Matrix4()));
const shirtIndex = json.nodes.findIndex(node => node.name === "ShirtOnHanger_Shirt_0");
const hangerIndex = json.nodes.findIndex(node => node.name === "ShirtOnHanger_Hanger_0");
const positions = json.accessors[json.meshes[json.nodes[shirtIndex].mesh].primitives[0].attributes.POSITION];
const shirtBounds = new Box3(new Vector3().fromArray(positions.min), new Vector3().fromArray(positions.max)).applyMatrix4(matrices.get(shirtIndex));
const scale = 2 / shirtBounds.getSize(new Vector3()).y;
// Centre of the actual hook opening in the downloaded mesh's local coordinates.
// Its front/back depth must sit on the rail's Z=0 axis as the item turns.
const hook = new Vector3(0, 0.65, 12.5).applyMatrix4(matrices.get(hangerIndex));
const targetHook = new Vector3(0, 1.47, 0);
const fit = new Matrix4().makeTranslation(...targetHook.toArray())
  .multiply(new Matrix4().makeScale(scale, scale, scale))
  .multiply(new Matrix4().makeTranslation(-hook.x, -hook.y, -hook.z));
const fitIndex = json.nodes.length;
json.nodes.push({ name: "RACK_rail_fit", matrix: fit.toArray(), children: scene.nodes,
  extras: { hookAnchor: targetHook.toArray(), sourceHook: hook.toArray(), garmentHeight: 2 } });
scene.nodes = [fitIndex];
json.asset.copyright = '"CC0 - Shirt On Hanger" by plaggy, CC BY 4.0. Source: https://sketchfab.com/3d-models/cc0-shirt-on-hanger-846d8f285fcb426498033ae67aee2d10. Adapted: fitted to the RACK rail; geometry and original textures retained.';
const encoded = Buffer.from(JSON.stringify(json));
const padded = Buffer.alloc(Math.ceil(encoded.length / 4) * 4, 0x20);
encoded.copy(padded);
const output = Buffer.alloc(20 + padded.length + binary.length);
output.writeUInt32LE(0x46546c67, 0); output.writeUInt32LE(2, 4); output.writeUInt32LE(output.length, 8);
output.writeUInt32LE(padded.length, 12); output.writeUInt32LE(0x4e4f534a, 16);
padded.copy(output, 20); binary.copy(output, 20 + padded.length);
const destination = resolve(root, "public/assets/models/studio-tee");
await mkdir(destination, { recursive: true });
await writeFile(resolve(destination, "studio-tee.glb"), output);
await writeFile(resolve(destination, "CREDITS.txt"), `${json.asset.copyright}\nLicence: https://creativecommons.org/licenses/by/4.0/\nThe asset title says CC0, but the Sketchfab download panel lists CC BY 4.0; this project retains attribution under CC BY 4.0.\nThe Chalk and Ink colour options tint the original cloth material in the browser. The original design remains a demonstration, not a real RACK product.\n`);
console.log(JSON.stringify({ bytes: output.length, sourceHook: hook.toArray(), targetHook: targetHook.toArray(), scale, fittedShirt: shirtBounds.clone().applyMatrix4(fit) }, null, 2));
