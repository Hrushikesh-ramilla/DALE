import { execSync } from 'child_process';
import fs from 'node:fs';

const content = fs.readFileSync('tests/fragrance-images.test.ts', 'utf8');
const matches = [...content.matchAll(/expectedFile:\s*['"]([^'"]+)['"]/g)].map(m => m[1]);
console.log('Total test files:', matches.length);

for (const f of matches) {
  const p1 = 'public/images/products/' + f;
  if (fs.existsSync(p1)) {
    const s = fs.statSync(p1).size;
    if (s >= 40960) {
      console.log('File over 40KB:', f, s);
      try {
        const orig = execSync('git show e2e9138:public/images/products/' + f, { maxBuffer: 10 * 1024 * 1024 });
        fs.writeFileSync(p1, orig);
        fs.writeFileSync('.next/standalone/public/images/products/' + f, orig);
        console.log('  Restored from e2e9138:', orig.length);
      } catch (e) {
        console.log('  Could not restore from e2e9138:', e.message);
      }
    }
  }
}
