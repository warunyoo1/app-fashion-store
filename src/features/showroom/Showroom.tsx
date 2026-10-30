import {
  Suspense,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Color,
  Group,
  Mesh,
} from "three";
import type { Material } from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { PMREMGenerator } from "three";
import { products } from "../catalog/products";
import { CatalogFallback } from "../catalog/CatalogFallback";
import { SceneBoundary } from "../../shared/SceneBoundary";
import { gsap, motionReduced } from "../../shared/motion/gsap";
import { createObjectEntrance } from "../../shared/motion/threeMotion";
import { neckline, shapes } from "./garmentGeometry";
import { GarmentBody, Hanger, Tube, useGarmentModel } from "./GarmentModel";
import { createRailHover, dampRail } from "./railMotion";
import { FOCUS_SCALE, planRail, REST_ANGLE } from "./railLayout";
import { visibleRailItems } from "./railPan";
import { useRailPan } from "./useRailPan";
import { MoveHorizontal } from "lucide-react";
import "./railViewport.css";
import { GarmentAssetScope } from "./GarmentAssetScope";
import { usePreparedGarment } from "./usePreparedGarment";
import {
  RAIL_HEIGHT as RAIL,
  HOOK_ANCHOR as HOOK,
} from "./garmentRig";

const VIEW_CENTER = 1.3;
const railDimensions = products.map(product => ({ width: product.model?.width ?? 1.8,
  depth: product.model?.depth ?? .4, scale: shapes[product.kind].scale }));
const restingRail = planRail(railDimensions, null, false);
type GarmentState = "rest" | "front" | "focus" | "ghost";
const Garment = memo(function Garment({
  index,
  colorway,
  state,
  x,
  angle,
  onHover,
  onSelect,
  onLoaded,
  reduced,
  active,
}: {
  index: number;
  colorway: number;
  state: GarmentState;
  x: number;
  angle: number;
  onHover: (index: number, over: boolean) => void;
  onSelect: (index: number) => void;
  onLoaded: (index: number, colorway: number) => void;
  reduced: boolean;
  active: boolean;
}) {
  const ref = useRef<Group>(null),
    down = useRef<[number, number]>([0, 0]);
  const invalidate = useThree((store) => store.invalidate);
  const animatedMaterials = useRef<Material[]>([]);
  const product = products[index],
    shape = shapes[product.kind],
    way = product.colorways[colorway];
  // These are mount values only. Passing the animated target as a JSX position
  // makes Fiber teleport the mesh before useFrame can interpolate it.
  const initialPosition = useRef<[number, number, number]>([
    x,
    RAIL - HOOK * shape.scale,
    0,
  ]);
  const asset = useGarmentModel(index, colorway);
  const prepared = usePreparedGarment(asset, active);
  useEffect(() => { if (prepared) onLoaded(index, colorway); }, [index, colorway, onLoaded, prepared]);
  const { materials: material, hitWidth } = asset;
  const collar = useMemo(() => neckline(product.kind), [product.kind]);
  useLayoutEffect(() => {
    const materials = new Set<Material>();
    ref.current?.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      const entries = Array.isArray(object.material)
        ? object.material
        : [object.material];
      entries.forEach((entry) => materials.add(entry));
    });
    animatedMaterials.current = [...materials];
  }, [material, collar, asset.object, prepared]);
  useEffect(
    () => invalidate(),
    [state, x, angle, reduced, material, invalidate],
  );
  const tint = useMemo(() => new Color(), []),
    white = useMemo(() => new Color("#ffffff"), []),
    ghost = useMemo(() => new Color("#c9ccca"), []),
    base = useMemo(() => new Color(way.color), [way]);
  useFrame((_, delta) => {
    const g = ref.current;
    if (!g || !active) return;
    let moving = false;
    const advance = (current: number, target: number) => {
      const next = dampRail(current, target, delta, reduced);
      if (next !== target) moving = true;
      return next;
    };
    const scale =
      state === "focus"
        ? Math.min(shape.scale * FOCUS_SCALE, 1.27)
        : shape.scale;
    g.position.x = advance(g.position.x, x);
    g.position.y = advance(g.position.y, RAIL - HOOK * scale);
    // Hover/focus travels along the rail; the hook never floats in front of it.
    g.position.z = advance(g.position.z, 0);
    g.rotation.y = advance(
      g.rotation.y,
      state === "focus" ? angle : state === "front" ? -0.06 : REST_ANGLE,
    );
    g.scale.setScalar(advance(g.scale.x, scale));
    // Everything not in focus fades back to a pale ghost on the rail.
    const opacity = advance(material[0].opacity, state === "ghost" ? 0.2 : 1);
    tint.copy(state === "ghost" ? ghost : white);
    for (const entry of animatedMaterials.current) {
      entry.opacity = opacity;
      entry.depthWrite = opacity > 0.9;
    }
    for (let i = 0; i < material.length; i++) {
      const colorwayMaterial = product.model ? material[i].name === product.model.colorMaterial : i === 2;
      const target = state === "ghost" ? ghost : colorwayMaterial ? base : product.model ? asset.baseColors[i] : tint;
      const color = material[i].color;
      color.setRGB(
        advance(color.r, target.r),
        advance(color.g, target.g),
        advance(color.b, target.b),
      );
    }
    if (moving) invalidate();
  });
  if (!prepared) return null;
  return (
    <group
      ref={ref}
      position={initialPosition.current}
      rotation={[0, REST_ANGLE, 0]}
      scale={shape.scale}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(index, true);
        document.body.style.cursor = "pointer";
      }}
      onPointerMove={(e) => {
        e.stopPropagation();
        if (e.pointerType !== "touch") onHover(index, true);
      }}
      onPointerOut={() => {
        onHover(index, false);
        document.body.style.cursor = "";
      }}
      onPointerDown={(e) => {
        down.current = [e.clientX, e.clientY];
      }}
      onPointerUp={(e) => {
        if (
          Math.hypot(e.clientX - down.current[0], e.clientY - down.current[1]) <
          8
        ) {
          e.stopPropagation();
          onSelect(index);
        }
      }}
    >
      {!product.model && <Hanger kind={product.kind} />}
      <GarmentBody asset={asset} />
      {!product.photographs && !product.model && (
        <Tube points={collar} radius={0.02} color={way.accent} metalness={0} />
      )}
      {/* One stable, inexpensive hit target replaces raycasting thousands of cloth triangles. */}
      <mesh visible={false} position={asset.hitCenter}>
        <boxGeometry args={[hitWidth, asset.hitHeight, Math.max(.4, asset.hitDepth)]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  );
});
function Setup({
  onReady,
  onScale,
  focused,
  focusedWidth,
  reduced,
}: {
  onReady: () => void;
  onScale: (unit: number, railY: number) => void;
  focused: boolean;
  focusedWidth: number;
  reduced: boolean;
}) {
  const { gl, scene, camera, size, invalidate } = useThree();
  const targetZoom = useRef(80),
    initialized = useRef(false);
  useEffect(() => {
    const generator = new PMREMGenerator(gl),
      room = new RoomEnvironment();
    const environment = generator.fromScene(room, 0.04);
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.8;
    onReady();
    return () => {
      scene.environment = null;
      environment.dispose();
      generator.dispose();
      room.dispose();
    };
  }, [gl, scene, onReady]);
  useEffect(() => {
    camera.position.set(0, VIEW_CENTER + 0.4, 11);
    camera.lookAt(0, VIEW_CENTER, 0);
    // Keep the same clear band above the rail in both modes: the hero caption
    // uses it while browsing, and the back button uses it during product focus.
    const framingHeight = size.height - 64;
    // Phones crop the rack ends a little so the garments stay a readable size.
    const zoom = Math.min(
      size.width / (focused ? (size.width < 600 ? Math.max(3.5, focusedWidth + .55) : 7.4) : size.width < 600 ? 5.7 : 7.4),
      framingHeight / 5.2,
    );
    if ("zoom" in camera) {
      targetZoom.current = zoom;
      if (!initialized.current) {
        camera.zoom = zoom;
        camera.updateProjectionMatrix();
        initialized.current = true;
      }
      invalidate();
    }
    onScale(zoom, size.height / 2 - (RAIL - VIEW_CENTER) * zoom);
  }, [camera, size, onScale, focused, focusedWidth, invalidate]);
  useFrame((_, delta) => {
    if (camera.zoom === targetZoom.current) return;
    camera.zoom = dampRail(camera.zoom, targetZoom.current, delta, reduced);
    camera.updateProjectionMatrix();
    invalidate();
  });
  return null;
}
export interface ShowroomProps {
  selected: number | null;
  /** Garment turned to face the viewer while browsing (keyboard or picker). */
  front: number | null;
  colorways: number[];
  angle: number;
  onSelect: (i: number) => void;
  onBrowse: (i: number) => void;
  onReady: () => void;
  onUnavailable: () => void;
  onScale: (unit: number, railY: number) => void;
  reduced: boolean;
}
interface StageProps extends ShowroomProps {
  pan: number; panning: boolean; unit: number; active: boolean; prepare: boolean;
  onLoaded: (index: number, colorway: number) => void; onEnvironmentReady: () => void; onVisible: (indices: number[]) => void;
}
function Stage(props: StageProps) {
  const { selected, front, colorways, angle, onSelect, reduced } = props;
  const entrance = useRef<Group>(null);
  const railRoot = useRef<Group>(null);
  const initialPan = useRef<[number, number, number]>([-(restingRail.positions[front ?? 0] ?? 0), 0, 0]);
  const invalidate = useThree(store => store.invalidate);
  const viewWidth = useThree(store => store.size.width) / props.unit;
  useLayoutEffect(() => {
    if (!entrance.current || motionReduced(reduced)) return;
    const context = gsap.context(() => createObjectEntrance(entrance.current!, "hero", invalidate).play());
    return () => context.revert();
  }, [reduced, invalidate]);
  const [hovered, setHovered] = useState<number | null>(null);
  const hoverIntent = useMemo(() => createRailHover(setHovered), []);
  useEffect(() => () => hoverIntent.dispose(), [hoverIntent]);
  useEffect(() => hoverIntent.reset(), [selected, front, props.panning, hoverIntent]);
  const onHover = useMemo(
    () => (index: number, over: boolean) => {
      if (selected !== null || props.panning) return;
      if (over) hoverIntent.enter(index);
      else hoverIntent.leave(index);
    },
    [selected, props.panning, hoverIntent],
  );
  const open = selected ?? (props.panning ? null : hovered ?? front);
  const rail = planRail(railDimensions, open, selected !== null);
  const xs = rail.positions;
  const offset = selected !== null ? xs[selected] : props.pan;
  const visible = visibleRailItems(xs, offset, viewWidth);
  const visibleKey = visible.join(",");
  useEffect(() => { props.onVisible(visible); }, [visibleKey, props.onVisible]);
  useEffect(() => invalidate(), [offset, props.panning, props.active, invalidate]);
  useFrame((_, delta) => {
    if (!railRoot.current || !props.active) return;
    const current = railRoot.current.position.x;
    const next = props.panning || Math.abs(current + offset) > viewWidth
      ? -offset : dampRail(current, -offset, delta, reduced);
    railRoot.current.position.x = next;
    if (next !== -offset) invalidate();
  });
  return (
    <>
      <Setup
        onReady={props.onEnvironmentReady}
        onScale={props.onScale}
        focused={selected !== null}
        focusedWidth={selected === null ? 0 : rail.spans[selected]}
        reduced={reduced}
      />
      <ambientLight intensity={0.18} />
      <hemisphereLight args={["#fffdf8", "#a39b90", 0.7]} />
      <directionalLight
        position={[-3, 5, 8]}
        intensity={2.3}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={6}
        shadow-camera-bottom={-3}
        shadow-normalBias={0.015}
        shadow-bias={-0.0001}
      />
      <mesh position={[0, 2, -0.3]} receiveShadow>
        <planeGeometry args={[40, 16]} />
        <shadowMaterial opacity={0.045} depthWrite={false} />
      </mesh>
      <group ref={entrance}>
      <group ref={railRoot} position={initialPan.current}>
      <mesh position={[0, RAIL, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, Math.max(60, restingRail.width + 30), 16]} />
        <meshStandardMaterial color="#b9bdbc" metalness={0.7} roughness={0.3} />
      </mesh>
      {visible.map(i => (
        <Suspense key={products[i].id} fallback={null}>
        <Garment
          index={i}
          colorway={colorways[i]}
          x={xs[i]}
          state={
            selected === null
              ? open === i
                ? "front"
                : "rest"
              : selected === i
                ? "focus"
                : "ghost"
          }
          angle={angle}
          onHover={onHover}
          onSelect={onSelect}
          onLoaded={props.onLoaded}
          reduced={reduced}
          active={props.active && props.prepare}
        />
        </Suspense>
      ))}
      </group>
      </group>
    </>
  );
}
export default memo(function Showroom(props: ShowroomProps) {
  const viewport = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  const [unit, setUnit] = useState(80), [environmentReady, setEnvironmentReady] = useState(false);
  const [loaded, setLoaded] = useState<Set<string>>(() => new Set()), [visible, setVisible] = useState<number[]>([]);
  const pan = useRailPan(viewport, restingRail.positions, props.front, props.selected === null, unit, props.onBrowse);
  const onEnvironmentReady = useCallback(() => setEnvironmentReady(true), []);
  const onLoaded = useCallback((index: number, colorway: number) => {
    const key = `${index}:${colorway}`;
    setLoaded(previous => previous.has(key) ? previous : new Set([...previous, key]));
  }, []);
  const onVisible = useCallback((indices: number[]) => setVisible(indices), []);
  const onScale = useCallback((value: number, railY: number) => { setUnit(value); props.onScale(value, railY); }, [props.onScale]);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting));
    if (viewport.current) observer.observe(viewport.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const index = props.selected ?? props.front ?? 0;
    if (environmentReady && loaded.has(`${index}:${props.colorways[index]}`)) props.onReady();
  }, [environmentReady, loaded, props.selected, props.front, props.colorways, props.onReady]);
  const pending = visible.some(index => !loaded.has(`${index}:${props.colorways[index]}`));
  const focusedPending = props.selected !== null && !loaded.has(`${props.selected}:${props.colorways[props.selected]}`);
  return (
    <div className="rack-experience">
    <div className="rack-viewport" ref={viewport} data-panning={pan.panning} {...pan.pointerHandlers}>
    <SceneBoundary fallback={<CatalogFallback selected={props.selected} colorways={props.colorways}
      onSelect={props.onSelect} onReady={props.onReady} onUnavailable={props.onUnavailable} />}>
    <Canvas
      orthographic
      shadows="soft"
      frameloop={active ? "demand" : "never"}
      dpr={[1, 1.5]}
      camera={{ position: [0, VIEW_CENTER, 11], zoom: 80, near: 0.1, far: 50 }}
      gl={{ antialias: true, alpha: true }}
      role="img"
      aria-label="ราวเสื้อ 3D ชี้เพื่อหันเสื้อเข้าหาคุณ แตะเพื่อขยายดู แล้วลากเพื่อหมุน"
    >
      <GarmentAssetScope><Suspense fallback={null}>
        <Stage {...props} onScale={onScale} pan={pan.pan} panning={pan.panning} unit={unit}
          active={active} prepare={environmentReady}
          onLoaded={onLoaded} onEnvironmentReady={onEnvironmentReady} onVisible={onVisible} />
      </Suspense></GarmentAssetScope>
    </Canvas>
    </SceneBoundary>
    </div>
    {environmentReady && focusedPending && <span className="rack-focus-loading" role="status">กำลังจัดเสื้อให้คุณ…</span>}
    {props.selected === null && <div className="rack-scroll-control">
      <label htmlFor="rack-pan"><MoveHorizontal size={14} aria-hidden="true" /> ลากราว หรือเลื่อนเมาส์</label>
      <input id="rack-pan" type="range" min="0" max="1000" step="1" value={pan.progress}
        aria-label="เลื่อนราวเสื้อ" aria-valuetext={`${pan.nearest + 1} จาก ${products.length} · ${products[pan.nearest].name}`}
        onChange={event => pan.setProgress(Number(event.target.value))} onKeyDown={pan.keyDown} />
      {pending && <span className="rack-more-loading" role="status">กำลังโหลดเสื้อเพิ่ม…</span>}
    </div>}
    </div>
  );
});
