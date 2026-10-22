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

  if (!extraSeeds && tl[3] < 10 && tr[3] < 10 && bl[3] < 10 && br[3] < 10) {
    return inputBuf;
  }

  const isBgPixel = (r: number, g: number, b: number) => {
    const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
    if (r >= 210 && g >= 210 && b >= 210 && maxDiff <= 28) return true;
    if (r >= 235 && g >= 235 && b >= 235 && maxDiff <= 38) return true;
    return false;
  };

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

  // Shadow cleanup
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

async function buildSingleHero(
  sourceFile: string,
  outputPath: string,
  options: {
    maxHeight: number;
    maxWidth?: number;
    extraSeeds?: [number, number][];
    cropBottomPixels?: number;
    bottomFadePixels?: number;
  }
) {
  const fullPath = path.resolve("public/images/products", sourceFile);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }

  const rawBuf = fs.readFileSync(fullPath);
  const transparentBuf = await removeWhiteBgFromBuffer(rawBuf, options.extraSeeds);

  const trimmedBuf = await sharp(transparentBuf).trim({ threshold: 25 }).toBuffer();
  let image = sharp(trimmedBuf);

  if (options.cropBottomPixels) {
    const meta = await image.metadata();
    if (meta.width && meta.height && meta.height > options.cropBottomPixels) {
      image = sharp(trimmedBuf).extract({
        left: 0,
        top: 0,
        width: meta.width,
        height: meta.height - options.cropBottomPixels,
      });
    }
  }

  let buffer = await image
    .resize({
      width: options.maxWidth || 700,
      height: options.maxHeight,
      fit: "inside"
    })
    .png()
    .toBuffer();

  if (options.bottomFadePixels) {
    const { data, info } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true });
    const fadeStart = Math.max(0, info.height - options.bottomFadePixels);
    for (let y = fadeStart; y < info.height; y++) {
      const progress = (y - fadeStart) / (info.height - fadeStart);
      const alphaMul = 1 - progress * progress; // smooth roll-off
      for (let x = 0; x < info.width; x++) {
        const idx = (y * info.width + x) * info.channels + 3;
        data[idx] = Math.round(data[idx] * alphaMul);
      }
    }
    buffer = await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
      .webp({ quality: 95 })
      .toBuffer();
  } else {
    buffer = await sharp(buffer).webp({ quality: 95 }).toBuffer();
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, buffer);
  console.log(`Saved single hero [${path.basename(outputPath)}]: ${buffer.length} bytes`);

  const standaloneOut = path.resolve(".next/standalone", outputPath);
  if (fs.existsSync(path.dirname(standaloneOut))) {
    fs.writeFileSync(standaloneOut, buffer);
  }
}

async function main() {
  const deptDir = "public/images/departments";

  console.log("Generating 3D Flagship Heroes (100% Uncluttered, Single Sculptural Centerpieces)...");

  // 1. Clothing: Brunello Cucinelli English-Ribbed Cashmere Pullover (Sand/Oatmeal)
  await buildSingleHero(
    "knitwear-brunello-cucinelli-english-ribbed-cashmere-half-zip-pullover.webp",
    `${deptDir}/clothing-luxury-hero.webp`,
    { maxHeight: 520, maxWidth: 600 }
  );

  // 2. Fragrance: MFK Baccarat Rouge 540 Extrait (Ruby faceted crystal & heavy gold stopper)
  await buildSingleHero(
    "fragrance-prod-fragrance-maison-francis-kurkdjian-mfk-baccarat-rouge-540-extrait.webp",
    `${deptDir}/fragrance-luxury-hero.webp`,
    { maxHeight: 520, maxWidth: 560, cropBottomPixels: 8 }
  );

  // 3. Bags & Accessories: Hermès Birkin 25 Togo in Étoupe with gold hardware & transparent handle
  await buildSingleHero(
    "handbags-prod-handbags-herm-s-hermes-birkin-25.webp",
    `${deptDir}/bags-luxury-hero.webp`,
    { maxHeight: 520, maxWidth: 620, extraSeeds: [[300, 160]] }
  );

  // 4. Home & Living: Baccarat Papillon Iridescent Lucky Butterfly sculpture
  await buildSingleHero(
    "decor-prod-decor-baccarat-baccarat-lucky-butterfly-sculpture.webp",
    `${deptDir}/home-luxury-hero.webp`,
    { maxHeight: 500, maxWidth: 580 }
  );

  // 5. Beauty & Care: La Prairie Pure Gold Radiance Cream (heavy brushed gold jar)
  await buildSingleHero(
    "beauty-armani-crema-nera.webp",
    `${deptDir}/beauty-luxury-hero.webp`,
    { maxHeight: 460, maxWidth: 600 }
  );

  // 6. Watches: Breitling Chronomat B01 42 Panda Dial (3D isometric chronograph with feathered strap)
  await buildSingleHero(
    "watches-breitling-chronomat-b01-42.webp",
    `${deptDir}/watches-luxury-hero.webp`,
    { maxHeight: 540, maxWidth: 580, bottomFadePixels: 50 }
  );

  // 7. Shoes: Saint Laurent Wyatt Chelsea Boot in Cognac Calfskin (3D angled pair)
  await buildSingleHero(
    "shoes-saint-laurent-wyatt-chelsea.webp",
    `${deptDir}/footwear-luxury-hero.webp`,
    { maxHeight: 500, maxWidth: 620, cropBottomPixels: 4, bottomFadePixels: 15 }
  );

  // 8. Sunglasses: Persol 714 Steve McQueen Folding Acetate (3D angled perspective)
  await buildSingleHero(
    "sunglasses-prod-sunglasses-persol-persol-714-folding-sunglasses.webp",
    `${deptDir}/eyewear-luxury-hero.webp`,
    { maxHeight: 440, maxWidth: 620 }
  );

  // 9. Appliances: Smeg x Dolce & Gabbana Electric Kettle
  await buildSingleHero(
    "kitchenware-prod-kitchenware-smeg-x-dolce-gabbana-smeg-dg-electric-kettle.webp",
    `${deptDir}/appliances-luxury-hero.webp`,
    { maxHeight: 520, maxWidth: 580, extraSeeds: [[140, 300]] }
  );

  console.log("All 9 Single Flagship Heroes generated successfully!");
}

main().catch(console.error);
