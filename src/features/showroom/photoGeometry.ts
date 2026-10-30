import { BufferGeometry, Float32BufferAttribute } from "three";
import { clothDepth } from "./garmentRig.ts";

export interface PhotoPixels {
  width: number;
  height: number;
  data: ArrayLike<number>;
}
export function readPhotoPixels(image: CanvasImageSource): PhotoPixels {
  const source = image as HTMLImageElement;
  const canvas = document.createElement("canvas");
  canvas.width = source.naturalWidth || source.width;
  canvas.height = source.naturalHeight || source.height;
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  context.drawImage(image, 0, 0);
  return context.getImageData(0, 0, canvas.width, canvas.height);
}
function silhouette(image: PhotoPixels) {
  const { width, height, data } = image;
  const lines = new Map<number, [number, number]>();
  let top = height,
    bottom = 0,
    left = width,
    right = 0;
  for (let y = Math.floor(height * 0.08); y < height * 0.94; y++) {
    let lo = width,
      hi = -1;
    for (let x = Math.floor(width * 0.16); x < width * 0.84; x++) {
      if (data[(y * width + x) * 4 + 3] > 240) {
        lo = Math.min(lo, x);
        hi = x;
      }
    }
    if (hi - lo < width * 0.045) continue;
    lines.set(y, [lo + 1, hi - 1]);
    top = Math.min(top, y);
    bottom = Math.max(bottom, y);
    left = Math.min(left, lo);
    right = Math.max(right, hi);
  }
  if (bottom <= top)
    throw new Error("Product image needs a visible opaque garment silhouette");
  const line = (y: number): [number, number] => {
    const nearest = Math.max(top, Math.min(bottom, Math.round(y)));
    if (lines.has(nearest)) return lines.get(nearest)!;
    for (let distance = 1; distance < height; distance++) {
      const candidate =
        lines.get(nearest - distance) || lines.get(nearest + distance);
      if (candidate) return candidate;
    }
    return [left, right];
  };
  return { top, bottom, center: (left + right) / 2, line };
}

/** A closed, draped garment volume traced from the source silhouette, with separate photo UVs. */
export function createPhotoGarment(front: PhotoPixels, back: PhotoPixels) {
  const outline = silhouette(front),
    rear = silhouette(back);
  const span = outline.bottom - outline.top,
    rearSpan = rear.bottom - rear.top;
  const rows = 80,
    cols = 56,
    count = (rows + 1) * (cols + 1);
  const positions: number[] = [],
    uvs: number[] = [],
    indices: number[] = [];
  const counts: number[] = [];
  for (let side = 0; side < 2; side++) {
    const start = indices.length;
    for (let iy = 0; iy <= rows; iy++) {
      const y = -1 + (iy / rows) * 2,
        sourceY = outline.bottom - (iy / rows) * span;
      const [left, right] = outline.line(sourceY);
      const width = (right - left) / span;
      for (let ix = 0; ix <= cols; ix++) {
        const sourceX = left + ((right - left) * ix) / cols;
        const x = ((sourceX - outline.center) / span) * 2;
        const depth = clothDepth(x, y, width);
        positions.push(x, y, depth * (side ? -1 : 1));
        uvs.push(
          side
            ? (rear.center - (x * rearSpan) / 2) / back.width
            : sourceX / front.width,
          side
            ? 1 - (rear.bottom - (iy / rows) * rearSpan) / back.height
            : 1 - sourceY / front.height,
        );
      }
    }
    for (let iy = 0; iy < rows; iy++)
      for (let ix = 0; ix < cols; ix++) {
        const a = side * count + iy * (cols + 1) + ix,
          b = a + 1,
          c = a + cols + 1,
          d = c + 1;
        const y = -1 + ((iy + 0.5) / rows) * 2;
        const x =
          (positions[a * 3] +
            positions[b * 3] +
            positions[c * 3] +
            positions[d * 3]) /
          4;
        const neckDepth = side ? 0.055 : 0.19;
        if (
          y > 1 - neckDepth &&
          Math.abs(x) <
            0.15 * Math.sqrt(Math.max(0, 1 - ((1 - y) / neckDepth) ** 2))
        )
          continue;
        if (side) indices.push(a, c, b, b, c, d);
        else indices.push(a, b, c, b, d, c);
      }
    counts.push(indices.length - start);
  }
  const seamStart = indices.length;
  for (let iy = 0; iy < rows; iy++)
    for (const ix of [0, cols]) {
      const a = iy * (cols + 1) + ix,
        b = a + cols + 1;
      indices.push(a, b, a + count, b, b + count, a + count);
    }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.addGroup(0, counts[0], 0);
  geometry.addGroup(counts[0], counts[1], 1);
  geometry.addGroup(seamStart, indices.length - seamStart, 2);
  geometry.computeVertexNormals();
  return geometry;
}
