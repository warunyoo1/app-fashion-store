import { ArrowDown, ArrowUpRight } from "lucide-react";
export function RackHeroHeading({
  count,
  featureName,
  onFeature,
}: {
  count: number;
  featureName: string;
  onFeature: () => void;
}) {
  return (
    <div className="rack-heading">
      <div className="rack-caption">
        <p className="rack-title">Everyday, reimagined.</p>
        <p>เส้นสายเรียบง่าย สไตล์ในแบบคุณ</p>
      </div>
      <div className="rack-meta">
        <span>{String(count).padStart(2, "0")} styles on the rack</span>
        <span>คอลเลกชันและราคาตัวอย่าง</span>
        <button className="text-link" onClick={onFeature}>
          ดู {featureName} <ArrowUpRight size={15} />
        </button>
      </div>
      <a className="rack-scroll-link" href="#style-notes">
        <ArrowDown size={14} /> ค้นพบอีกสไตล์ของคุณ
      </a>
    </div>
  );
}
