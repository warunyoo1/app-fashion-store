import { Check } from "lucide-react";
import type { CSSProperties } from "react";
import type { Product } from "./products";
import "./colorwayPicker.css";

export function ColorwayPicker({ product, value, onChange }: {
  product: Product;
  value: number;
  onChange: (index: number) => void;
}) {
  return (
    <fieldset className="colorway-picker" onPointerDown={event => event.stopPropagation()}>
      <legend>สีเสื้อ <span>{product.colorways.length} สี</span></legend>
      <div className="colorway-options">
        {product.colorways.map((colorway, index) => (
          <label className="colorway-option" key={colorway.colorName} title={colorway.colorName}>
            <input className="visually-hidden" type="radio" name={`colorway-${product.id}`}
              value={index} checked={value === index} onChange={() => onChange(index)} />
            <span className="colorway-swatch" aria-hidden="true" style={{
              "--colorway-base": colorway.color,
              "--colorway-accent": colorway.accent,
            } as CSSProperties}>
              <span className="colorway-check"><Check size={10} strokeWidth={3} /></span>
            </span>
            <span className="visually-hidden">{colorway.colorName}</span>
          </label>
        ))}
      </div>
      <p className="colorway-name" aria-live="polite">{product.colorways[value].colorName}</p>
    </fieldset>
  );
}
