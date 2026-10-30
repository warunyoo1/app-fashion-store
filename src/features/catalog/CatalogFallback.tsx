import { useEffect } from "react";
import { products } from "./products";
import { ProductThumbnail } from "./ProductThumbnail";

export function CatalogFallback({ selected, colorways, onSelect, onReady, onUnavailable }: {
  selected: number | null;
  colorways: number[];
  onSelect: (index: number) => void;
  onReady: () => void;
  onUnavailable: () => void;
}) {
  useEffect(() => { onReady(); onUnavailable(); }, [onReady, onUnavailable]);
  if (selected !== null) {
    const product = products[selected];
    return <div className="catalog-fallback is-preview">
      <ProductThumbnail product={product} colorway={product.colorways[colorways[selected]]} />
      <p>อุปกรณ์นี้แสดง 3D ไม่ได้ ยังเลือกสี ไซซ์ และเพิ่มลงถุงได้ครับ</p>
    </div>;
  }
  return <div className="catalog-fallback">
    <p>อุปกรณ์นี้แสดง 3D ไม่ได้ เลือกเสื้อจากภาพได้เลยครับ</p>
    <div className="fallback-products">
      {products.map((product, index) => <button key={product.id} onClick={() => onSelect(index)}>
        <ProductThumbnail product={product} colorway={product.colorways[colorways[index]]} />
        <span>{product.name}</span>
      </button>)}
    </div>
  </div>;
}
