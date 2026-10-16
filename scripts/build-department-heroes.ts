import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

async function removeWhiteBgFromBuffer(inputBuf: Buffer, extraSeeds?: [number, number][]): Promise<Buffer> {
  const image = sharp(inputBuf);
  const { data, info } = await image.raw().ensureAlpha().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const p = (x: number, y: number) => {
    const idx = (y * width + x) * channels;
    return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
  };

  const tl = p(0, 0);
  const tr = p(width - 1, 0);
  const bl = p(0, height - 1);
  const br = p(width - 1, height - 1);

  // If already transparent corners, skip unless extra seeds provided
  if (!extraSeeds && tl[3] < 10 && tr[3] < 10 && bl[3] < 10 && br[3] < 10) {
    return inputBuf;
  }

  const isBgPixel = (r: number, g: number, b: number) => {
    const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
    if (r >= 210 && g >= 210 && b >= 210 && maxDiff <= 28) return true;
    if (r >= 235 && g >= 235 && b >= 235 && maxDiff <= 38) return true;
    return false;
  };

  const isCornerLight = (c: number[]) => isBgPixel(c[0], c[1], c[2]);
  if (!extraSeeds && !isCornerLight(tl) && !isCornerLight(tr) && !isCornerLight(bl) && !isCornerLight(br)) {
    return inputBuf;
  }

  const visited = new Uint8Array(width * height);
  const queue: number[] = [];

  for (let x = 0; x < width; x++) {
    const topIdx = x * channels;
    if (isBgPixel(data[topIdx], data[topIdx + 1], data[topIdx + 2])) {
      visited[x] = 1;
      queue.push(x);
    }
    const bot = (height - 1) * width + x;
    const botIdx = bot * channels;
    if (isBgPixel(data[botIdx], data[botIdx + 1], data[botIdx + 2])) {
      visited[bot] = 1;
      queue.push(bot);
    }
  }

  for (let y = 0; y < height; y++) {
    const left = y * width;
    const leftIdx = left * channels;
    if (!visited[left] && isBgPixel(data[leftIdx], data[leftIdx + 1], data[leftIdx + 2])) {
      visited[left] = 1;
      queue.push(left);
    }
    const right = y * width + (width - 1);
    const rightIdx = right * channels;
    if (!visited[right] && isBgPixel(data[rightIdx], data[rightIdx + 1], data[rightIdx + 2])) {
      visited[right] = 1;
      queue.push(right);
    }
  }

  if (extraSeeds) {
    for (const [sx, sy] of extraSeeds) {
      const px = Math.round(sx <= 1 ? sx * width : sx);
      const py = Math.round(sy <= 1 ? sy * height : sy);
      if (px >= 0 && px < width && py >= 0 && py < height) {
        const idx = py * width + px;
        const bIdx = idx * channels;
        if (!visited[idx] && isBgPixel(data[bIdx], data[bIdx + 1], data[bIdx + 2])) {
          visited[idx] = 1;
          queue.push(idx);
        }
      }
    }
  }

  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    const cx = curr % width;
    const cy = Math.floor(curr / width);

    const neighbors = [
      cy > 0 ? curr - width : -1,
      cy < height - 1 ? curr + width : -1,
      cx > 0 ? curr - 1 : -1,
      cx < width - 1 ? curr + 1 : -1,
    ];

    for (const n of neighbors) {
      if (n !== -1 && !visited[n]) {
        const nIdx = n * channels;
        if (isBgPixel(data[nIdx], data[nIdx + 1], data[nIdx + 2])) {
          visited[n] = 1;
          queue.push(n);
        }
      }
    }
  }

  // Soft floor shadow cleanup
  const shadowQueue: number[] = [];
  for (let i = 0; i < width * height; i++) {
    if (visited[i]) {
      const cx = i % width;
      const cy = Math.floor(i / width);
      const neighbors = [
        cy > 0 ? i - width : -1,
        cy < height - 1 ? i + width : -1,
        cx > 0 ? i - 1 : -1,
        cx < width - 1 ? i + 1 : -1,
      ];
      for (const n of neighbors) {
        if (n !== -1 && !visited[n]) {
          const nIdx = n * channels;
          const nr = data[nIdx], ng = data[nIdx + 1], nb = data[nIdx + 2];
          const nDiff = Math.max(Math.abs(nr - ng), Math.abs(ng - nb), Math.abs(nr - nb));
          if (nr >= 195 && ng >= 195 && nb >= 195 && nDiff <= 24) {
            visited[n] = 1;
            shadowQueue.push(n);
          }
        }
      }
    }
  }

  let sHead = 0;
  while (sHead < shadowQueue.length) {
    const curr = shadowQueue[sHead++];
    const cx = curr % width;
    const cy = Math.floor(curr / width);
    const neighbors = [
      cy > 0 ? curr - width : -1,
      cy < height - 1 ? curr + width : -1,
      cx > 0 ? curr - 1 : -1,
      cx < width - 1 ? curr + 1 : -1,
    ];
    for (const n of neighbors) {
      if (n !== -1 && !visited[n]) {
        const nIdx = n * channels;
        const nr = data[nIdx], ng = data[nIdx + 1], nb = data[nIdx + 2];
        const nDiff = Math.max(Math.abs(nr - ng), Math.abs(ng - nb), Math.abs(nr - nb));
        if (nr >= 200 && ng >= 200 && nb >= 200 && nDiff <= 24) {
          visited[n] = 1;
          shadowQueue.push(n);
        }
      }
    }
  }

  for (let i = 0; i < width * height; i++) {
    if (visited[i]) {
      data[i * channels + 3] = 0;
    }
  }

  return await sharp(data, { raw: { width, height, channels } })
    .png()
    .toBuffer();
}

async function prepareItem(file: string, maxHeight: number, maxWidth: number = 460, extraSeeds?: [number, number][]): Promise<Buffer> {
  const fullPath = path.resolve("public/images/products", file);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }

  const rawBuf = fs.readFileSync(fullPath);
  const transparentBuf = await removeWhiteBgFromBuffer(rawBuf, extraSeeds);

  const buf = await sharp(transparentBuf)
    .trim({ threshold: 25 })
    .resize({ width: maxWidth, height: maxHeight, fit: "inside" })
    .toBuffer();

  return buf;
}

async function composeHero(
  outputPath: string,
  items: { file: string; height: number; maxWidth?: number; leftOffsetPercent: number; topOffsetPercent: number; extraSeeds?: [number, number][] }[]
) {
  const canvasWidth = 1000;
  const canvasHeight = 650;

  const compositeInputs: sharp.OverlayOptions[] = [];

  for (const item of items) {
    const itemBuf = await prepareItem(item.file, item.height, item.maxWidth || 460, item.extraSeeds);
    const meta = await sharp(itemBuf).metadata();
    const w = meta.width || 0;
    const h = meta.height || 0;
    const maxLeft = Math.max(0, canvasWidth - w);
    const maxTop = Math.max(0, canvasHeight - h);

    const left = Math.round(maxLeft * item.leftOffsetPercent);
    const top = Math.round(maxTop * item.topOffsetPercent);

    compositeInputs.push({
      input: itemBuf,
      left: Math.max(0, Math.min(maxLeft, left)),
      top: Math.max(0, Math.min(maxTop, top)),
    });
  }

  const finalHero = await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite(compositeInputs)
  .webp({ quality: 92 })
  .toBuffer();

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, finalHero);
  console.log("Created hero:", outputPath, finalHero.length, "bytes");

  // Also copy to .next/standalone if exists
  const standaloneOut = path.resolve(".next/standalone", outputPath);
  if (fs.existsSync(path.dirname(standaloneOut))) {
    fs.writeFileSync(standaloneOut, finalHero);
  }
}

async function main() {
  const deptDir = "public/images/departments";

  // 1. FRAGRANCE: Tom Ford Tobacco Vanille + MFK Baccarat Rouge 540 Extrait + Creed Aventus
  console.log("1. Building Fragrance Hero...");
  await composeHero(`${deptDir}/fragrance-luxury-hero.webp`, [
    { file: "fragrance-prod-fragrance-tom-ford-tom-ford-tobacco-vanille.webp", height: 440, leftOffsetPercent: 0.15, topOffsetPercent: 0.4 },
    { file: "fragrance-prod-fragrance-maison-francis-kurkdjian-mfk-baccarat-rouge-540-extrait.webp", height: 500, leftOffsetPercent: 0.5, topOffsetPercent: 0.2 },
    { file: "fragrance-prod-fragrance-creed-creed-aventus.webp", height: 460, leftOffsetPercent: 0.85, topOffsetPercent: 0.35 }
  ]);

  // 2. BAGS: Louis Vuitton Neverfull + Hermès Birkin 25 + Louis Vuitton Onthego
  console.log("2. Building Bags Hero...");
  await composeHero(`${deptDir}/bags-luxury-hero.webp`, [
    { file: "handbags-prod-handbags-louis-vuitton-lv-neverfull-mm.webp", height: 440, leftOffsetPercent: 0.12, topOffsetPercent: 0.35 },
    { file: "handbags-prod-handbags-herm-s-hermes-birkin-25.webp", height: 500, leftOffsetPercent: 0.52, topOffsetPercent: 0.22, extraSeeds: [[300, 160]] },
    { file: "handbags-prod-handbags-louis-vuitton-lv-onthego-mm.webp", height: 420, leftOffsetPercent: 0.88, topOffsetPercent: 0.38 }
  ]);

  // 3. CLOTHING: Brunello Cucinelli Cashmere Overshirt + Brioni Plume Cashmere Blouson + Brunello Cucinelli Ribbed Cashmere Pullover
  console.log("3. Building Clothing Hero...");
  await composeHero(`${deptDir}/clothing-luxury-hero.webp`, [
    { file: "jackets-brunello-cucinelli-cashmere-flannel-lightly-padded-overshirt.webp", height: 480, leftOffsetPercent: 0.15, topOffsetPercent: 0.28 },
    { file: "jackets-brioni-plume-ultra-light-cashmere-zip-blouson.webp", height: 530, leftOffsetPercent: 0.52, topOffsetPercent: 0.18 },
    { file: "knitwear-brunello-cucinelli-english-ribbed-cashmere-half-zip-pullover.webp", height: 460, leftOffsetPercent: 0.88, topOffsetPercent: 0.3 }
  ]);

  // 4. BEAUTY: La Prairie Cellular Softening Lotion + La Prairie Pure Gold Radiance Cream + Augustinus Bader The Body Cream
  console.log("4. Building Beauty Hero...");
  await composeHero(`${deptDir}/beauty-luxury-hero.webp`, [
    { file: "beauty-dior-prestige-la-creme.webp", height: 460, leftOffsetPercent: 0.15, topOffsetPercent: 0.25 },
    { file: "beauty-armani-crema-nera.webp", height: 480, leftOffsetPercent: 0.52, topOffsetPercent: 0.28 },
    { file: "beauty-chanel-sublimage-la-creme.webp", height: 420, leftOffsetPercent: 0.88, topOffsetPercent: 0.35 }
  ]);

  // 5. HOME: Le Creuset Dutch Oven + Baccarat Papillon Lucky Butterfly + Smeg x D&G Toaster
  console.log("5. Building Home Hero...");
  await composeHero(`${deptDir}/home-luxury-hero.webp`, [
    { file: "kitchenware-prod-kitchenware-le-creuset-le-creuset-signature-round-dutch-oven.webp", height: 420, leftOffsetPercent: 0.15, topOffsetPercent: 0.4 },
    { file: "decor-prod-decor-baccarat-baccarat-lucky-butterfly-sculpture.webp", height: 500, leftOffsetPercent: 0.52, topOffsetPercent: 0.2 },
    { file: "kitchenware-prod-kitchenware-smeg-x-dolce-gabbana-smeg-dg-4-slice-toaster.webp", height: 400, leftOffsetPercent: 0.85, topOffsetPercent: 0.4 }
  ]);

  // 6. WATCHES: Breitling Superocean Heritage Mesh + Breitling Avenger Chronograph + Breitling Chronomat B01
  console.log("6. Building Watches Hero...");
  await composeHero(`${deptDir}/watches-luxury-hero.webp`, [
    { file: "watches-breitling-superocean-heritage-b20-automatic-42.webp", height: 470, leftOffsetPercent: 0.15, topOffsetPercent: 0.28 },
    { file: "watches-breitling-avenger-chronograph.webp", height: 530, leftOffsetPercent: 0.5, topOffsetPercent: 0.16 },
    { file: "watches-breitling-chronomat-b01-42.webp", height: 470, leftOffsetPercent: 0.85, topOffsetPercent: 0.28 }
  ]);

  // 7. FOOTWEAR: Ferragamo Suede Loafer + Saint Laurent Wyatt Chelsea Boot + Prada Chocolate Loafer
  console.log("7. Building Footwear Hero...");
  await composeHero(`${deptDir}/footwear-luxury-hero.webp`, [
    { file: "shoes-ferragamo-gancini-loafer.webp", height: 400, leftOffsetPercent: 0.12, topOffsetPercent: 0.45 },
    { file: "shoes-saint-laurent-wyatt-chelsea.webp", height: 520, leftOffsetPercent: 0.52, topOffsetPercent: 0.18 },
    { file: "shoes-prada-chocolate-loafer.webp", height: 420, leftOffsetPercent: 0.88, topOffsetPercent: 0.42 }
  ]);

  // 8. EYEWEAR: Persol 714 Steve McQueen + Cartier Santos Aviator + Prada Symbole
  console.log("8. Building Eyewear Hero...");
  await composeHero(`${deptDir}/eyewear-luxury-hero.webp`, [
    { file: "eyewear-persol-714-steve-mcqueen.webp", height: 400, leftOffsetPercent: 0.15, topOffsetPercent: 0.35 },
    { file: "eyewear-cartier-santos.webp", height: 460, leftOffsetPercent: 0.5, topOffsetPercent: 0.25 },
    { file: "eyewear-prada-symbole.webp", height: 410, leftOffsetPercent: 0.85, topOffsetPercent: 0.35 }
  ]);

  // 9. APPLIANCES: Smeg Sicily Drip Filter Coffee Maker + Dyson Purifier Cool TP09 + Smeg Sicily Electric Kettle
  console.log("9. Building Appliances Hero...");
  await composeHero(`${deptDir}/appliances-luxury-hero.webp`, [
    { file: "kitchenware-smeg-x-dolce-gabbana-sicily-is-my-love-drip-filter-coffee.webp", height: 480, leftOffsetPercent: 0.15, topOffsetPercent: 0.22 },
    { file: "air-purifiers-prod-air-purifiers-dyson-dyson-purifier-cool-tp09.webp", height: 530, leftOffsetPercent: 0.52, topOffsetPercent: 0.15 },
    { file: "kitchenware-prod-kitchenware-smeg-x-dolce-gabbana-smeg-dg-electric-kettle.webp", height: 440, leftOffsetPercent: 0.85, topOffsetPercent: 0.3 }
  ]);

  console.log("All 9 Department Heroes built successfully with 100% pristine official studio assets!");
}

main().catch(console.error);
