import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const files = [
  { label: 'Breguet Type XX (Official Breguet PNG)', file: 'public/images/products/watches-breguet-type-xx-2057.webp' },
  { label: 'Breguet Marine 5517 (Studio Clean)', file: 'public/images/products/watches-breguet-marine-5517.webp' },
  { label: 'Breguet Classique 5177 (Studio Clean)', file: 'public/images/products/watches-breguet-classique-5177.webp' },
  { label: 'Breguet Tradition 7097 (Studio Clean)', file: 'public/images/products/watches-breguet-tradition-7097.webp' },
  { label: 'Breguet Reine de Naples (WOS Clean)', file: 'public/images/products/watches-breguet-reine-de-naples-8918.webp' },
  { label: 'Creed Virgin Island Water (Solid Bottle)', file: 'public/images/products/fragrance-prod-fragrance-creed-creed-virgin-island-water.webp' },
  { label: 'Creed Aventus (Space NK Bottle)', file: 'public/images/products/fragrance-prod-fragrance-creed-creed-aventus.webp' }
];

const tileW = 320;
const tileH = 320;
const cols = 4;
const rows = 2;
const canvasW = cols * tileW;
const canvasH = rows * tileH;

const composites = [];

for (let i = 0; i < files.length; i++) {
  const item = files[i];
  const col = i % cols;
  const row = Math.floor(i / cols);
  const left = col * tileW;
  const top = row * tileH;

  // Background tile simulating our dark card stage
  const tileBuf = await sharp({
    create: {
      width: tileW,
      height: tileH,
      channels: 4,
      background: { r: 15, g: 19, b: 26, alpha: 1 } // #0f131a luxury stage
    }
  }).png().toBuffer();

  composites.push({ input: tileBuf, top, left });

  // Scaled product image
  const imgBuf = fs.readFileSync(item.file);
  const scaled = await sharp(imgBuf)
    .resize(tileW - 30, tileH - 30, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  composites.push({ input: scaled, top: top + 15, left: left + 15 });
}

const finalGrid = await sharp({
  create: {
    width: canvasW,
    height: canvasH,
    channels: 4,
    background: { r: 8, g: 10, b: 14, alpha: 1 }
  }
})
.composite(composites)
.png()
.toBuffer();

const artifactPath = "C:/Users/ramil/.gemini/antigravity/brain/4ee11e1c-7282-4daa-83f5-b58765f2aefe/user-reported-fixes-proof.png";
fs.writeFileSync(artifactPath, finalGrid);
console.log(`Saved proof grid to: ${artifactPath}`);
