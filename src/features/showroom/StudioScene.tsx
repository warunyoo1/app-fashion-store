import { memo, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Group, PMREMGenerator } from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { products } from "../catalog/products";
import { ProductThumbnail } from "../catalog/ProductThumbnail";
import { SceneBoundary } from "../../shared/SceneBoundary";
import { GarmentBody, Hanger, useGarmentModel } from "./GarmentModel";
import { dampRail } from "./railMotion";
import { gsap, ScrollTrigger, motionReduced } from "../../shared/motion/gsap";
import { createObjectEntrance } from "../../shared/motion/threeMotion";
import { GarmentAssetScope } from "./GarmentAssetScope";
import { usePreparedGarment } from "./usePreparedGarment";
import type { HangerStyle } from "./importedGarment";
import { HOOK_ANCHOR } from "./garmentRig";
import { useStudioInteraction } from "./useStudioInteraction";
import type { StudioInteractionProps } from "./useStudioInteraction";
import type { createHangerSwing } from "./studioInteraction";
import { createStudioExchange } from "./studioExchange";

interface Props extends StudioInteractionProps {
  indices: number[]; detail: boolean; angle: number; zoom: number;
  colorway?: number;
  hangerStyle?: HangerStyle;
  reduced: boolean; active: boolean; onReady: () => void; onUnavailable?: () => void;
}
type Display = { key: string; indices: number[]; colorway: number; hangerStyle: HangerStyle };
const DETAIL_PIVOT: [number, number, number] = [Math.sin(.05) * HOOK_ANCHOR * 1.08, -.25 + Math.cos(.05) * HOOK_ANCHOR * 1.08, 0];
const DETAIL_OFFSET: [number, number, number] = DETAIL_PIVOT.map(value => -value) as [number, number, number];
function StudioFallback({ indices, onReady, onUnavailable, colorway = 0 }: Props) {
  useEffect(() => { onReady(); onUnavailable?.(); }, [onReady, onUnavailable]);
  return <div className="studio-fallback">
    <ProductThumbnail product={products[indices[0]]} colorway={products[indices[0]].colorways[colorway]} />
    <p>อุปกรณ์นี้แสดง 3D ไม่ได้ กดดูรายละเอียดเพื่อเลือกเสื้อได้ครับ</p>
  </div>;
}
function StudioGarment({ index, slot, detail, reduced, colorway, hangerStyle, swing }: { index: number; slot: number; detail: boolean; reduced: boolean; colorway: number; hangerStyle: HangerStyle; swing?: ReturnType<typeof createHangerSwing> }) {
  const asset = useGarmentModel(index, colorway, hangerStyle);
  const reveal = useRef<Group>(null);
  const suspension = useRef<Group>(null);
  const invalidate = useThree(store => store.invalidate);
  useLayoutEffect(() => {
    if (!reveal.current || motionReduced(reduced)) return;
    const context = gsap.context(() => {
      createObjectEntrance(reveal.current!, "product", invalidate).play();
      if (swing) gsap.fromTo(asset.materials, { opacity: 0 },
        { opacity: 1, duration: .32, ease: "power3.out", onUpdate: invalidate });
    });
    return () => context.revert();
  }, [index, reduced, invalidate, asset.materials, swing]);
  useFrame((_, delta) => {
    if (!suspension.current || !swing) return;
    suspension.current.rotation.z = swing.step(delta, reduced);
    if (swing.moving) invalidate();
  });
  const position: [number, number, number] = detail ? [0, -.25, 0]
    : slot === 0 ? [-.95, .05, .3] : [1.15, -.13, -.48];
  return <group ref={reveal}><group position={position} rotation={[0, detail ? 0 : slot === 0 ? -.22 : .32, detail ? -.05 : slot === 0 ? -.055 : .06]} scale={detail ? 1.08 : .95}>
    <group ref={suspension} position={[0, HOOK_ANCHOR, 0]}><group position={[0, -HOOK_ANCHOR, 0]}>
      <GarmentBody asset={asset} />
      {!products[index].model && <Hanger kind={products[index].kind} />}
    </group></group>
    <mesh position={[0, 3, 0]}>
      <cylinderGeometry args={[.003, .003, 3.06, 6]} /><meshStandardMaterial color="#b9c0b3" metalness={.75} roughness={.4} transparent />
    </mesh>
  </group></group>;
}
function PrepareStudioGarment({ index, colorway, hangerStyle, onPrepared }: { index: number; colorway: number; hangerStyle: HangerStyle; onPrepared: (index: number) => void }) {
  const asset = useGarmentModel(index, colorway, hangerStyle);
  const ready = usePreparedGarment(asset);
  useEffect(() => { if (ready) onPrepared(index); }, [ready, index, onPrepared]);
  return null;
}
function PrepareStudioPair({ indices, colorway, hangerStyle, onPrepared }: { indices: number[]; colorway: number; hangerStyle: HangerStyle; onPrepared: () => void }) {
  const completed = useRef(new Set<number>());
  const onGarmentPrepared = useCallback((index: number) => {
    completed.current.add(index);
    if (indices.every(item => completed.current.has(item))) onPrepared();
  }, [indices, onPrepared]);
  return indices.map(index => <Suspense key={index} fallback={null}>
    <PrepareStudioGarment index={index} colorway={colorway} hangerStyle={hangerStyle} onPrepared={onGarmentPrepared} />
  </Suspense>);
}
function StudioStage({ indices, detail, angle, zoom, reduced, active, onReady, colorway = 0, hangerStyle = "wood", interactive = false, onAngleChange, onZoomChange, onInteracted }: Props) {
  const { gl, scene, camera, size, invalidate } = useThree();
  const [environmentReady, setEnvironmentReady] = useState(false);
  const [displayed, setDisplayed] = useState<Display | null>(null);
  const [prepared, setPrepared] = useState<Display | null>(null), [exiting, setExiting] = useState(false);
  const requestKey = `${indices.join(":")}:${colorway}:${hangerStyle}`;
  const latestRequest = useRef(requestKey), readyCallback = useRef(onReady);
  latestRequest.current = requestKey; readyCallback.current = onReady;
  const onPrepared = useCallback(() => {
    if (latestRequest.current !== requestKey) return;
    setPrepared(previous => previous?.key === requestKey ? previous : { key: requestKey, indices, colorway, hangerStyle });
    invalidate();
  }, [requestKey, indices, colorway, hangerStyle, invalidate]);
  const root = useRef<Group>(null), targetZoom = useRef(100), initialized = useRef(false);
  const exchange = useRef<Group>(null), exchangeMotion = useRef<ReturnType<typeof createStudioExchange> | null>(null);
  const { gesture, swing } = useStudioInteraction({ enabled: interactive && active && !exiting && displayed?.key === requestKey,
    angle, zoom, requestKey, reduced, onAngleChange, onZoomChange, onInteracted });
  useLayoutEffect(() => {
    if (!interactive || !displayed || !exchange.current) return;
    const motion = createStudioExchange(exchange.current, invalidate);
    exchangeMotion.current = motion;
    return () => { motion.dispose(); if (exchangeMotion.current === motion) exchangeMotion.current = null; };
  }, [displayed?.key, interactive, invalidate]);
  useLayoutEffect(() => { exchangeMotion.current?.cancel(); setExiting(false); }, [requestKey]);
  useLayoutEffect(() => {
    if (!prepared || prepared.key !== requestKey || displayed?.key === prepared.key) return;
    const commit = () => {
      if (latestRequest.current !== prepared.key) return;
      setDisplayed(prepared); setExiting(false); readyCallback.current(); invalidate();
    };
    if (!displayed || !interactive || !active || motionReduced(reduced) || !exchangeMotion.current) { commit(); return; }
    setExiting(true); exchangeMotion.current.exit(commit);
  }, [prepared, displayed?.key, requestKey, interactive, active, reduced, invalidate]);
  useEffect(() => {
    if (displayed && interactive && !motionReduced(reduced)) { swing.impulse(.22); invalidate(); }
  }, [displayed?.key, interactive, reduced, swing, invalidate]);
  const entrance = useRef<Group>(null), isActive = useRef(active);
  isActive.current = active;
  const intent = useRef({ x: 0, y: 0, scroll: 0 });
  const rest = useMemo(() => ({ x: 0, y: 0 }), []);
  useEffect(() => {
    const generator = new PMREMGenerator(gl), room = new RoomEnvironment();
    const environment = generator.fromScene(room, .04);
    scene.environment = environment.texture; scene.environmentIntensity = .8;
    setEnvironmentReady(true); invalidate();
    return () => { scene.environment = null; environment.dispose(); generator.dispose(); room.dispose(); };
  }, [gl, scene, invalidate]);
  useEffect(() => {
    const canvas = gl.domElement;
    const pointer = (event: PointerEvent) => {
      if (interactive || reduced || event.pointerType === "touch") return;
      const rect = canvas.getBoundingClientRect();
      intent.current.x = (event.clientX - rect.left) / rect.width - .5;
      intent.current.y = (event.clientY - rect.top) / rect.height - .5;
      invalidate();
    };
    const leave = () => { intent.current.x = intent.current.y = 0; invalidate(); };
    canvas.addEventListener("pointermove", pointer); canvas.addEventListener("pointerleave", leave);
    return () => { canvas.removeEventListener("pointermove", pointer); canvas.removeEventListener("pointerleave", leave); };
  }, [gl, invalidate, reduced, interactive]);
  useLayoutEffect(() => {
    intent.current.scroll = 0;
    if (!entrance.current || motionReduced(reduced)) return;
    const context = gsap.context(() => {
      const entry = createObjectEntrance(entrance.current!, detail ? "detail" : "collection", invalidate);
      ScrollTrigger.create({ trigger: gl.domElement, start: "top 88%", once: true,
        animation: entry, toggleActions: "play none none none" });
      const update = (trigger: ScrollTrigger) => {
        intent.current.scroll = trigger.progress - .5;
        if (isActive.current) invalidate();
      };
      if (!interactive) ScrollTrigger.create({ trigger: gl.domElement, start: "top bottom", end: "bottom top",
        onUpdate: update, onRefresh: update });
    });
    return () => context.revert();
  }, [gl, detail, reduced, invalidate, interactive]);
  useEffect(() => {
    const index = (displayed?.indices ?? indices)[0];
    const width = detail ? Math.max(2.9, (products[index].model?.width ?? 2) * 1.08 + .35) : 5;
    const height = detail ? Math.max(3.1, (products[index].model?.height ?? 2) * 1.08 + 1.1) : 3.7;
    targetZoom.current = Math.min(size.width / width, size.height / height);
    if (!initialized.current) { camera.zoom = targetZoom.current * zoom; camera.updateProjectionMatrix(); initialized.current = true; }
    invalidate();
  }, [size, detail, zoom, indices, displayed, camera, invalidate]);
  useEffect(() => { invalidate(); }, [angle, indices, active, invalidate]);
  useFrame((_, delta) => {
    if (!root.current || !active) return;
    let moving = false;
    const advance = (from: number, to: number) => {
      const next = dampRail(from, to, delta, reduced); if (next !== to) moving = true; return next;
    };
    const motion = reduced ? rest : intent.current;
    root.current.rotation.y = advance(root.current.rotation.y, interactive ? gesture.pose.angle : angle + motion.x * .24 + (reduced ? 0 : intent.current.scroll * .42));
    root.current.rotation.x = advance(root.current.rotation.x, interactive ? 0 : motion.y * .09);
    camera.zoom = advance(camera.zoom, targetZoom.current * (interactive ? gesture.pose.zoom : zoom)); camera.updateProjectionMatrix();
    if (moving) invalidate();
  });
  return <>
    <ambientLight intensity={.2} /><hemisphereLight args={["#fffdf8", "#aaa193", .8]} />
    <directionalLight position={[-3, 5, 7]} intensity={2.3} castShadow shadow-mapSize={[1024,1024]}
      shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5}
      shadow-normalBias={.02} shadow-bias={-.0001} />
    <directionalLight position={[4, 2, -3]} intensity={.6} />
    <mesh position={[0, 0, -1.4]} receiveShadow><planeGeometry args={[18,14]} /><shadowMaterial opacity={detail ? .13 : .06} depthWrite={false} /></mesh>
    {environmentReady && active && <PrepareStudioPair key={requestKey} indices={indices} colorway={colorway} hangerStyle={hangerStyle} onPrepared={onPrepared} />}
    <group ref={entrance}><group ref={exchange}><group ref={root} position={interactive ? DETAIL_PIVOT : undefined}>
      <group position={interactive ? DETAIL_OFFSET : undefined}>{displayed?.indices.map((index, slot) =>
        <StudioGarment key={`${index}:${displayed.colorway}:${displayed.hangerStyle}`} index={index} slot={slot} detail={detail} reduced={reduced} colorway={displayed.colorway} hangerStyle={displayed.hangerStyle} swing={interactive ? swing : undefined} />)}
      </group>
    </group></group></group>
  </>;
}
export default memo(function StudioScene(props: Props) {
  return <SceneBoundary fallback={<StudioFallback {...props} />}><Canvas orthographic shadows="soft" frameloop={props.active ? "demand" : "never"} dpr={[1,1.5]}
    camera={{position:[0,.1,10],zoom:100,near:.1,far:30}} gl={{alpha:true,antialias:true}}
    role="img" aria-label={props.interactive ? `${products[props.indices[0]].name} แบบ 3D ลากซ้ายขวาเพื่อหมุน ใช้สองนิ้วเพื่อซูม หรือใช้ปุ่มปรับมุมดูเสื้อ` : props.detail ? `${products[props.indices[0]].name} แบบ 3D หมุนและขยายดูด้วยปุ่มด้านล่าง` : "เสื้อคอลเลกชัน 3D สองตัวในมุมมองสตูดิโอ"}
    >
    <GarmentAssetScope><Suspense fallback={null}><StudioStage {...props} /></Suspense></GarmentAssetScope>
  </Canvas></SceneBoundary>;
});
