import { useId } from "react";
import * as Select from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { products } from "./products";
import { ProductThumbnail } from "./ProductThumbnail";
import "./detailProductPicker.css";

export function DetailProductPicker({ value, onChange }: {
  value: number;
  onChange: (index: number) => void;
}) {
  const id = useId();
  const product = products[value];
  return <div className="detail-product-picker">
    <label className="detail-product-label" htmlFor={id}>เปลี่ยนเสื้อที่ดู</label>
    <Select.Root value={String(value)} onValueChange={next => onChange(Number(next))}>
      <Select.Trigger id={id} className="detail-product-trigger detail-product-summary" aria-label="เปลี่ยนเสื้อที่ดู">
        <span className="detail-product-preview" aria-hidden="true">
          <ProductThumbnail product={product} colorway={product.colorways[0]} />
        </span>
        <span className="detail-product-copy">
          <strong><Select.Value>{product.name}</Select.Value></strong>
          <span aria-hidden="true">{product.category}</span>
        </span>
        <Select.Icon asChild><ChevronDown size={18} aria-hidden="true" /></Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="detail-product-menu" position="popper" align="start" sideOffset={12} collisionPadding={{ top: 96, right: 12, bottom: 12, left: 12 }}>
          <Select.ScrollUpButton className="detail-product-menu-scroll" aria-label="เลื่อนรายการขึ้น">
            <ChevronUp size={16} aria-hidden="true" />
          </Select.ScrollUpButton>
          <Select.Viewport className="detail-product-menu-viewport">
            {products.map((item, index) => <Select.Item key={item.id} value={String(index)} textValue={item.name} className="detail-product-menu-item">
              <span className="detail-product-preview" aria-hidden="true">
                <ProductThumbnail product={item} colorway={item.colorways[0]} />
              </span>
              <span className="detail-product-copy">
                <strong><Select.ItemText>{item.name}</Select.ItemText></strong>
                <span aria-hidden="true">{item.category}</span>
              </span>
              <Select.ItemIndicator className="detail-product-menu-check"><Check size={18} aria-hidden="true" /></Select.ItemIndicator>
            </Select.Item>)}
          </Select.Viewport>
          <Select.ScrollDownButton className="detail-product-menu-scroll" aria-label="เลื่อนรายการลง">
            <ChevronDown size={16} aria-hidden="true" />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
    <div className="detail-product-pagination">
      <span className="detail-product-count">{String(value + 1).padStart(2, "0")}<span> / {String(products.length).padStart(2, "0")}</span></span>
      <div className="detail-product-options">
        <button type="button" className="detail-product-previous" aria-label="เสื้อตัวก่อนหน้าในมุมดูใกล้" onClick={() => onChange((value + products.length - 1) % products.length)}><ChevronLeft size={20} aria-hidden="true" /></button>
        <button type="button" className="detail-product-next" aria-label="เสื้อตัวถัดไปในมุมดูใกล้" onClick={() => onChange((value + 1) % products.length)}><ChevronRight size={20} aria-hidden="true" /></button>
      </div>
    </div>
  </div>;
}
