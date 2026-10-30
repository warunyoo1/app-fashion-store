import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Rotate3d } from "lucide-react";
import { products } from "./products";

const StudioScene = lazy(() => import("../showroom/StudioScene"));

export function MenuProductPreview({ index, colorway = 0, reduced }: { index: number; colorway?: number; reduced: boolean }) {
  const frame = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false), [readyKey, setReadyKey] = useState(""), [available, setAvailable] = useState(true);
  const [view, setView] = useState({ index, angle: 0, zoom: 1 });
  const angle = view.index === index ? view.angle : 0, zoom = view.index === index ? view.zoom : 1;
  const indices = useMemo(() => [index], [index]);
  const requestKey = `${index}:${colorway}`;
  const ready = readyKey === requestKey;
  const onReady = useCallback(() => setReadyKey(requestKey), [requestKey]);
  const onUnavailable = useCallback(() => setAvailable(false), []);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting));
    if (frame.current) observer.observe(frame.current);
    return () => observer.disconnect();
  }, []);
  return <section className="menu-product-preview" aria-label={`พรีวิว ${products[index].name}`}>
    <div className="menu-preview-stage" ref={frame} aria-busy={!ready}>
      <span className="menu-preview-orbit" aria-hidden="true" />
      <Suspense fallback={null}>
        <StudioScene indices={indices} colorway={colorway} detail angle={angle} zoom={zoom} reduced={reduced} active={active} onReady={onReady} onUnavailable={onUnavailable} />
      </Suspense>
      {!ready && <span className="menu-preview-loading" role="status">กำลังจัดเสื้อให้คุณ…</span>}
    </div>
    <div className="menu-preview-caption"><strong>{products[index].name}</strong><span>{products[index].colorways[colorway].colorName}</span></div>
    <div className="menu-preview-controls">
      <button disabled={!available} aria-label="หมุนเสื้อในเมนู 45 องศา" onClick={() => setView({ index, angle: angle + Math.PI / 4, zoom })}><Rotate3d size={17} />หมุนดู</button>
      <label>มองใกล้<input disabled={!available} aria-label="ขยายเสื้อในเมนู" type="range" min="1" max="1.35" step=".01" value={zoom} onChange={event => setView({ index, angle, zoom: Number(event.target.value) })} /></label>
    </div>
  </section>;
}
