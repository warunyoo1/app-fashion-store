import { CanvasTexture, NoColorSpace, RepeatWrapping } from "three";

/** Subtle deterministic woven height detail. All garment artwork remains unchanged. */
export function createFabricBump() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d")!,
    image = ctx.createImageData(256, 256);
  for (let y = 0; y < 256; y++)
    for (let x = 0; x < 256; x++) {
      const warp = Math.sin((x * Math.PI) / 4),
        weft = Math.sin((y * Math.PI) / 4);
      const stitch = (Math.floor(x / 8) + Math.floor(y / 8)) % 2 ? warp : weft;
      const value = 128 + stitch * 24 + (warp + weft) * 9;
      const i = (y * 256 + x) * 4;
      image.data[i] = image.data[i + 1] = image.data[i + 2] = value;
      image.data[i + 3] = 255;
    }
  ctx.putImageData(image, 0, 0);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = NoColorSpace;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.anisotropy = 4;
  return texture;
}
