import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { dualWriteImage } from './packshot-fetcher.mjs';

sharp.cache(false);

const dir = 'public/images/products';

// 1. Breguet Classique 5177 from European Watch Co (front packshot)
console.log("Fetching Breguet Classique 5177 front packshot...");
const clRes = await fetch("https://images.europeanwatch.com/images/57/57847-1.jpg", {
  headers: { 'User-Agent': 'Mozilla/5.0' }
});
if (clRes.ok) {
  const clRaw = Buffer.from(await clRes.arrayBuffer());
  const clClean = await sharp(clRaw)
    .resize(600, 600, { fit: 'contain', background: '#ffffff' })
    .webp({ quality: 90 })
    .toBuffer();
  dualWriteImage('watches-breguet-classique-5177.webp', clClean);
  console.log("Updated Breguet Classique 5177!");
}

// 2. Breguet Marine 5517 from European Watch Co (front packshot 54729-1)
console.log("Fetching Breguet Marine 5517 front packshot...");
const mRes = await fetch("https://images.europeanwatch.com/images/54/54729-1.jpg", {
  headers: { 'User-Agent': 'Mozilla/5.0' }
});
if (mRes.ok) {
  const mRaw = Buffer.from(await mRes.arrayBuffer());
  const mClean = await sharp(mRaw)
    .resize(600, 600, { fit: 'contain', background: '#ffffff' })
    .webp({ quality: 90 })
    .toBuffer();
  dualWriteImage('watches-breguet-marine-5517.webp', mClean);
  console.log("Updated Breguet Marine 5517!");
}

// 3. Breguet Tradition 7097 front packshot from Exquisite Timepieces
console.log("Fetching Breguet Tradition 7097 front packshot...");
const trRes = await fetch("https://d2j6dbq0eux0bg.cloudfront.net/images/16115183/4940110162.jpg", {
  headers: { 'User-Agent': 'Mozilla/5.0' }
});
if (trRes.ok) {
  const trRaw = Buffer.from(await trRes.arrayBuffer());
  const trClean = await sharp(trRaw)
    .resize(600, 600, { fit: 'contain', background: '#ffffff' })
    .webp({ quality: 90 })
    .toBuffer();
  dualWriteImage('watches-breguet-tradition-7097.webp', trClean);
  console.log("Updated Breguet Tradition 7097!");
}

// 4. Clean white artifact at the bottom of Reine de Naples strap
console.log("Cleaning Reine de Naples strap...");
const rPath = path.join(dir, 'watches-breguet-reine-de-naples-8918.webp');
const rBuf = fs.readFileSync(rPath);
const rMeta = await sharp(rBuf).metadata();
const { data, info } = await sharp(rBuf).raw().toBuffer({ resolveWithObject: true });
// Clear the bottom 40 rows if they contain white pixels outside the strap
for (let y = info.height - 45; y < info.height; y++) {
  for (let x = 0; x < info.width; x++) {
    const idx = (y * info.width + x) * info.channels;
    if (data[idx] > 200 && data[idx+1] > 200 && data[idx+2] > 200) {
      data[idx+3] = 0; // wipe out white artifact
    }
  }
}
const rClean = await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
  .webp({ quality: 90 })
  .toBuffer();
dualWriteImage('watches-breguet-reine-de-naples-8918.webp', rClean);
console.log("Reine de Naples strap cleaned!");
