import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { parseAnyCatalogManifest } from '../src/domain/catalog-manifest';
import { resolveVerifiedProductImage, type VerifiedImage } from '../src/domain/verified-product-image';
const json=async(path:string)=>JSON.parse(await readFile(path,'utf8'));
describe('reviewed fashion photographs and manufacturer replacements',()=>{
 for(const directory of ['fashion','fashion-watch-avenger','fashion-canali','fashion-brioni'])it(directory+' has exact reviewed SKU evidence, unique preserved identities and compressed assets',async()=>{
  const root='catalog/media/batches/'+directory;
  const batch=await json(root+'/batch.json');const manifest=parseAnyCatalogManifest(batch.manifest);const entries=(await json(root+'/entries.json')).entries as Record<string,VerifiedImage>;
  expect(manifest.products.length).toBe(directory==='fashion-watch-avenger'?1:directory==='fashion-brioni'?50:30);
  expect(new Set(batch.replacements.map((r:{oldProductId:string})=>r.oldProductId)).size).toBe(manifest.products.length);
  for(const product of manifest.products){
   const image=resolveVerifiedProductImage(product,entries);expect(image.url,product.id).toBeTruthy();
   const evidence=batch.evidence.find((e:{productId:string})=>e.productId===product.id);
   expect(evidence.source).toBe(product.source);expect(evidence.manufacturerSku).toBe(entries[product.id].sourceSku);
   expect(batch.replacements.find((r:{newProductId:string})=>r.newProductId===product.id).oldProductId).not.toBe(product.id);
   const bytes=await readFile('public'+image.url);expect(bytes.length).toBe(entries[product.id].bytes);expect(bytes.length).toBeLessThanOrEqual(140000);
   expect(createHash('sha256').update(bytes).digest('hex')).toBe(entries[product.id].sha256);
  }
 },60000);
 it('does not approve the contradictory old Breitling leather-strap identity',async()=>{
  const entries=(await json('catalog/media/batches/fashion-watches/entries.json')).entries as Record<string,VerifiedImage>;
  expect(Object.values(entries).filter(e=>e.verified)).toHaveLength(6);
  const rejected=entries['PROD-WATCHES-BREITLING-BREITLING-AVENGER-AUTOMATIC-42'];expect(rejected.verified).toBe(false);expect((rejected as VerifiedImage & {reviewMethod:string}).reviewMethod).toContain('steel bracelet');
 });
});
