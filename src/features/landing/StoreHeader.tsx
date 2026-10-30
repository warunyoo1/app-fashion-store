import { useEffect, useId, useRef, useState } from "react";
import { ArrowUpRight, Asterisk, Heart, Layers3, Menu, Rotate3d, Shirt, ShoppingBag } from "lucide-react";
import "./storeHeader.css";

type Section = "the-rack" | "style-notes" | "our-studio";

export function StoreHeader({ count, savedCount, bagCount, onExplore, onSaved, onBag }: {
  count: number; savedCount: number; bagCount: number;
  onExplore: () => void; onSaved: () => void; onBag: () => void;
}) {
  const [active, setActive] = useState<Section>("the-rack");
  const popoverId = useId();
  const mobileNav = useRef<HTMLElement>(null);
  const closeNavigation = () => {
    if (mobileNav.current?.matches(":popover-open")) mobileNav.current.hidePopover();
  };
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id as Section);
    }, { rootMargin: "-20% 0px -60% 0px" });
    ["the-rack", "style-notes", "our-studio"].forEach(id => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    const desktop = matchMedia("(min-width: 741px)");
    const onResize = () => { if (desktop.matches) closeNavigation(); };
    desktop.addEventListener("change", onResize);
    return () => { observer.disconnect(); desktop.removeEventListener("change", onResize); };
  }, []);
  const explore = () => { closeNavigation(); setActive("the-rack"); onExplore(); };
  return <header className="site-header">
    <a className="wordmark" href="#home" aria-label="RACK หน้าร้าน"><span>RACK</span><Asterisk aria-hidden size={23} strokeWidth={3} /></a>
    <nav className="header-links" aria-label="เมนูหลัก" data-active={active}>
      <button aria-current={active === "the-rack" ? "location" : undefined} onClick={explore}>
        คอลเลกชัน <sup>{String(count).padStart(2, "0")}</sup>
      </button>
      <a href="#style-notes" onClick={() => setActive("style-notes")} aria-current={active === "style-notes" ? "location" : undefined}>The edit</a>
      <a href="#our-studio" onClick={() => setActive("our-studio")} aria-current={active === "our-studio" ? "location" : undefined}>A closer look</a>
    </nav>
    <nav className="mobile-navigation" id={popoverId} popover="auto" ref={mobileNav} aria-label="เมนูหลักบนมือถือ">
      <button onClick={explore} aria-current={active === "the-rack" ? "location" : undefined}><Shirt size={20} /><span>คอลเลกชัน</span><ArrowUpRight size={17} /></button>
      <a href="#style-notes" onClick={closeNavigation} aria-current={active === "style-notes" ? "location" : undefined}><Layers3 size={20} /><span>The edit</span><ArrowUpRight size={17} /></a>
      <a href="#our-studio" onClick={closeNavigation} aria-current={active === "our-studio" ? "location" : undefined}><Rotate3d size={20} /><span>A closer look</span><ArrowUpRight size={17} /></a>
    </nav>
    <div className="header-actions">
      <button className="mobile-menu-trigger" popoverTarget={popoverId} aria-label="เปิดเมนูหลัก"><Menu size={20} /></button>
      <button className="icon-button" aria-label={`รายการโปรด ${savedCount} รายการ`} onClick={onSaved}>
        <Heart size={18} />{savedCount > 0 && <span className="count-dot">{savedCount}</span>}
      </button>
      <button className="icon-button" aria-label={`ถุงของคุณ ${bagCount} ชิ้น`} onClick={onBag}>
        <ShoppingBag size={18} />{bagCount > 0 && <span className="count-dot">{bagCount}</span>}
      </button>
    </div>
  </header>;
}
