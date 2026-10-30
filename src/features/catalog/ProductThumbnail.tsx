import type { CSSProperties } from "react";
import type { Colorway, Product } from "./products";

export function ProductThumbnail({
  product,
  colorway,
}: {
  product: Product;
  colorway: Colorway;
}) {
  if (product.model) {
    const colorIndex = Math.max(0, product.colorways.indexOf(colorway));
    return <img className="bag-photo" src={product.model.thumbnails[colorIndex] ?? product.model.thumbnails[0]} alt="" width={320} height={400} />;
  }
  if (product.photographs)
    return (
      <img
        className="bag-photo"
        src={product.photographs.front}
        alt=""
        width={1000}
        height={1000}
      />
    );
  return (
    <span
      className="mini-garment static"
      data-kind={product.kind}
      style={
        {
          "--swatch": colorway.color,
          "--accent": colorway.accent,
        } as CSSProperties
      }
    >
      <span />
    </span>
  );
}
