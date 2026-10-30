import { Mesh, Texture } from "three";
import type { Camera, Object3D, Scene, MeshStandardMaterial, WebGLRenderer } from "three";

type Schedule = (callback: FrameRequestCallback) => number;
type Job = { run: () => void | Promise<unknown>; resolve: () => void; reject: (error: unknown) => void };
type Warmups = {
  objects: WeakMap<Object3D, { ready: boolean; promise: Promise<void> }>;
  textures: WeakMap<Texture, Promise<void>>;
  jobs: Job[];
  scheduled: boolean;
  owners: number;
  active: boolean;
};
const renderers = new WeakMap<WebGLRenderer, Warmups>();

function warmups(renderer: WebGLRenderer) {
  let store = renderers.get(renderer);
  if (!store) {
    store = { objects: new WeakMap(), textures: new WeakMap(), jobs: [], scheduled: false, owners: 0, active: true };
    renderers.set(renderer, store);
  }
  return store;
}

export function retainGarmentPreparation(renderer: WebGLRenderer) {
  const store = warmups(renderer);
  store.owners++; store.active = true;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    store.active = --store.owners > 0;
  };
}

function assertActive(store: Warmups) {
  if (!store.active) throw new DOMException("Canvas closed during garment preparation", "AbortError");
}

/** Like compileAsync, but snapshot the programs and stop polling when the canvas closes.
 * Three r180's compileAsync keeps reading material properties after renderer.dispose(). */
function compileMesh(renderer: WebGLRenderer, store: Warmups, mesh: Mesh, camera: Camera, scene: Scene, schedule: Schedule) {
  const materials = renderer.compile(mesh, camera, scene);
  const context = renderer.getContext();
  const extension = context.getExtension("KHR_parallel_shader_compile");
  const programs = [...materials].map(material => {
    const properties = renderer.properties.get(material) as { currentProgram?: { program?: WebGLProgram } };
    if (!properties.currentProgram?.program) throw new Error("Garment shader program unavailable");
    return properties.currentProgram.program;
  });
  return new Promise<void>((resolve, reject) => {
    const check = () => {
      try {
        assertActive(store);
        if (context.isContextLost()) throw new Error("WebGL context unavailable");
        if (!extension || programs.every(program => context.getProgramParameter(program, extension.COMPLETION_STATUS_KHR))) resolve();
        else schedule(check);
      } catch (error) { reject(error); }
    };
    check();
  });
}

/** Start only one preparation job per frame; never upload an entire wardrobe in a click handler. */
function enqueue(store: Warmups, run: Job["run"], schedule: Schedule) {
  const pump = () => {
    if (store.scheduled || !store.jobs.length) return;
    store.scheduled = true;
    schedule(() => {
      store.scheduled = false;
      const job = store.jobs.shift()!;
      try { assertActive(store); Promise.resolve(job.run()).then(job.resolve, job.reject); }
      catch (error) { job.reject(error); }
      pump();
    });
  };
  return new Promise<void>((resolve, reject) => { store.jobs.push({ run, resolve, reject }); pump(); });
}

export function isGarmentPrepared(renderer: WebGLRenderer, object: Object3D | null) {
  return object === null || warmups(renderer).objects.get(object)?.ready === true;
}

/** Compile in parallel on the driver, and spread texture uploads across separate frames. */
export function prepareGarment(renderer: WebGLRenderer, scene: Scene, camera: Camera,
  asset: { object: Object3D | null; materials: MeshStandardMaterial[] },
  schedule: Schedule = callback => requestAnimationFrame(callback)) {
  if (!asset.object) return Promise.resolve();
  const store = warmups(renderer), existing = store.objects.get(asset.object);
  if (existing) return existing.promise;
  const meshes: Mesh[] = [], textures = new Set<Texture>();
  asset.object.traverse(node => { if (node instanceof Mesh) meshes.push(node); });
  asset.materials.forEach(material => Object.values(material).forEach(value => { if (value instanceof Texture) textures.add(value); }));
  const record = { ready: false, promise: Promise.resolve() };
  const compile = async () => {
    for (const mesh of meshes) await enqueue(store, () => compileMesh(renderer, store, mesh, camera, scene, schedule), schedule);
  };
  const uploads = [...textures].map(texture => {
    let pending = store.textures.get(texture);
    if (!pending) {
      pending = enqueue(store, () => renderer.initTexture(texture), schedule);
      store.textures.set(texture, pending);
      pending.catch(() => store.textures.delete(texture));
    }
    return pending;
  });
  record.promise = Promise.all([compile(), ...uploads]).then(() => { record.ready = true; }).catch(error => {
    store.objects.delete(asset.object!);
    throw error;
  });
  store.objects.set(asset.object, record);
  return record.promise;
}
