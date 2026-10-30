import { readFile, writeFile } from 'node:fs/promises';
const models = JSON.parse(await readFile('assets/garments/curated-rail-models.json', 'utf8'));
const fits = {
  'western-shirt': { widthScale: 1, drop: .15, depth: -.15 },
  'utility-jacket': { widthScale: 1, drop: .2, depth: -.2 },
  'rose-leather-jacket': { widthScale: .95, drop: .2, depth: -.2 },
  'khaki-overshirt': { widthScale: 1, drop: .42, depth: -.15 },
  'urban-hoodie': { widthScale: 1.2, drop: .8, depth: -.15 },
  'studio-graphic-tee': { widthScale: 1, drop: .2, depth: -.2 },
  'rose-hoodie': { widthScale: 1, drop: .05, depth: -.18 },
};
const products = models.map((model, i) => ({
  id: model.id, name: model.id === 'khaki-overshirt' ? 'Leopard Patch Hoodie' : model.name,
  category: model.kind === 'tee' ? 'Street essentials' : model.kind === 'longsleeve' ? 'Shirts & layers' : 'Outerwear',
  kind: model.kind, motif: 'plain', number: String(i + 6).padStart(2, '0'), price: model.price,
  model: { file: `/assets/models/${model.id}/${model.id}.glb`, thumbnails: [`/assets/models/${model.id}/original.jpg`],
    colorMaterial: model.id === 'rose-leather-jacket' ? 'uniform_1001' : '',
    width: model.width, height: model.height, depth: model.depth, hideNodes: [], hangerFit: fits[model.id],
    ...(model.id === 'western-shirt' ? { metalHangerFit: { widthScale: 1, drop: .32, depth: -.13 } } : {}),
    title: model.title, author: model.author, source: model.source, license: 'https://creativecommons.org/licenses/by/4.0/' },
  colorways: [{ color: model.id === 'western-shirt' ? '#8b4b41' : model.color, accent: model.color, ink: '#f4f1e8',
    colorName: model.id === 'western-shirt' ? 'Rust' : model.id === 'khaki-overshirt' ? 'Leopard / Sand' : model.colorName }],
}));
await writeFile('src/features/catalog/curatedProducts.ts', 'import type { Product } from "./products";\n\n/** Credited GLB assets; regenerate with scripts/write-curated-catalog.mjs. */\nexport const curatedProducts: Product[] = ' + JSON.stringify(products, null, 2) + ';\n');
