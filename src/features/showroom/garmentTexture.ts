import { CanvasTexture, SRGBColorSpace } from "three";
import type { Colorway, Product } from "../catalog/products";
import { shapes } from "./garmentGeometry";

// Garment space (x, y in -1..1) to canvas pixels; the texture is flipped on upload.
const px = (x: number) => 512 + x * 512,
  py = (y: number) => (1 - y) * 512;

/** Paints the sleeves of long-sleeved garments (the outline beyond the body). */
function sleeves(c: CanvasRenderingContext2D, product: Product, fill: string) {
  if (product.kind !== "longsleeve" && product.kind !== "jacket") return;
  const body = shapes[product.kind].halfWidth(-1),
    cuff = product.kind === "jacket" ? -0.8 : -0.86;
  c.fillStyle = fill;
  c.fillRect(0, 0, px(-body), py(cuff));
  c.fillRect(px(body), 0, 1024 - px(body), py(cuff));
}
export function createGarmentTexture(
  product: Product,
  colorway: Colorway,
  back = false,
) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1024;
  const c = canvas.getContext("2d")!;
  const { color, accent, ink } = colorway;
  c.fillStyle = color;
  c.fillRect(0, 0, 1024, 1024);
  c.fillStyle = accent;
  switch (product.motif) {
    case "stripes":
      for (let x = 220; x < 820; x += 118) c.fillRect(x, 0, 47, 1024);
      break;
    case "split":
      c.beginPath();
      c.moveTo(282, 0);
      c.lineTo(365, 0);
      c.bezierCurveTo(390, 430, 590, 550, 600, 1024);
      c.lineTo(530, 1024);
      c.bezierCurveTo(520, 530, 335, 460, 282, 0);
      c.fill();
      c.fillRect(145, 150, 46, 300);
      c.fillRect(834, 150, 46, 300);
      break;
    case "bands":
      // Side panels and fine pinstripes, like a classic home kit.
      c.fillRect(228, 360, 40, 664);
      c.fillRect(756, 360, 40, 664);
      c.fillRect(0, 150, 230, 30);
      c.fillRect(794, 150, 230, 30);
      c.globalAlpha = 0.35;
      for (let y = 420; y < 1024; y += 34) c.fillRect(268, y, 488, 3);
      c.globalAlpha = 1;
      break;
    case "hoops":
      // Two bicep hoops across both sleeves.
      for (const y of [0.1, 0.02]) {
        c.fillRect(0, py(y), 1024, 10);
        c.fillRect(0, py(y) + 18, 1024, 4);
      }
      break;
    case "varsity":
      sleeves(c, product, accent);
      // Ribbed cuffs and hem.
      c.fillStyle = ink;
      for (const y of [py(-0.8) - 40, py(-0.8) - 26, 990, 1004])
        c.fillRect(0, y, 1024, 7);
      break;
    case "graphic": {
      // Washed two-tone: bone block bleeding into the body.
      const g = c.createLinearGradient(0, 560, 0, 640);
      g.addColorStop(0, color);
      g.addColorStop(1, accent);
      c.fillStyle = g;
      c.fillRect(0, 560, 1024, 464);
      for (let i = 0; i < 2600; i++) {
        c.fillStyle = Math.random() > 0.5 ? "#ffffff14" : "#0000001a";
        c.fillRect(Math.random() * 1024, Math.random() * 1024, 3, 2);
      }
      break;
    }
  }
  // Fine woven lines are part of the garment material, not a page texture.
  c.strokeStyle = "#ffffff10";
  c.lineWidth = 0.8;
  for (let y = 0; y < 1024; y += 5) {
    c.beginPath();
    c.moveTo(0, y);
    c.lineTo(1024, y);
    c.stroke();
  }
  c.strokeStyle = "#00000009";
  for (let x = 0; x < 1024; x += 5) {
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x, 1024);
    c.stroke();
  }
  c.fillStyle = ink;
  c.textAlign = "center";
  if (back) {
    if (product.kind === "jersey") {
      c.font = "700 42px Oswald";
      c.fillText("OFF THE PITCH", 512, 300);
      c.font = "700 300px Oswald";
      c.fillText(product.number, 512, 640);
    } else if (product.motif === "varsity") {
      c.font = "italic 700 120px Oswald";
      c.fillText("RACK", 512, 420);
      c.font = "700 46px Oswald";
      c.fillText("ATHLETIC DEPT.", 512, 490);
    } else {
      c.font = "600 22px Oswald";
      c.fillText("RACK " + product.number, 512, 200);
    }
  } else {
    switch (product.motif) {
      case "plain":
        c.font = "700 30px Oswald";
        c.fillText("RACK", 380, 330);
        break;
      case "hoops":
        c.font = "italic 700 92px Oswald";
        c.fillText("Rack Club", 512, 470);
        break;
      case "graphic":
        c.font = "700 104px Oswald";
        c.fillText("RACK WRLD", 512, 430);
        c.font = '500 20px "DM Sans"';
        c.fillText("WASHED IN THE SUN SINCE 2026", 512, 470);
        break;
      case "varsity": {
        // Chenille letter patch on the left chest and snap buttons.
        c.font = "900 170px Oswald";
        c.lineWidth = 12;
        c.strokeStyle = accent;
        c.strokeText("R", 380, 470);
        c.fillText("R", 380, 470);
        c.fillStyle = accent;
        for (let y = 300; y < 960; y += 120) {
          c.beginPath();
          c.arc(512, y, 11, 0, Math.PI * 2);
          c.fill();
        }
        break;
      }
      default:
        c.font = "700 87px Oswald";
        c.fillText("RACK", 512, 545);
        c.font = '500 19px "DM Sans"';
        c.fillText("INDEPENDENT ATHLETIC CLUB", 512, 578);
        c.font = "700 37px Oswald";
        c.fillText(product.number, 370, 335);
        c.beginPath();
        c.moveTo(633, 290);
        c.lineTo(680, 290);
        c.lineTo(680, 329);
        c.lineTo(657, 349);
        c.lineTo(633, 329);
        c.closePath();
        c.lineWidth = 3;
        c.strokeStyle = ink;
        c.stroke();
        c.font = "700 26px Oswald";
        c.fillText("R", 657, 325);
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
