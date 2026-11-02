import { useRef } from "react";
import { ArrowUp, ArrowUpRight, Asterisk } from "lucide-react";
import { modelCredits } from "../catalog/products";
import { useFooterMotion } from "./useFooterMotion";
import { ScrollHeading } from "../../shared/motion/ScrollHeading";
import "./storeFooter.css";
const creators = [...new Map(modelCredits.map(credit => [credit.author, credit])).values()];
const sharedLicense = creators.length && creators.every(credit => credit.license === creators[0].license)
  ? creators[0].license : null;

export function StoreFooter({ onAbout }: { onAbout: () => void }) {
  const root = useRef<HTMLElement>(null);
  useFooterMotion(root);
  return (
    <footer className="store-footer" id="footer" aria-label="ท้ายหน้า RACK" ref={root}>
      <div className="footer-main">
        <div className="footer-invitation">
          <ScrollHeading lines={["A wardrobe,", "your way."]} />
          <p data-scroll-copy>เสื้อตัวโปรดตัวต่อไป อาจอยู่บนราวนี้</p>
        </div>
        <nav className="footer-navigation" aria-label="เมนูท้ายหน้า">
          <a href="#the-rack">
            <span>คอลเลกชัน</span>
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
          <a href="#style-notes">
            <span>The edit</span>
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
          <button type="button" onClick={onAbout}>
            <span>เกี่ยวกับต้นแบบ</span>
            <ArrowUpRight size={18} aria-hidden="true" />
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
          <ul className="footer-credit-list" aria-label="ผู้สร้างโมเดล 3D">
            {creators.map(model => <li key={model.source}>
              <a href={model.source} target="_blank" rel="noreferrer">{model.author}</a>
              {!sharedLicense && <a className="footer-license" href={model.license} target="_blank" rel="noreferrer" aria-label={`CC BY 4.0 — ${model.author}`}>CC BY 4.0</a>}
            </li>)}
          </ul>
          {sharedLicense && <a className="footer-license" href={sharedLicense} target="_blank" rel="noreferrer" aria-label="สิทธิ์ใช้งานโมเดลทั้งหมด CC BY 4.0">CC BY 4.0</a>}
        </div>
      </div>
    </footer>
  );
}
