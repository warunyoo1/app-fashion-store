import { lazy, memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, MoveHorizontal, MoveUpRight } from "lucide-react";
import { featuredProduct, products } from "../catalog/products";
import { DetailProductPicker } from "../catalog/DetailProductPicker";
import { useCollectionMotion } from "./useCollectionMotion";
import { ScrollHeading } from "../../shared/motion/ScrollHeading";
import { DetailViewControls } from "./DetailViewControls";
import type { StudioInteractionProps } from "../showroom/useStudioInteraction";

const StudioScene = lazy(() => import("../showroom/StudioScene"));
const edits = [
  { name: "Essentials", title: "An everyday foundation.", indices: [0, 10], description: "เสื้อทรงสบายในโทนสีที่หยิบมาจับคู่ได้ง่าย" },
  { name: "Soft layers", title: "Room to move.", indices: [2, 9], description: "เลเยอร์สบาย ๆ กับสี Navy และ Washed ink" },
  { name: "Outerwear", title: "The finishing layer.", indices: [6, 7], description: "เติมรูปทรงด้วยแจ็กเก็ตโทน Forest grey และ Ecru" },
];
function SceneSlot({ indices, detail = false, angle = 0, zoom = 1, reduced, onUnavailable, hint = false,
  onAngleChange, onZoomChange, onInteracted }: StudioInteractionProps & {
  indices: number[]; detail?: boolean; angle?: number; zoom?: number; reduced: boolean; onUnavailable?: () => void; hint?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false), [active, setActive] = useState(false), [readyKey, setReadyKey] = useState("");
  const hangerStyle = detail && products[indices[0]].id === "western-shirt" ? "metal" : "wood";
  const requestKey = `${indices.join(":")}:${hangerStyle}`;
  const ready = readyKey === requestKey;
  const onReady = useCallback(() => setReadyKey(requestKey), [requestKey]);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setActive(entry.isIntersecting);
      if (entry.isIntersecting) setLoaded(true);
    });
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  return <div className={"studio-scene-slot " + (detail ? "detail-scene-slot" : "")} ref={container} aria-busy={!ready}>
    {loaded && <div className="studio-renderer"><Suspense fallback={null}>
      <StudioScene indices={indices} detail={detail} angle={angle} zoom={zoom} reduced={reduced} active={active} hangerStyle={hangerStyle} onReady={onReady} onUnavailable={onUnavailable}
        interactive={detail && !!onAngleChange && !!onZoomChange} onAngleChange={onAngleChange} onZoomChange={onZoomChange} onInteracted={onInteracted} />
    </Suspense></div>}
    {!ready && <div className={"studio-scene-loading" + (readyKey ? " is-switching" : "")} role="status">กำลังจัดเสื้อให้คุณ…</div>}
    {ready && hint && <div className="studio-gesture-hint" aria-hidden="true"><MoveHorizontal size={16} /><span>ลากซ้ายขวาเพื่อหมุน<span className="studio-touch-hint"> · สองนิ้วเพื่อซูม</span></span></div>}
  </div>;
}
export const StyleJournal = memo(function StyleJournal({ onExplore, reduced }: {
  onExplore: (index?: number) => void; reduced: boolean;
}) {
  const [editIndex, setEditIndex] = useState(0), [angle, setAngle] = useState(0), [zoom, setZoom] = useState(1);
  const [detailUnavailable, setDetailUnavailable] = useState(false);
  const [detailInteracted, setDetailInteracted] = useState(false);
  const [detailIndex, setDetailIndex] = useState(featuredProduct);
  const collection = useRef<HTMLElement>(null);
  useCollectionMotion(collection, editIndex, reduced);
  const onDetailUnavailable = useCallback(() => setDetailUnavailable(true), []);
  const onDetailInteracted = useCallback(() => setDetailInteracted(true), []);
  const edit = edits[editIndex];
  const detailProduct = products[detailIndex];
  const detailIndices = useMemo(() => [detailIndex], [detailIndex]);
  const viewControls = { angle, zoom, disabled: detailUnavailable,
    onZoom: (value: number) => { setZoom(value); onDetailInteracted(); },
    onRotate: () => { setAngle(angle => angle + Math.PI / 4); onDetailInteracted(); } };
  const changeDetailProduct = (index: number) => {
    setDetailIndex(index);
    setAngle(0);
    setZoom(1);
  };
  return <>
    <section className="spatial-edit" id="style-notes" aria-labelledby="edit-heading" ref={collection}>
      <div className="edit-copy">
        <div className="edit-intro">
          <ScrollHeading id="edit-heading" lines={["Less noise.", "More you."]} words />
          <p data-scroll-copy>สีเรียบ รูปทรงชัด รายละเอียดที่พอดี<br />จัดเลเยอร์ในจังหวะของคุณ</p>
        </div>
        <div className="edit-selector">
          <div className="edit-tabs" role="tablist" aria-label="เลือกสไตล์คอลเลกชัน">
            {edits.map((item, i) => <button key={item.name} role="tab" aria-selected={editIndex === i} tabIndex={editIndex === i ? 0 : -1}
              aria-controls="edit-stage" id={`edit-tab-${i}`} onClick={() => setEditIndex(i)}
              onKeyDown={e => {
                const next = e.key === "ArrowRight" ? (i + 1) % edits.length : e.key === "ArrowLeft" ? (i + edits.length - 1) % edits.length : e.key === "Home" ? 0 : e.key === "End" ? edits.length - 1 : null;
                if (next === null) return;
                e.preventDefault(); setEditIndex(next);
                document.getElementById(`edit-tab-${next}`)?.focus();
              }}>{item.name}</button>)}
            <span className="edit-tab-marker" aria-hidden="true" />
          </div>
          <div aria-live="polite">
            <div className="edit-story" key={editIndex}>
              <div className="edit-description"><h3>{edit.title}</h3><p>{edit.description}</p></div>
              <button className="text-link edit-cta" onClick={() => onExplore(edit.indices[0])}>หยิบตัวนี้จากราว <ArrowUpRight size={17} /></button>
            </div>
          </div>
        </div>
      </div>
      <div className="edit-artboard" role="tabpanel" id="edit-stage" aria-labelledby={`edit-tab-${editIndex}`}>
        <SceneSlot indices={edit.indices} reduced={reduced} />
        <div className="edit-artboard-caption"><span>{edit.name}</span><span><MoveUpRight size={13} /> ขยับเมาส์เพื่อเปลี่ยนมุม</span></div>
      </div>
    </section>
    <section className="spatial-detail" id="our-studio" aria-labelledby="detail-heading">
      <div className="detail-artboard">
        <SceneSlot indices={detailIndices} detail angle={angle} zoom={zoom} reduced={reduced} onUnavailable={onDetailUnavailable}
          hint={!detailInteracted && !detailUnavailable} onAngleChange={setAngle} onZoomChange={setZoom} onInteracted={onDetailInteracted} />
        <DetailViewControls placement="below" {...viewControls} />
      </div>
      <div className="detail-copy">
        <ScrollHeading id="detail-heading" lines={["Made for", "a closer look."]} />
        <p data-scroll-copy>ลองหมุน แล้วมองให้ใกล้<br />ตั้งแต่ลายเสื้อ ถึงรูปทรงในอีกมุม</p>
        <div className="detail-controls">
          <DetailProductPicker value={detailIndex} onChange={changeDetailProduct} />
          <DetailViewControls placement="inline" {...viewControls} />
          <button className="text-link detail-cta" onClick={() => onExplore(detailIndex)}>ดูไซซ์และรายละเอียด <ArrowUpRight size={17} /></button>
        </div>
        <p className="detail-sample-note" aria-live="polite">{detailProduct.name}<br /><span>{detailProduct.model ? `โมเดลเสื้อตัวอย่างโดย ${detailProduct.model.author}` : detailProduct.photographs ? "ภาพสินค้าตัวอย่างบนทรง 3D จำลอง" : "ดีไซน์เสื้อและทรง 3D ตัวอย่าง"}</span></p>
      </div>
    </section>
  </>;
});
