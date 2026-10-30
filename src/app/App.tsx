import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Asterisk,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  Minus,
  Plus,
  RotateCcw,
  ShoppingBag,
  X,
} from "lucide-react";
import { featuredProduct, modelCredits, products, sizes } from "../features/catalog/products";
import type { Size } from "../features/catalog/products";
import { Dialog } from "../shared/Dialog";
import { ProductThumbnail } from "../features/catalog/ProductThumbnail";
import { ColorwayPicker } from "../features/catalog/ColorwayPicker";
import { RackHeroHeading } from "../features/landing/RackHeroHeading";
import { StyleJournal } from "../features/landing/StyleJournal";
import { StoreFooter } from "../features/landing/StoreFooter";
import { StoreHeader } from "../features/landing/StoreHeader";
import { MenuProductPreview } from "../features/catalog/MenuProductPreview";
import { useHeroMotion } from "../shared/motion/useHeroMotion";
const Showroom = lazy(() => import("../features/showroom/Showroom"));
type BagItem = { id: string; size: Size; colorway: number; quantity: number };
const formatPrice = (price: number) =>
  new Intl.NumberFormat("th-TH").format(price);
const pad = (n: number) => String(n).padStart(2, "0");
export function App() {
  const [selected, setSelected] = useState<number | null>(null),
    [front, setFront] = useState<number | null>(featuredProduct),
    [colorways, setColorways] = useState(() => products.map(() => 0)),
    [size, setSize] = useState<Size>("M");
  const [angle, setAngle] = useState(0),
    [ready, setReady] = useState(false),
    [saved, setSaved] = useState<string[]>([]),
    [bag, setBag] = useState<BagItem[]>([]);
  const [panel, setPanel] = useState<"bag" | "about" | "saved" | null>(null),
    [toast, setToast] = useState(""),
    [reduced, setReduced] = useState(false),
    [scale, setScale] = useState({ unit: 80, railY: 120 });
  const [menuPreview, setMenuPreview] = useState<{ index: number; colorway: number } | null>(null);
  const openPanel = (next: "bag" | "about" | "saved") => { setMenuPreview(null); setPanel(next); };
  const [rackVisible, setRackVisible] = useState(false);
  const [exploreRequest, setExploreRequest] = useState<number | null>(null);
  const [sceneAvailable, setSceneAvailable] = useState(true);
  const onSceneUnavailable = useCallback(() => setSceneAvailable(false), []);
  const rackSection = useRef<HTMLElement>(null);
  const storefront = useRef<HTMLElement>(null);
  useHeroMotion(storefront, ready);
  const pointer = useRef<{ x: number; angle: number } | null>(null);
  const current = selected ?? front ?? 0,
    product = products[current],
    way = product.colorways[colorways[current]],
    count = bag.reduce((sum, i) => sum + i.quantity, 0);
  const bagPreviewItem = bag.find(item => menuPreview && item.id === products[menuPreview.index].id && item.colorway === menuPreview.colorway) ?? bag[0];
  const bagPreviewIndex = bagPreviewItem ? products.findIndex(p => p.id === bagPreviewItem.id) : current;
  const savedPreviewIndex = menuPreview && saved.includes(products[menuPreview.index].id) ? menuPreview.index : saved.length ? Math.max(0, products.findIndex(p => saved.includes(p.id))) : current;
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timeout);
  }, [toast]);
  const onReady = useCallback(() => setReady(true), []);
  const onBrowse = useCallback((index: number) => setFront(index), []);
  useEffect(() => {
    if (!rackSection.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRackVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "350px" },
    );
    observer.observe(rackSection.current);
    return () => observer.disconnect();
  }, []);
  const onScale = useCallback(
    (unit: number, railY: number) => setScale(previous => previous.unit === unit && previous.railY === railY ? previous : { unit, railY }),
    [],
  );
  const choose = useCallback((index: number) => {
    setFront(index);
    setSelected(index);
    setAngle(0);
    document.body.style.cursor = "";
  }, []);
  const backToRack = useCallback(() => {
    setSelected(null);
    setAngle(0);
  }, []);
  useEffect(() => {
    if (exploreRequest === null || panel !== null) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById("the-rack")?.scrollIntoView({ behavior: reduced ? "instant" : "smooth" });
      setExploreRequest(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [exploreRequest, panel, reduced]);
  const explore = useCallback((index?: number) => {
    if (index !== undefined) choose(index);
    else backToRack();
    // Let a closing dialog restore focus and unlock the page before scrolling.
    setExploreRequest(previous => (previous ?? 0) + 1);
  }, [choose, backToRack]);
  const step = (direction: number) => {
    const next =
      ((front ?? (direction > 0 ? -1 : 0)) + direction + products.length) %
      products.length;
    if (selected === null) setFront(next);
    else choose(next);
  };
  const toggleSaved = (id: string) =>
    setSaved((list) =>
      list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
    );
  const addToBag = () => {
    const colorway = colorways[current];
    setBag((list) => {
      const existing = list.find(
        (i) =>
          i.id === product.id && i.size === size && i.colorway === colorway,
      );
      return existing
        ? list.map((i) =>
            i === existing ? { ...i, quantity: i.quantity + 1 } : i,
          )
        : [...list, { id: product.id, size, colorway, quantity: 1 }];
    });
    setToast("เพิ่ม " + product.name + " ไซซ์ " + size + " ลงถุงแล้ว");
  };
  const changeQuantity = (item: BagItem, delta: number) =>
    setBag((list) =>
      list
        .map((i) => (i === item ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0),
    );
  return (
    <main className="storefront" id="home" ref={storefront}>
      <StoreHeader count={products.length} savedCount={saved.length} bagCount={count} onExplore={() => explore()} onSaved={() => openPanel("saved")} onBag={() => openPanel("bag")} />
      <h1 className="visually-hidden">
        RACK — Find your next favorite. ราวเสื้อที่เลือกสไตล์ได้ด้วยตัวคุณ
      </h1>
      <section
        className={
          "rack-section rack-hero" + (selected !== null ? " has-selection" : "")
        }
        id="the-rack"
        ref={rackSection}
        aria-label="ราวเสื้อ RACK"
      >
        <RackHeroHeading count={products.length} featureName={products[featuredProduct].name} onFeature={() => explore(featuredProduct)} />
        <section
          aria-label="ราวเลือกสินค้า"
          className={"showroom " + (selected !== null ? "is-focused" : "")}
          style={
            {
              "--unit": scale.unit + "px",
              "--rail-y": scale.railY + "px",
            } as React.CSSProperties
          }
          onKeyDown={(e) => {
            if (e.key === "Escape" && selected !== null) backToRack();
          }}
          onPointerDown={(e) => {
            if (selected === null || !sceneAvailable || e.button !== 0) return;
            pointer.current = { x: e.clientX, angle };
          }}
          onPointerMove={(e) => {
            if (pointer.current && selected !== null)
              setAngle(
                pointer.current.angle + (e.clientX - pointer.current.x) * 0.012,
              );
          }}
          onPointerUp={() => (pointer.current = null)}
          onPointerCancel={() => (pointer.current = null)}
          onPointerLeave={() => (pointer.current = null)}
        >
          <div className="scene">
            {rackVisible && (
              <Suspense fallback={null}>
                <Showroom
                  selected={selected}
                  front={front}
                  colorways={colorways}
                  angle={angle}
                  onSelect={choose}
                  onBrowse={onBrowse}
                  onReady={onReady}
                  onUnavailable={onSceneUnavailable}
                  onScale={onScale}
                  reduced={reduced}
                />
              </Suspense>
            )}
          </div>
          {!ready && (
            <div className="scene-loading" role="status">
              <span />
              กำลังแขวนเสื้อ…
            </div>
          )}
          {selected === null ? (
            <div className="browse-bar">
              <p className="hint">
                {front === null
                  ? "ชี้ที่เสื้อบนราวเพื่อหยิบออกมาดู · แตะเพื่อดูใกล้ ๆ"
                  : product.name + " — " + way.colorName}
              </p>
              <div className="rack-picker" role="group" aria-label="เลือกเสื้อบนราว">
                <button
                  className="rack-browse-nav"
                  aria-label="เสื้อตัวก่อนหน้า"
                  onClick={() => step(-1)}
                >
                  <ChevronLeft size={18} aria-hidden="true" />
                </button>
                <button
                  className="rack-browse-open"
                  aria-label={front === null ? "ดูเสื้อทีละตัว" : `ดู ${product.name} (${current + 1} จาก ${products.length})`}
                  onClick={() => choose(current)}
                  disabled={!ready}
                >
                  {front !== null && <span className="rack-browse-count" aria-hidden="true">
                    <span>{pad(current + 1)}</span><span>/ {pad(products.length)}</span>
                  </span>}
                  <span>{front === null ? "ดูทีละตัว" : "ดูตัวนี้"}</span>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </button>
                <button
                  className="rack-browse-nav"
                  aria-label="เสื้อตัวถัดไป"
                  onClick={() => step(1)}
                >
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <button className="back-to-rack" onClick={backToRack}>
                <ArrowLeft size={14} /> กลับไปที่ราว
              </button>
              <ColorwayPicker product={product} value={colorways[current]}
                onChange={index => setColorways(list => list.map((colorway, i) => i === current ? index : colorway))} />
              <div className="product-detail" aria-live="polite">
                <h2>{product.name}</h2>
                <p>
                  {way.colorName} · ฿{formatPrice(product.price)}
                </p>
                <span className="product-media-note">ราคาตัวอย่าง</span>
                <div className="detail-actions">
                  <div className="size-selection" aria-label="เลือกไซซ์">
                    {sizes.map((s) => (
                      <button
                        key={s}
                        aria-pressed={size === s}
                        onClick={() => setSize(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <button className="pill-button dark" onClick={addToBag}>
                    เพิ่มลงถุง <Plus size={14} />
                  </button>
                </div>
                <div className="detail-tools">
                  <button
                    className="round-arrow"
                    aria-label="เสื้อตัวก่อนหน้า"
                    onClick={() => step(-1)}
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    className="icon-button"
                    aria-label="หมุนเสื้อ 180 องศา"
                    disabled={!sceneAvailable}
                    title="หมุนเสื้อ 180 องศา"
                    onClick={() => setAngle((a) => a + Math.PI)}
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    className={
                      "icon-button " +
                      (saved.includes(product.id) ? "is-saved" : "")
                    }
                    aria-label={
                      saved.includes(product.id)
                        ? "เอาออกจากรายการโปรด"
                        : "เก็บเป็นรายการโปรด"
                    }
                    aria-pressed={saved.includes(product.id)}
                    onClick={() => toggleSaved(product.id)}
                  >
                    <Heart
                      size={16}
                      fill={
                        saved.includes(product.id) ? "currentColor" : "none"
                      }
                    />
                  </button>
                  <button
                    className="round-arrow"
                    aria-label="เสื้อตัวถัดไป"
                    onClick={() => step(1)}
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </section>
      <div className="brand-ribbon" aria-hidden="true">
        <Asterisk /><span>OFF THE RACK.</span><Asterisk /><span>INTO YOUR ROTATION.</span><Asterisk /><span>WEAR IT YOUR WAY.</span><Asterisk />
      </div>
      <StyleJournal onExplore={explore} reduced={reduced} />
      <StoreFooter onAbout={() => openPanel("about")} />
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
        </div>
      )}
      {panel === "about" && (
        <Dialog
          title="A different kind of rack."
          onClose={() => setPanel(null)}
        >
          <MenuProductPreview index={current} colorway={colorways[current]} reduced={reduced} />
          <p className="studio-copy">
            พื้นที่ลองเลือกเสื้อในจังหวะของคุณ<br />
            ชี้ที่เสื้อบนราวเพื่อหันมาดู แตะเพื่อดูใกล้ ๆ แล้วลากเพื่อหมุน
            เลื่อนลงไปเพื่อสำรวจอีกสไตล์ และดูรายละเอียดเสื้อจากหลายมุม
          </p>
          <div className="prototype-note">
            <Asterisk size={23} />
            <p>
              นี่คือหน้าร้านต้นแบบของ app-fashion-store ชื่อแบรนด์ ลายเสื้อ
              และราคาเป็นตัวอย่าง ยังไม่มีการรับคำสั่งซื้อหรือชำระเงินจริง
            </p>
          </div>
          {modelCredits.map(model => <p className="studio-copy" key={model.source}>
            โมเดล: <a href={model.source} target="_blank" rel="noreferrer">{model.title} โดย {model.author}</a>{" "}
            ภายใต้ <a href={model.license} target="_blank" rel="noreferrer">CC BY 4.0</a>
            {" "}แยกสินค้าและปรับขนาดกับจุดแขวนสำหรับต้นแบบนี้
          </p>)}
          <button
            className="pill-button dark full-width"
            onClick={() => {
              setPanel(null);
              explore();
            }}
          >
            กลับไปเลือกเสื้อ <ArrowRight size={16} />
          </button>
        </Dialog>
      )}
      {panel === "saved" && (
        <Dialog title="Your favorites." onClose={() => setPanel(null)}>
          <MenuProductPreview index={savedPreviewIndex} colorway={colorways[savedPreviewIndex]} reduced={reduced} />
          {saved.length === 0 ? (
            <div className="empty-state">
              <Heart size={32} />
              <h3>เก็บตัวที่ชอบไว้ก่อนได้</h3>
              <p>หยิบเสื้อจากราว แล้วแตะหัวใจเพื่อกลับมาดูอีกครั้ง</p>
              <button
                className="pill-button dark"
                onClick={() => {
                  setPanel(null);
                  explore(current);
                }}
              >
                ไปที่ราว <ArrowUpRight size={16} />
              </button>
            </div>
          ) : (
            <div className="bag-list">
              {products
                .filter((p) => saved.includes(p.id))
                .map((p) => (
                  <div className="bag-item" key={p.id} onPointerEnter={() => setMenuPreview({ index: products.indexOf(p), colorway: colorways[products.indexOf(p)] })} onFocusCapture={() => setMenuPreview({ index: products.indexOf(p), colorway: colorways[products.indexOf(p)] })}>
                    <ProductThumbnail
                      product={p}
                      colorway={p.colorways[colorways[products.indexOf(p)]]}
                    />
                    <button
                      className="saved-item-name"
                      onClick={() => {
                        setPanel(null);
                        explore(products.indexOf(p));
                      }}
                    >
                      <strong>{p.name}</strong>
                      <span>
                        {p.colorways[colorways[products.indexOf(p)]].colorName}
                      </span>
                    </button>
                    <button
                      className="icon-button"
                      aria-label={"นำ " + p.name + " ออกจากรายการโปรด"}
                      onClick={() => toggleSaved(p.id)}
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </Dialog>
      )}
      {panel === "bag" && (
        <Dialog
          title={"In your bag. (" + count + ")"}
          onClose={() => setPanel(null)}
        >
          <MenuProductPreview index={bagPreviewIndex} colorway={bagPreviewItem?.colorway ?? colorways[current]} reduced={reduced} />
          {bag.length === 0 ? (
            <div className="empty-state">
              <ShoppingBag size={33} />
              <h3>ถุงยังว่าง ราวยังรอ</h3>
              <p>หยิบเสื้อที่ชอบ เลือกไซซ์ แล้วเพิ่มลงถุงได้เลย</p>
              <button
                className="pill-button dark"
                onClick={() => {
                  setPanel(null);
                  explore(current);
                }}
              >
                เลือกเสื้อตัวแรก <ArrowUpRight size={16} />
              </button>
            </div>
          ) : (
            <>
              <div className="bag-list">
                {bag.map((item) => {
                  const p = products.find((p) => p.id === item.id)!,
                    c = p.colorways[item.colorway];
                  return (
                    <div
                      className="bag-item"
                      key={item.id + item.size + item.colorway}
                      onPointerEnter={() => setMenuPreview({ index: products.indexOf(p), colorway: item.colorway })}
                      onFocusCapture={() => setMenuPreview({ index: products.indexOf(p), colorway: item.colorway })}
                    >
                      <ProductThumbnail product={p} colorway={c} />
                      <div className="bag-item-info">
                        <strong>{p.name}</strong>
                        <span>
                          ไซซ์ {item.size} · {c.colorName}
                        </span>
                        <div className="quantity-control">
                          <button
                            aria-label={
                              "ลดจำนวน " + p.name + " ไซซ์ " + item.size
                            }
                            onClick={() => changeQuantity(item, -1)}
                          >
                            <Minus size={13} />
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            aria-label={
                              "เพิ่มจำนวน " + p.name + " ไซซ์ " + item.size
                            }
                            onClick={() => changeQuantity(item, 1)}
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                      <strong className="item-price">
                        ฿{formatPrice(p.price * item.quantity)}
                      </strong>
                    </div>
                  );
                })}
              </div>
              <div className="bag-total">
                <span>รวมราคาตัวอย่าง</span>
                <strong>
                  ฿
                  {formatPrice(
                    bag.reduce(
                      (sum, item) =>
                        sum +
                        products.find((p) => p.id === item.id)!.price *
                          item.quantity,
                      0,
                    ),
                  )}
                </strong>
              </div>
              <p className="bag-notice">
                ถุงนี้เป็นตัวอย่างการเลือกสินค้า
                ยังไม่มีการสั่งซื้อหรือชำระเงินจริง
              </p>
              <button
                className="pill-button dark full-width"
                onClick={() => {
                  setPanel(null);
                  explore();
                }}
              >
                เลือกเสื้อต่อ <ArrowRight size={16} />
              </button>
            </>
          )}
        </Dialog>
      )}
    </main>
  );
}
