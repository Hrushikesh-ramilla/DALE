import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

// URLs for 5 pristine Breguet packshots
const targets = [
  {
    name: "Type XX Chronographe 2057",
    filename: "watches-breguet-type-xx-2057.webp",
    url: "http://www.breguet.cn/sites/default/files/2024-09/2057ST92SW0_soldat.png"
  },
  {
    name: "Reine de Naples 8918",
    filename: "watches-breguet-reine-de-naples-8918.webp",
    url: "https://content.thewosgroup.com/productimage/17110067/17110067_1.jpg?impolicy=zoom"
  },
  {
    name: "Marine 5517 Titanium",
    filename: "watches-breguet-marine-5517.webp",
    url: "https://images.europeanwatch.com/images/64/64766-1.jpg"
  },
  {
    name: "Classique 5177 Grand Feu",
    filename: "watches-breguet-classique-5177.webp",
    url: "https://www.timetells.shop/cdn/shop/files/5177BB-1_e3ec278a-5aef-4283-a4ad-95dd8ae01cbe.jpg?v=1770790984&width=990"
  },
  {
    name: "Tradition 7097 Retrograde",
    filename: "watches-breguet-tradition-7097.webp",
    url: "https://www.berrysjewellers.co.uk/cdn/shop/files/Breguet7097BB-G1-9WU_1.webp?v=1777454873&width=800"
  }
];

async function processImage(target) {
  console.log(`\nFetching ${target.name} from ${target.url}...`);
  const res = await fetch(target.url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const rawBuf = Buffer.from(await res.arrayBuffer());
  const meta = await sharp(rawBuf).metadata();
  console.log(`Original: ${meta.width}x${meta.height}, format: ${meta.format}, alpha: ${meta.hasAlpha}`);

  // Convert to RGBA raw buffer
  let img = sharp(rawBuf).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;

  // Flood fill from outer perimeter to remove white background without touching interior
  // Sample corner color
  const tl = [data[0], data[1], data[2]];
  const isLight = tl[0] > 220 && tl[1] > 220 && tl[2] > 220;
  console.log(`Top-left corner: [${tl.join(', ')}], isLight: ${isLight}`);

  const visited = new Uint8Array(w * h);
  const queue = [];

  // If corner is light or image has alpha, flood fill transparent background
  if (isLight) {
    // Add perimeter border pixels that match corner color
    const match = (idx) => {
      const dr = Math.abs(data[idx] - tl[0]);
      const dg = Math.abs(data[idx+1] - tl[1]);
      const db = Math.abs(data[idx+2] - tl[2]);
      return dr < 35 && dg < 35 && db < 35;
    };

    for (let x = 0; x < w; x++) {
      const topIdx = (0 * w + x) * 4;
      if (match(topIdx)) { queue.push(x, 0); visited[0 * w + x] = 1; }
      const botIdx = ((h - 1) * w + x) * 4;
      if (match(botIdx)) { queue.push(x, h - 1); visited[(h - 1) * w + x] = 1; }
    }
    for (let y = 0; y < h; y++) {
      const leftIdx = (y * w + 0) * 4;
      if (!visited[y * w + 0] && match(leftIdx)) { queue.push(0, y); visited[y * w + 0] = 1; }
      const rightIdx = (y * w + (w - 1)) * 4;
      if (!visited[y * w + (w - 1)] && match(rightIdx)) { queue.push(w - 1, y); visited[y * w + (w - 1)] = 1; }
    }

    let head = 0;
    while (head < queue.length) {
      const qx = queue[head++];
      const qy = queue[head++];
      const pIdx = (qy * w + qx) * 4;
      data[pIdx + 3] = 0; // Set transparent

      // Check 4 neighbours
      const neighbors = [[qx+1, qy], [qx-1, qy], [qx, qy+1], [qx, qy-1]];
      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          const nPos = ny * w + nx;
          if (!visited[nPos]) {
            visited[nPos] = 1;
            const nIdx = nPos * 4;
            if (match(nIdx)) {
              queue.push(nx, ny);
            }
          }
        }
      }
    }
    console.log(`Flooded ${queue.length / 2} perimeter background pixels to transparent.`);
  }

  // Trim transparent edges and center in 600x600 canvas with 90% containment
  const trimmed = await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .trim()
    .toBuffer({ resolveWithObject: true });

  console.log(`Trimmed size: ${trimmed.info.width}x${trimmed.info.height}`);

  // Scale so it fills the 600x600 card stage generously (~540px max dimension)
  const maxDim = 540;
  const scale = maxDim / Math.max(trimmed.info.width, trimmed.info.height);
  const targetW = Math.round(trimmed.info.width * scale);
  const targetH = Math.round(trimmed.info.height * scale);

  const scaled = await sharp(trimmed.data, { raw: { width: trimmed.info.width, height: trimmed.info.height, channels: 4 } })
    .resize(targetW, targetH, { fit: 'contain' })
    .toBuffer({ resolveWithObject: true });

  const finalImg = await sharp({
    create: {
      width: 600,
      height: 600,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
  .composite([{ input: scaled.data, raw: { width: scaled.info.width, height: scaled.info.height, channels: 4 }, top: Math.floor((600 - targetH) / 2), left: Math.floor((600 - targetW) / 2) }])
  .webp({ quality: 90 })
  .toBuffer();

  const out1 = path.join('public/images/products', target.filename);
  const out2 = path.join('.next/standalone/public/images/products', target.filename);
  fs.writeFileSync(out1, finalImg);
  fs.writeFileSync(out2, finalImg);
  console.log(`Successfully saved ${target.filename} (${finalImg.length} bytes) to public/ and standalone!`);
}

for (const t of targets) {
  try {
    await processImage(t);
  } catch (err) {
    console.error(`Failed to process ${t.name}:`, err.message);
  }
}
