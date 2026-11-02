import { useRef } from "react";
import { ArrowUp, ArrowUpRight, Asterisk } from "lucide-react";
import { modelCredits } from "../catalog/products";
import { useFooterMotion } from "./useFooterMotion";
import "./storeFooter.css";
const creators = [...new Map(modelCredits.map(credit => [credit.author, credit])).values()];

export function StoreFooter({ onAbout }: { onAbout: () => void }) {
  const root = useRef<HTMLElement>(null);
  useFooterMotion(root);
  return (
    <footer className="store-footer" id="footer" aria-label="ท้ายหน้า RACK" ref={root}>
      <div className="footer-main">
        <div className="footer-invitation">
          <h2>
            <span className="footer-title-mask"><span className="footer-title-line">A wardrobe,</span></span>{" "}
            <span className="footer-title-mask"><span className="footer-title-line">your way.</span></span>
          </h2>
          <p>เสื้อตัวโปรดตัวต่อไป อาจอยู่บนราวนี้</p>
        </div>
        <nav className="footer-navigation" aria-label="เมนูท้ายหน้า">
          <a href="#the-rack">
            <span>คอลเลกชัน</span>
            <span className="footer-link-icon" aria-hidden="true"><ArrowUpRight size={20} /></span>
          </a>
          <a href="#style-notes">
            <span>The edit</span>
            <span className="footer-link-icon" aria-hidden="true"><ArrowUpRight size={20} /></span>
          </a>
          <button type="button" onClick={onAbout}>
            <span>เกี่ยวกับต้นแบบ</span>
            <span className="footer-link-icon" aria-hidden="true"><ArrowUpRight size={20} /></span>
          </button>
        </nav>
      </div>
      <div className="footer-bottom">
        <div className="footer-signoff">
          <a className="footer-wordmark" href="#home" aria-label="RACK กลับด้านบน">
            RACK<Asterisk size={28} aria-hidden="true" />
          </a>
          <span>© {new Date().getFullYear()} RACK Studio</span>
        </div>
        <a className="back-top" href="#home">
          <span>กลับด้านบน</span>
          <span className="footer-link-icon" aria-hidden="true"><ArrowUp size={18} /></span>
        </a>
        <div className="footer-credits">
          <span className="footer-credits-label">โมเดล 3D</span>
          <ul className="footer-credit-list">
            {creators.map(model => <li key={model.source}>
              <a href={model.source} target="_blank" rel="noreferrer">{model.author}</a>
              <span aria-hidden="true">·</span>
              <a className="footer-license" href={model.license} target="_blank" rel="noreferrer" aria-label={`CC BY 4.0 — ${model.author}`}>CC BY 4.0</a>
            </li>)}
          </ul>
        </div>
      </div>
    </footer>
  );
}
