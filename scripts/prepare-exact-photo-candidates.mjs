import { readdir,readFile,writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
const root='.data/product-media-audit/source-review';
const discoveries=(await Promise.all((await readdir(root)).map(async f=>JSON.parse(await readFile(root+'/'+f,'utf8'))))).flatMap(r=>(r.candidates||[]).map(c=>({...c,sourcePage:r.url})));
const registry=JSON.parse(await readFile('catalog/media/verified-product-images.json','utf8'));
const products=(await Promise.all((await readdir('catalog/manifests')).filter(f=>f.endsWith('.json')&&!f.includes('observations')).map(async f=>JSON.parse(await readFile('catalog/manifests/'+f,'utf8'))))).flatMap(m=>m.products||[]);
const allowed=new Set(['dlcdnwebimgs.asus.com','api.beyerdynamic.de','assets.sennheiser.com','resource.logitech.com','klipsch.imgix.net','images.asics.com','www.denon.com','i02.appmifile.com','consumer.huawei.com','www.polkaudio.com','www-oss.lexar.com','storage-asset.msi.com']);
let added=0;
for(const candidate of discoveries) {
  if(registry.entries[candidate.id])continue;
  const p=products.find(p=>p.id===candidate.id);if(!p)continue;
  for(const raw of candidate.images) {
    try {
      const url=new URL(raw.replaceAll('&amp;','&'));
      if(url.protocol!=='https:'||!allowed.has(url.hostname)||url.username||url.password||url.port)continue;
      const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(15000)});
      if(!response.ok||!response.headers.get('content-type')?.startsWith('image/'))continue;
      const reader=response.body.getReader(),parts=[];let total=0;
      while(true){const{done,value}=await reader.read();if(done)break;total+=value.length;if(total>10_000_000){await reader.cancel();throw new Error('Oversized source');}parts.push(value);}
      const source=Buffer.concat(parts);
      const meta=await sharp(source,{limitInputPixels:40_000_000}).metadata();
      if(!meta.width||!meta.height||meta.width<200||meta.height<150)continue;
      let output;
      for(const [width,quality] of [[960,78],[960,70],[800,68],[640,65]]){output=await sharp(source,{limitInputPixels:40_000_000}).rotate().resize({width,height:width,fit:'inside',withoutEnlargement:true}).webp({quality,effort:6}).toBuffer();if(output.length<=140000)break;}
      if(output.length>140000)continue;
      const hash=createHash('sha256').update(output).digest('hex'),dimensions=await sharp(output).metadata();
      const filename=p.id.toLowerCase()+'-'+hash.slice(0,16)+'.webp';
      await writeFile('public/images/verified/'+filename,output);
      registry.entries[p.id]={productName:p.name,brand:p.brand,color:p.color,attributes:p.attributes||{},url:'/images/verified/'+filename,alt:p.name,sourcePage:candidate.sourcePage,sourceImage:url.href,attribution:'Manufacturer product page: '+p.brand,reviewedAt:new Date().toISOString().slice(0,10),reviewMethod:'exact structured product name; visual-and-variant-review-pending',sourcePageHash:candidate.sourceHash,sourceSku:candidate.sku,sha256:hash,bytes:output.length,width:dimensions.width,height:dimensions.height,verified:false};
      added++;console.log('Prepared exact-name candidate: '+p.id);break;
    }catch(error){console.log('Candidate not usable: '+candidate.id+'; '+error.message);}
  }
}
await writeFile('catalog/media/verified-product-images.json',JSON.stringify(registry,null,2)+'\n');
console.log(JSON.stringify({added,requiresVisualReview:true}));
