import { RotateCcw } from "lucide-react";

export function DetailViewControls({ placement, angle, zoom, disabled, onRotate, onZoom }: {
  placement: "inline" | "below";
  angle: number;
  zoom: number;
  disabled: boolean;
  onRotate: () => void;
  onZoom: (zoom: number) => void;
}) {
  return <div className={`detail-view-controls detail-view-controls--${placement}`} role="group" aria-label="ปรับมุมดูเสื้อ">
    <button disabled={disabled} aria-label="หมุนเสื้อตัวอย่าง 45 องศา" aria-description={`มุมปัจจุบัน ${((Math.round(angle * 180 / Math.PI) % 360) + 360) % 360} องศา`} onClick={onRotate}>
      <RotateCcw size={16} aria-hidden="true" /><span>หมุนดู</span>
    </button>
    <label>มองใกล้
      <input disabled={disabled} type="range" min="1" max="1.65" step=".01" value={zoom}
        aria-valuetext={`${Number(zoom.toFixed(2))} เท่า`} onChange={event => onZoom(Number(event.target.value))} />
      <output>{Number(zoom.toFixed(2))}×</output>
    </label>
  </div>;
}
