import { lazy, memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, MoveUpRight, RotateCcw } from "lucide-react";
import { featuredProduct, products } from "../catalog/products";
import { DetailProductPicker } from "../catalog/DetailProductPicker";
import { useCollectionMotion } from "./useCollectionMotion";

const StudioScene = lazy(() => import("../showroom/StudioScene"));
const edits = [
  { name: "Everyday", title: "Easy does it.", indices: [0, 10], description: "เริ่มจากตัวที่ใส่ง่าย แล้วใส่ความเป็นคุณลงไป" },
  { name: "Graphic play", title: "Play your way.", indices: [2, 8], description: "สนุกกับลายกราฟิกและสีสันในมุมใหม่" },
  { name: "Off duty", title: "Out of office.", indices: [6, 7], description: "เติมอีกเลเยอร์ให้วันสบาย ๆ ในจังหวะที่เป็นคุณ" },
];
function SceneSlot({ indices, detail = false, angle = 0, zoom = 1, reduced, onUnavailable }: {
  indices: number[]; detail?: boolean; angle?: number; zoom?: number; reduced: boolean; onUnavailable?: () => void;
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
    {loaded && <Suspense fallback={null}>
      <StudioScene indices={indices} detail={detail} angle={angle} zoom={zoom} reduced={reduced} active={active} hangerStyle={hangerStyle} onReady={onReady} onUnavailable={onUnavailable} />
    </Suspense>}
    {!ready && <div className={"studio-scene-loading" + (readyKey ? " is-switching" : "")} role="status">กำลังจัดเสื้อให้คุณ…</div>}
  </div>;
}
export const StyleJournal = memo(function StyleJournal({ onExplore, reduced }: {
  onExplore: (index?: number) => void; reduced: boolean;
}) {
  const [editIndex, setEditIndex] = useState(0), [angle, setAngle] = useState(0), [zoom, setZoom] = useState(1);
  const [detailUnavailable, setDetailUnavailable] = useState(false);
  const [detailIndex, setDetailIndex] = useState(featuredProduct);
  const collection = useRef<HTMLElement>(null);
  useCollectionMotion(collection, editIndex, reduced);
  const onDetailUnavailable = useCallback(() => setDetailUnavailable(true), []);
  const edit = edits[editIndex];
  const detailProduct = products[detailIndex];
  const detailIndices = useMemo(() => [detailIndex], [detailIndex]);
  const changeDetailProduct = (index: number) => {
    setDetailIndex(index);
    setAngle(0);
    setZoom(1);
  };
  return <>
    <section className="spatial-edit" id="style-notes" aria-labelledby="edit-heading" ref={collection}>
      <div className="edit-copy">
        <div className="edit-intro">
          <h2 id="edit-heading">
            <span className="edit-title-mask"><span className="edit-title-line">SAME RACK.</span></span>{" "}
            <span className="edit-title-mask"><span className="edit-title-line">NEW ENERGY.</span></span>
          </h2>
          <p>ตัวเดิม มุมใหม่<br />เจอสไตล์ที่เป็นคุณได้มากกว่าเดิม</p>
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
        <span className="edit-backdrop-word" aria-hidden="true">{editIndex === 0 ? "EASY" : editIndex === 1 ? "PLAY" : "OFF"}</span>
        <SceneSlot indices={edit.indices} reduced={reduced} />
        <div className="edit-artboard-caption"><span>Find a different side.</span><span><MoveUpRight size={13} /> ขยับเมาส์ หรือเลื่อนหน้าต่อ</span></div>
      </div>
    </section>
    <section className="spatial-detail" id="our-studio" aria-labelledby="detail-heading">
      <div className="detail-artboard">
        <span className="detail-backdrop-word" aria-hidden="true">CLOSER.</span>
        <SceneSlot indices={detailIndices} detail angle={angle} zoom={zoom} reduced={reduced} onUnavailable={onDetailUnavailable} />
        <div className="detail-view-controls" aria-label="ปรับมุมดูเสื้อ">
          <button disabled={detailUnavailable} aria-label="หมุนเสื้อตัวอย่าง 45 องศา" onClick={() => setAngle(a => a + Math.PI / 4)}><RotateCcw size={16} /><span>หมุนดู</span></button>
          <label>มองใกล้<input disabled={detailUnavailable} type="range" min="1" max="1.65" step=".01" value={zoom} aria-valuetext={`${Number(zoom.toFixed(2))} เท่า`} onChange={e => setZoom(Number(e.target.value))} /><output>{Number(zoom.toFixed(2))}×</output></label>
        </div>
      </div>
      <div className="detail-copy">
        <h2 id="detail-heading">GOOD FROM<br />EVERY ANGLE.</h2>
        <p>ลองหมุน แล้วมองให้ใกล้<br />ตั้งแต่ลายเสื้อ ถึงรูปทรงในอีกมุม</p>
        <DetailProductPicker value={detailIndex} onChange={changeDetailProduct} />
        <p className="detail-sample-note" aria-live="polite">{detailProduct.name}<br /><span>{detailProduct.model ? `โมเดลเสื้อตัวอย่างโดย ${detailProduct.model.author}` : detailProduct.photographs ? "ภาพสินค้าตัวอย่างบนทรง 3D จำลอง" : "ดีไซน์เสื้อและทรง 3D ตัวอย่าง"}</span></p>
        <button className="text-link detail-cta" onClick={() => onExplore(detailIndex)}>ดูไซซ์และรายละเอียด <ArrowUpRight size={17} /></button>
      </div>
    </section>
  </>;
});
