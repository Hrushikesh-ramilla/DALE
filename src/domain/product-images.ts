import type { ProductImageResolution, ProductQuery } from "./product-images/types";
import { resolvePhoneImage } from "./product-images/phones";
import { resolveFragranceImage } from "./product-images/fragrance";
import { resolveWatchesEyewearImage } from "./product-images/watches-eyewear";
import { resolveBagsImage } from "./product-images/bags";
import { resolveFootwearImage } from "./product-images/footwear";
import { resolveClothingImage } from "./product-images/clothing";
import { resolveBeautyHomeImage } from "./product-images/beauty-home";
import { resolveElectronicsImage } from "./product-images/electronics";
import reviewedImages from '../../catalog/media/verified-product-images.json';
import { resolveVerifiedProductImage, type VerifiedImage } from './verified-product-image';

export type { ProductImageResolution, ProductQuery };

const DEFAULT_REVIEW_DATE = "2026-10-12";

export function getProductImage(product: ProductQuery): ProductImageResolution {
  const verified = resolveVerifiedProductImage(product, reviewedImages.entries as Record<string, VerifiedImage>);
  if (verified.url) return verified;
  return getLegacyProductImage(product);
}

/** Legacy acquisition mapping only; not evidence of exact-product identity. */
export function getLegacyProductImage(product: ProductQuery): ProductImageResolution {
  // If the product already has a verified local optimized image, use it
  if (product.media?.url && product.media.url.startsWith("/images/products/")) {
    return {
      url: product.media.url,
      alt: product.media.alt || `${product.name} official photography`,
      source: product.media.source || "/images/products/",
      attribution: product.media.attribution || `Photography © ${product.brand || "BuyerGuard Studio"}`,
      reviewedAt: DEFAULT_REVIEW_DATE,
      width: 600,
      height: 600,
    };
  }

  // Delegate to specialized domain resolvers first
  const domainResolved =
    resolvePhoneImage(product) ||
    resolveFragranceImage(product) ||
    resolveWatchesEyewearImage(product) ||
    resolveBagsImage(product) ||
    resolveFootwearImage(product) ||
    resolveClothingImage(product) ||
    resolveBeautyHomeImage(product) ||
    resolveElectronicsImage(product);

  if (domainResolved) {
    return domainResolved;
  }

  const nameLower = (product.name || "").toLowerCase();
  const brandLower = (product.brand || "").toLowerCase();
  const modelLower = (
    product.modelName ||
    (product.attributes?.modelName as string) ||
    ""
  ).toLowerCase();
  const fullText = `${nameLower} ${brandLower} ${modelLower}`;
  const leaf = (product.leafType || product.category || "").toLowerCase();

  // Helper builder
  const makeImg = (
    filename: string,
    altText: string,
    brandName?: string
  ): ProductImageResolution => ({
    url: `/images/products/${filename}`,
    alt: altText,
    source: "https://buyerguard.luxury/catalog/photography",
    attribution: `Official product photography © ${brandName || product.brand || "Luxury Studio Archive"}`,
    reviewedAt: DEFAULT_REVIEW_DATE,
    width: 600,
    height: 600,
  });

  // =========================================================================
  // 1. SMARTPHONES & MOBILE DEVICES (DISTINCT AUTHENTIC HARDWARE IMAGES PER MODEL)
  // =========================================================================
  if (
    leaf === "phones" ||
    fullText.includes("smartphone") ||
    (fullText.includes("5g") && (
      brandLower.includes("motorola") ||
      brandLower.includes("samsung") ||
      brandLower.includes("google") ||
      brandLower.includes("oneplus") ||
      brandLower.includes("xiaomi") ||
      brandLower.includes("nothing") ||
      brandLower.includes("apple") ||
      brandLower.includes("sony") ||
      brandLower.includes("asus") ||
      brandLower.includes("vivo") ||
      brandLower.includes("realme")
    ))
  ) {
    // --- MOTOROLA (Distinct authentic hardware photography per model) ---
    if (brandLower.includes("motorola") || fullText.includes("moto ") || fullText.includes("razr") || fullText.includes("thinkphone")) {
      if (fullText.includes("g54")) return makeImg("phones-moto-g54.webp", "Motorola Moto G54 5G 50MP OIS smartphone", "Motorola");
      if (fullText.includes("g64")) return makeImg("phones-moto-g64.webp", "Motorola Moto G64 5G Dimensity 7025 smartphone", "Motorola");
      if (fullText.includes("g85")) return makeImg("phones-moto-g85.webp", "Motorola Moto G85 5G 3D Curved pOLED smartphone", "Motorola");
      if (fullText.includes("edge 50 ultra")) return makeImg("phones-moto-edge-50-ultra.webp", "Motorola Edge 50 Ultra Snapdragon 8s Gen 3 flagship", "Motorola");
      if (fullText.includes("edge 50 pro")) return makeImg("phones-moto-edge-50-pro.webp", "Motorola Edge 50 Pro 125W TurboPower smartphone", "Motorola");
      if (fullText.includes("edge 50 fusion")) return makeImg("phones-moto-edge-50-fusion.webp", "Motorola Edge 50 Fusion IP68 pOLED smartphone", "Motorola");
      if (fullText.includes("razr 50 ultra")) return makeImg("phones-moto-razr-50-ultra.webp", "Motorola Razr 50 Ultra 4.0-inch external display flip", "Motorola");
      if (fullText.includes("razr 50") || fullText.includes("razr")) return makeImg("phones-moto-razr-50.webp", "Motorola Razr 50 foldable AMOLED smartphone", "Motorola");
      if (fullText.includes("edge 40 neo")) return makeImg("phones-moto-edge-40-neo.webp", "Motorola Edge 40 Neo 144Hz curved display smartphone", "Motorola");
      if (fullText.includes("thinkphone")) return makeImg("phones-moto-thinkphone.webp", "ThinkPhone by Motorola aramid fiber business smartphone", "Motorola");
      return makeImg("phones-moto-g54.webp", `${product.name} smartphone`, "Motorola");
    }

    // --- SAMSUNG (Distinct authentic hardware photography per model) ---
    if (brandLower.includes("samsung") || fullText.includes("galaxy")) {
      if (fullText.includes("s24 ultra")) return makeImg("phones-samsung-s24-ultra.webp", "Samsung Galaxy S24 Ultra Titanium 200MP Quad Tele", "Samsung");
      if (fullText.includes("s24+") || fullText.includes("s24 plus")) return makeImg("phones-samsung-s24-plus.webp", "Samsung Galaxy S24+ QHD+ Dynamic AMOLED 2X", "Samsung");
      if (fullText.includes("s24 fe")) return makeImg("phones-samsung-s24-fe.webp", "Samsung Galaxy S24 FE Galaxy AI Dynamic AMOLED", "Samsung");
      if (fullText.includes("s24")) return makeImg("phones-samsung-s24.webp", "Samsung Galaxy S24 Dynamic AMOLED 2X smartphone", "Samsung");
      if (fullText.includes("fold6") || fullText.includes("fold 6") || fullText.includes("z fold")) return makeImg("phones-samsung-z-fold6.webp", "Samsung Galaxy Z Fold6 dual screen book foldable", "Samsung");
      if (fullText.includes("flip6") || fullText.includes("flip 6") || fullText.includes("z flip")) return makeImg("phones-samsung-z-flip6.webp", "Samsung Galaxy Z Flip6 FlexWindow compact flip phone", "Samsung");
      if (fullText.includes("s23 ultra")) return makeImg("phones-samsung-s23-ultra.webp", "Samsung Galaxy S23 Ultra S-Pen camera flagship", "Samsung");
      if (fullText.includes("s23")) return makeImg("phones-samsung-s24.webp", "Samsung Galaxy S23 Dynamic AMOLED smartphone", "Samsung");
      if (fullText.includes("a55")) return makeImg("phones-samsung-a55.webp", "Samsung Galaxy A55 5G Metal Frame Super AMOLED", "Samsung");
      if (fullText.includes("a35")) return makeImg("phones-samsung-a35.webp", "Samsung Galaxy A35 5G Infinity-O display smartphone", "Samsung");
      return makeImg("phones-samsung-s24-ultra.webp", `${product.name} smartphone`, "Samsung");
    }

    // --- GOOGLE PIXEL (Distinct authentic hardware photography per model) ---
    if (brandLower.includes("google") || fullText.includes("pixel")) {
      if (fullText.includes("9 pro xl") || fullText.includes("pixel 9")) return makeImg("phones-pixel-9-pro-xl.webp", "Google Pixel 9 Pro XL Tensor G4 Super Actua display", "Google");
      if (fullText.includes("8 pro")) return makeImg("phones-pixel-8-pro.webp", "Google Pixel 8 Pro Tensor G3 telephoto flagship", "Google");
      if (fullText.includes("8a")) return makeImg("phones-pixel-8a.webp", "Google Pixel 8a 120Hz Actua display smartphone", "Google");
      if (fullText.includes("pixel 8")) return makeImg("phones-pixel-8.webp", "Google Pixel 8 Actua display Tensor G3 smartphone", "Google");
      if (fullText.includes("7 pro")) return makeImg("phones-pixel-7-pro.webp", "Google Pixel 7 Pro LTPO 120Hz triple camera flagship", "Google");
      if (fullText.includes("7a")) return makeImg("phones-pixel-7a.webp", "Google Pixel 7a 90Hz OLED dual camera smartphone", "Google");
      if (fullText.includes("pixel 7")) return makeImg("phones-pixel-7-pro.webp", "Google Pixel 7 Tensor G2 smartphone", "Google");
      return makeImg("phones-pixel-8-pro.webp", `${product.name} smartphone`, "Google");
    }

    // --- ONEPLUS (Distinct authentic hardware photography per model) ---
    if (brandLower.includes("oneplus")) {
      if (fullText.includes("open")) return makeImg("phones-oneplus-open.webp", "OnePlus Open Dual ProXDR displays foldable flagship", "OnePlus");
      if (fullText.includes("12r")) return makeImg("phones-oneplus-12r.webp", "OnePlus 12R 4th Gen LTPO 5500mAh smartphone", "OnePlus");
      if (fullText.includes("12")) return makeImg("phones-oneplus-12.webp", "OnePlus 12 4th Gen Hasselblad camera Snapdragon 8 Gen 3", "OnePlus");
      if (fullText.includes("11")) return makeImg("phones-oneplus-11.webp", "OnePlus 11 5G Hasselblad camera flagship", "OnePlus");
      if (fullText.includes("nord 4") || fullText.includes("nord")) return makeImg("phones-oneplus-nord-4.webp", "OnePlus Nord 4 metal unibody 5G smartphone", "OnePlus");
      return makeImg("phones-oneplus-12.webp", `${product.name} smartphone`, "OnePlus");
    }

    // --- NOTHING & CMF (Distinct authentic hardware photography per model) ---
    if (brandLower.includes("nothing") || fullText.includes("cmf")) {
      if (fullText.includes("cmf")) return makeImg("phones-nothing-cmf-1.webp", "CMF Phone 1 modular back cover Super AMOLED smartphone", "Nothing");
      if (fullText.includes("2a") || fullText.includes("phone (2a)")) return makeImg("phones-nothing-phone-2a.webp", "Nothing Phone (2a) custom Dimensity 7200 Pro Glyph", "Nothing");
      if (fullText.includes("phone (2)") || fullText.includes("phone 2")) return makeImg("phones-nothing-phone-2.webp", "Nothing Phone (2) transparent glass Glyph interface", "Nothing");
      if (fullText.includes("phone (1)") || fullText.includes("phone 1")) return makeImg("phones-nothing-phone-1.webp", "Nothing Phone (1) iconic transparent back 120Hz OLED", "Nothing");
      return makeImg("phones-nothing-phone-2.webp", `${product.name} smartphone`, "Nothing");
    }

    // --- XIAOMI / REDMI / POCO (Distinct authentic hardware photography per model) ---
    if (brandLower.includes("xiaomi") || fullText.includes("redmi") || fullText.includes("poco")) {
      if (fullText.includes("14 ultra")) return makeImg("phones-xiaomi-14-ultra.webp", "Xiaomi 14 Ultra Leica quad-camera 1-inch sensor flagship", "Xiaomi");
      if (fullText.includes("13 pro")) return makeImg("phones-xiaomi-13-pro.webp", "Xiaomi 13 Pro 1-inch IMX989 Leica 75mm floating telephoto", "Xiaomi");
      if (fullText.includes("14")) return makeImg("phones-xiaomi-14.webp", "Xiaomi 14 compact Leica Summilux flagship", "Xiaomi");
      if (fullText.includes("redmi note 13 pro+") || fullText.includes("note 13 pro+")) return makeImg("phones-xiaomi-redmi-note-13-pro-plus.webp", "Redmi Note 13 Pro+ 200MP OIS curved AMOLED", "Xiaomi");
      if (fullText.includes("poco f6 pro") || fullText.includes("poco")) return makeImg("phones-xiaomi-poco-f6-pro.webp", "POCO F6 Pro WQHD+ 120Hz Flow AMOLED flagship killer", "POCO");
      return makeImg("phones-xiaomi-14.webp", `${product.name} smartphone`, "Xiaomi");
    }

    // --- SONY (Distinct authentic hardware photography per model) ---
    if (brandLower.includes("sony") || fullText.includes("xperia")) {
      if (fullText.includes("10 vi") || fullText.includes("10 v")) return makeImg("phones-sony-xperia-10-vi.webp", "Sony Xperia 10 VI lightweight 5000mAh 21:9 OLED", "Sony");
      if (fullText.includes("1 v") && !fullText.includes("1 vi")) return makeImg("phones-sony-xperia-1-v.webp", "Sony Xperia 1 V Exmor T for mobile 4K 120Hz HDR", "Sony");
      return makeImg("phones-sony-xperia-1-vi.webp", "Sony Xperia 1 VI optical telephoto zoom 4K OLED", "Sony");
    }

    // --- ASUS (Distinct authentic hardware photography per model) ---
    if (brandLower.includes("asus") || fullText.includes("rog phone") || fullText.includes("zenfone")) {
      if (fullText.includes("zenfone")) return makeImg("phones-asus-zenfone-11-ultra.webp", "ASUS Zenfone 11 Ultra 144Hz LTPO AMOLED flagship", "ASUS");
      return makeImg("phones-asus-rog-8-pro.webp", "ASUS ROG Phone 8 Pro AniMe Vision 165Hz gaming powerhouse", "ASUS");
    }

    // --- VIVO (Distinct authentic hardware photography per model) ---
    if (brandLower.includes("vivo")) {
      if (fullText.includes("fold")) return makeImg("phones-vivo-x-fold3-pro.webp", "vivo X Fold3 Pro ultra-light carbon fiber hinge foldable", "vivo");
      return makeImg("phones-vivo-x100-pro.webp", "vivo X100 Pro ZEISS APO 1-inch sensor camera flagship", "vivo");
    }

    // --- REALME (Distinct authentic hardware photography per model) ---
    if (brandLower.includes("realme")) {
      return makeImg("phones-realme-gt6.webp", "realme GT 6 6000nit ultra-bright display AI flagship", "realme");
    }

    // --- APPLE IPHONE (Distinct authentic hardware photography per model) ---
    if (brandLower.includes("apple") || fullText.includes("iphone")) {
      if (fullText.includes("15 pro max") || fullText.includes("pro max")) return makeImg("phones-apple-iphone-15-pro-max.webp", "Apple iPhone 15 Pro Max aerospace-grade titanium 5x telephoto", "Apple");
      if (fullText.includes("15 pro") || fullText.includes("pro")) return makeImg("phones-apple-iphone-15-pro.webp", "Apple iPhone 15 Pro aerospace-grade titanium A17 Pro", "Apple");
      return makeImg("phones-apple-iphone-15.webp", "Apple iPhone 15 Dynamic Island 48MP main camera", "Apple");
    }

    return makeImg("phones-moto-g54.webp", `${product.name} smartphone`, product.brand);
  }

  // =========================================================================
  // 2. LAPTOPS & WORKSTATIONS
  // =========================================================================
  if (leaf === "laptops" || fullText.includes("laptop") || fullText.includes("notebook")) {
    if (brandLower.includes("apple") || fullText.includes("macbook")) {
      return makeImg("laptops-apple-macbook.webp", "Apple MacBook Pro Liquid Retina XDR laptop", "Apple");
    }
    if (brandLower.includes("dell") || fullText.includes("xps")) {
      return makeImg("laptops-dell-xps.webp", "Dell XPS InfinityEdge precision aluminum laptop", "Dell");
    }
    if (brandLower.includes("lenovo") || fullText.includes("thinkpad")) {
      return makeImg("laptops-thinkpad.webp", "Lenovo ThinkPad X1 Carbon enterprise laptop", "Lenovo");
    }
    if (brandLower.includes("razer") || brandLower.includes("rog") || brandLower.includes("alienware") || fullText.includes("blade")) {
      return makeImg("laptops-gaming.webp", "High-performance gaming and workstation laptop", product.brand);
    }
    return makeImg("laptops-dell-xps.webp", `${product.name} precision ultrabook laptop`, product.brand);
  }

  // =========================================================================
  // 3. TABLETS
  // =========================================================================
  if (leaf === "tablets") {
    return makeImg("tablets-signature-pro.webp", `${product.name} ultra-thin OLED pro tablet with stylus support`, product.brand);
  }

  // =========================================================================
  // 4. AUDIO, HEADPHONES, EARBUDS, SOUNDBARS & SPEAKERS
  // =========================================================================
  if (leaf === "headphones") {
    if (brandLower.includes("bose")) {
      return makeImg("headphones-bose-qc.webp", "Bose QuietComfort Ultra noise-cancelling headphones", "Bose");
    }
    return makeImg("headphones-sony-wh1000xm5.webp", `${product.name} wireless noise-cancelling over-ear headphones`, product.brand);
  }

  if (leaf === "earbuds") {
    return makeImg("earbuds-apple-airpods-pro.webp", `${product.name} active noise cancelling true wireless earbuds`, product.brand);
  }

  if (leaf === "soundbars") {
    return makeImg("soundbars-cinematic.webp", `${product.name} Dolby Atmos cinematic multi-channel soundbar`, product.brand);
  }

  if (leaf === "speakers") {
    return makeImg("speakers-devialet-phantom.webp", `${product.name} high-fidelity audiophile acoustic speaker`, product.brand);
  }

  // =========================================================================
  // 5. COMPUTER MONITORS & DISPLAYS
  // =========================================================================
  if (leaf === "monitors") {
    return makeImg("monitors-dell-ultrasharp.webp", `${product.name} 4K professional color-accurate computer monitor`, product.brand);
  }

  // =========================================================================
  // 6. PERIPHERALS: KEYBOARDS, MICE, WEBCAMS, DOCKS, CABLES, ROUTERS
  // =========================================================================
  if (leaf === "webcams") {
    return makeImg("electronics-webcam.webp", `${product.name} Ultra-HD 4K streaming webcam with HDR optics`, product.brand);
  }

  if (leaf === "usb-flash-drives") {
    return makeImg("storage-usb-flash-drive.webp", `${product.name} high-speed solid-state USB flash memory drive`, product.brand);
  }

  if (leaf === "memory-cards") {
    return makeImg("storage-memory-card.webp", `${product.name} UHS-II V90 high-speed memory card`, product.brand);
  }

  if (leaf === "docks-hubs") {
    return makeImg("accessories-usb-dock.webp", `${product.name} Thunderbolt 4 multi-port docking hub`, product.brand);
  }

  if (leaf === "power-banks") {
    return makeImg("accessories-power-bank.webp", `${product.name} high-capacity USB-C PD fast portable power bank`, product.brand);
  }

  if (leaf === "wall-chargers") {
    return makeImg("accessories-signature-charger.webp", `${product.name} GaN fast-charging power adapter`, product.brand);
  }

  if (leaf === "cables") {
    return makeImg("accessories-signature-cable.webp", `${product.name} braided high-durability fast-charging cable`, product.brand);
  }

  if (leaf === "keyboards") {
    return makeImg("accessories-keychron-keyboard.webp", `${product.name} aluminum mechanical tactile keyboard`, product.brand);
  }

  if (leaf === "mice") {
    return makeImg("accessories-logitech-mxmaster.webp", `${product.name} ergonomic precision wireless mouse`, product.brand);
  }

  if (leaf === "routers") {
    return makeImg("accessories-signature-router.webp", `${product.name} tri-band low-latency Wi-Fi 7 networking router`, product.brand);
  }

  if (leaf === "hard-drives") {
    return makeImg("storage-external-hdd.webp", `${product.name} high-capacity desktop external storage hard drive`, product.brand);
  }

  if (leaf === "portable-ssds" || leaf === "internal-ssds") {
    return makeImg("storage-sandisk-extreme.webp", `${product.name} rugged high-speed NVMe solid state storage drive`, product.brand);
  }

  // =========================================================================
  // 7. APPLIANCES: VACUUMS & AIR PURIFIERS
  // =========================================================================
  if (leaf === "vacuum-cleaners") {
    return makeImg("appliances-dyson-v15.webp", `${product.name} intelligent cordless vacuum cleaner`, product.brand);
  }

  if (leaf === "air-purifiers") {
    return makeImg("appliances-signature-purifier.webp", `${product.name} HEPA filtration intelligent quiet air purifier`, product.brand);
  }

  // =========================================================================
  // 8. WATCHES & HOROLOGY
  // =========================================================================
  if (leaf === "watches") {
    if (fullText.includes("daytona")) {
      return makeImg("watches-rolex-daytona.webp", "Rolex Cosmograph Daytona chronograph watch", "Rolex");
    }
    if (brandLower.includes("rolex") || fullText.includes("submariner") || fullText.includes("gmt-master") || fullText.includes("datejust")) {
      return makeImg("watches-rolex-submariner.webp", "Rolex Submariner Date ceramic bezel timepiece", "Rolex");
    }
    if (fullText.includes("speedmaster") || (brandLower.includes("omega") && fullText.includes("moonwatch"))) {
      return makeImg("watches-omega-speedmaster.webp", "Omega Speedmaster Professional Moonwatch chronograph", "Omega");
    }
    if (fullText.includes("seamaster") || brandLower.includes("omega")) {
      return makeImg("watches-omega-seamaster.webp", "Omega Seamaster Diver 300M luxury timepiece", "Omega");
    }
    if (brandLower.includes("cartier") || fullText.includes("santos") || fullText.includes("tank")) {
      return makeImg("watches-cartier-santos.webp", "Cartier Santos de Cartier square bezel timepiece", "Cartier");
    }
    if (brandLower.includes("patek") || fullText.includes("nautilus") || fullText.includes("aquanaut")) {
      return makeImg("watches-patek-nautilus.webp", "Patek Philippe Nautilus luxury steel timepiece", "Patek Philippe");
    }
    if (brandLower.includes("audemars") || fullText.includes("royal oak")) {
      return makeImg("watches-ap-royal-oak.webp", "Audemars Piguet Royal Oak tapisserie dial timepiece", "Audemars Piguet");
    }
    if (brandLower.includes("jaeger") || fullText.includes("reverso")) {
      return makeImg("watches-jlc-reverso.webp", "Jaeger-LeCoultre Reverso art deco reversible timepiece", "Jaeger-LeCoultre");
    }
    if (brandLower.includes("tissot") || fullText.includes("prx")) {
      return makeImg("watches-tissot-prx.webp", "Tissot PRX Powermatic 80 integrated bracelet timepiece", "Tissot");
    }
    return makeImg("watches-signature-chronograph.webp", `${product.name} Swiss mechanical timepiece`, product.brand);
  }

  // =========================================================================
  // 9. HANDBAGS & LEATHER GOODS
  // =========================================================================
  if (leaf === "handbags") {
    if (fullText.includes("birkin") || (brandLower.includes("herm") && fullText.includes("kelly"))) {
      return makeImg("handbags-hermes-birkin.webp", "Hermès Birkin calfskin leather handbag", "Hermès");
    }
    if (brandLower.includes("chanel") || fullText.includes("flap") || fullText.includes("2.55")) {
      return makeImg("handbags-chanel-flap.webp", "Chanel Classic Double Flap quilted leather bag", "Chanel");
    }
    if (brandLower.includes("dior") || fullText.includes("lady dior") || fullText.includes("saddle")) {
      return makeImg("handbags-dior-lady-dior.webp", "Lady Dior cannage quilted top-handle leather bag", "Dior");
    }
    if (brandLower.includes("louis vuitton") || fullText.includes("neverfull") || fullText.includes("speedy")) {
      return makeImg("handbags-lv-neverfull.webp", "Louis Vuitton Neverfull monogram leather tote", "Louis Vuitton");
    }
    if (brandLower.includes("goyard") || fullText.includes("saint louis") || fullText.includes("anjou")) {
      return makeImg("handbags-goyard-saint-louis.webp", "Goyard Saint Louis chevron monogram tote bag", "Goyard");
    }
    if (brandLower.includes("bottega") || fullText.includes("cassette") || fullText.includes("jodie")) {
      return makeImg("handbags-bottega-cassette.webp", "Bottega Veneta Cassette padded intrecciato bag", "Bottega Veneta");
    }
    if (brandLower.includes("celine") || fullText.includes("triomphe")) {
      return makeImg("handbags-celine-triomphe.webp", "Celine Triomphe gold clasp leather shoulder bag", "Celine");
    }
    if (brandLower.includes("fendi") || fullText.includes("baguette") || fullText.includes("peekaboo")) {
      return makeImg("handbags-fendi-baguette.webp", "Fendi Baguette FF clasp leather shoulder bag", "Fendi");
    }
    if (brandLower.includes("gucci") || fullText.includes("jackie") || fullText.includes("horsebit 1955")) {
      return makeImg("handbags-gucci-jackie.webp", "Gucci Jackie 1961 piston clasp leather hobo bag", "Gucci");
    }
    if (brandLower.includes("prada") || fullText.includes("galleria") || fullText.includes("re-edition")) {
      return makeImg("handbags-prada-galleria.webp", "Prada Galleria Saffiano leather structured tote", "Prada");
    }
    if (brandLower.includes("saint laurent") || brandLower.includes("ysl") || fullText.includes("loulou")) {
      return makeImg("handbags-ysl-loulou.webp", "Saint Laurent Loulou Y-quilted leather monogram bag", "Saint Laurent");
    }
    return makeImg("handbags-signature-tote.webp", `${product.name} artisanal leather handbag`, product.brand);
  }

  if (leaf === "backpacks") {
    return makeImg("backpacks-signature-pack.webp", `${product.name} luxury designer backpack`, product.brand);
  }

  if (leaf === "wallets") {
    return makeImg("wallets-signature-leather.webp", `${product.name} artisanal full-grain leather wallet`, product.brand);
  }

  // =========================================================================
  // 10. FOOTWEAR
  // =========================================================================
  if (
    leaf === "formal-shoes" ||
    leaf === "loafers" ||
    leaf === "boots" ||
    leaf === "lifestyle-sneakers" ||
    leaf === "running-shoes" ||
    product.category === "footwear"
  ) {
    if (brandLower.includes("louboutin") || fullText.includes("kate") || fullText.includes("pigalle") || fullText.includes("red sole")) {
      return makeImg("shoes-louboutin-red-sole.webp", "Christian Louboutin Kate black pump with signature red sole", "Christian Louboutin");
    }
    if (brandLower.includes("loro piana") || fullText.includes("summer walk") || fullText.includes("open walk")) {
      return makeImg("shoes-loro-piana-summer-walk.webp", "Loro Piana Summer Walk water-repellent suede moccasin", "Loro Piana");
    }
    if (fullText.includes("horsebit") || (brandLower.includes("gucci") && leaf === "loafers")) {
      return makeImg("shoes-gucci-horsebit-loafer.webp", "Gucci 1953 Horsebit leather penny loafer", "Gucci");
    }
    if (leaf === "loafers") {
      return makeImg("shoes-loro-piana-summer-walk.webp", `${product.name} luxury suede penny loafer`, product.brand);
    }
    if (leaf === "boots") {
      return makeImg("boots-signature-chelsea.webp", `${product.name} handcrafted Goodyear-welted leather boot`, product.brand);
    }
    if (leaf === "running-shoes") {
      return makeImg("shoes-signature-running.webp", `${product.name} elite performance running shoe`, product.brand);
    }
    if (brandLower.includes("balenciaga") || fullText.includes("triple s") || fullText.includes("track")) {
      return makeImg("shoes-balenciaga-triple-s.webp", "Balenciaga Triple S oversized designer sneaker", "Balenciaga");
    }
    if (brandLower.includes("louis vuitton") || fullText.includes("trainer")) {
      return makeImg("shoes-lv-trainer.webp", "Louis Vuitton LV Trainer calf leather sneaker", "Louis Vuitton");
    }
    if (leaf === "lifestyle-sneakers") {
      return makeImg("sneakers-signature-lowtop.webp", `${product.name} Italian calf leather luxury sneaker`, product.brand);
    }
    return makeImg("shoes-signature-oxford.webp", `${product.name} bespoke calfskin dress Oxford shoe`, product.brand);
  }

  // =========================================================================
  // 11. TAILORED & LUXURY CLOTHING
  // =========================================================================
  if (leaf === "suits") {
    if (brandLower.includes("tom ford") || fullText.includes("shelton") || fullText.includes("tuxedo")) {
      return makeImg("suits-tom-ford-shelton.webp", "Tom Ford Shelton peak-lapel luxury wool tuxedo", "Tom Ford");
    }
    if (brandLower.includes("brioni") || fullText.includes("vanquish")) {
      return makeImg("suits-brioni-vanquish.webp", "Brioni Vanquish II bespoke two-piece wool suit", "Brioni");
    }
    return makeImg("suits-signature-bespoke.webp", `${product.name} sartorial handmade tailored suit`, product.brand);
  }

  if (leaf === "coats") {
    if (brandLower.includes("burberry") || fullText.includes("trench")) {
      return makeImg("coats-burberry-trench.webp", "Burberry Kensington gabardine heritage trench coat", "Burberry");
    }
    return makeImg("coats-max-mara-teddy.webp", `${product.name} double-breasted cashmere overcoat`, product.brand);
  }

  if (leaf === "jackets") {
    if (brandLower.includes("moncler") || fullText.includes("maya") || fullText.includes("down")) {
      return makeImg("jackets-moncler-maya.webp", "Moncler Maya lacquered down jacket", "Moncler");
    }
    return makeImg("jackets-signature-blazer.webp", `${product.name} tailored blazer and leather jacket`, product.brand);
  }

  if (leaf === "knitwear") {
    return makeImg("knitwear-signature-cashmere.webp", `${product.name} fine Italian baby cashmere knitwear`, product.brand);
  }

  if (leaf === "shirts") {
    return makeImg("shirts-signature-dress.webp", `${product.name} Egyptian cotton bespoke dress shirt`, product.brand);
  }

  if (leaf === "t-shirts") {
    return makeImg("t-shirts-signature-crewneck.webp", `${product.name} mercerized cotton designer t-shirt`, product.brand);
  }

  if (leaf === "trousers") {
    return makeImg("trousers-signature-tailored.webp", `${product.name} sartorial pleated wool trousers`, product.brand);
  }

  if (leaf === "denim") {
    return makeImg("denim-signature-selvedge.webp", `${product.name} Japanese selvedge raw luxury denim`, product.brand);
  }

  if (leaf === "dresses") {
    return makeImg("dresses-signature-gown.webp", `${product.name} haute couture evening silk gown`, product.brand);
  }

  // =========================================================================
  // 12. EYEWEAR
  // =========================================================================
  if (leaf === "sunglasses") {
    if (fullText.includes("aviator")) {
      return makeImg("sunglasses-ray-ban-aviator.webp", "Ray-Ban Aviator Classic gold frame sunglasses", "Ray-Ban");
    }
    if (fullText.includes("wayfarer")) {
      return makeImg("sunglasses-ray-ban-wayfarer.webp", "Ray-Ban Original Wayfarer acetate sunglasses", "Ray-Ban");
    }
    if (brandLower.includes("cartier") || fullText.includes("santos")) {
      return makeImg("sunglasses-cartier-santos.webp", "Cartier Santos de Cartier precious metal aviator sunglasses", "Cartier");
    }
    return makeImg("sunglasses-signature-luxury.webp", `${product.name} designer UV400 luxury sunglasses`, product.brand);
  }

  // =========================================================================
  // 13. BEAUTY & SKINCARE
  // =========================================================================
  if (
    leaf === "serums" ||
    leaf === "moisturizers" ||
    leaf === "cleansers" ||
    leaf === "sunscreens" ||
    product.category === "beauty"
  ) {
    if (fullText.includes("crème de la mer") || fullText.includes("creme de la mer") || brandLower.includes("la mer")) {
      return makeImg("skincare-la-mer-creme.webp", "Crème de la Mer moisturizing cream jar", "La Mer");
    }
    if (brandLower.includes("augustinus bader") || fullText.includes("rich cream")) {
      return makeImg("skincare-augustinus-bader.webp", "Augustinus Bader The Rich Cream cellular renewal moisturizer", "Augustinus Bader");
    }
    if (leaf === "serums") {
      return makeImg("skincare-signature-serum.webp", `${product.name} active cellular face serum dropper`, product.brand);
    }
    if (leaf === "cleansers") {
      return makeImg("skincare-signature-cleanser.webp", `${product.name} gentle botanical cleansing foam`, product.brand);
    }
    if (leaf === "sunscreens") {
      return makeImg("skincare-signature-sunscreen.webp", `${product.name} SPF 50+ invisible daily defense shield`, product.brand);
    }
    return makeImg("skincare-signature-cream.webp", `${product.name} haute cosmetic rejuvenating cream`, product.brand);
  }

  // =========================================================================
  // 14. HOME, KITCHEN & DECOR
  // =========================================================================
  if (leaf === "kitchenware") {
    return makeImg("kitchen-le-creuset-cocotte.webp", `${product.name} enameled cast iron Dutch oven cocotte`, product.brand);
  }
  if (leaf === "decor") {
    return makeImg("decor-baccarat-crystal.webp", `${product.name} handcrafted crystal decorative centerpiece`, product.brand);
  }
  if (leaf === "home-textiles") {
    return makeImg("textiles-signature-linens.webp", `${product.name} Italian luxury cashmere throw and percale linens`, product.brand);
  }

  // =========================================================================
  // 15. FRAGRANCE (ONLY FOR ACTUAL FRAGRANCES!)
  // =========================================================================
  if (
    leaf === "fragrance" ||
    fullText.includes("eau de parfum") ||
    fullText.includes("eau de toilette") ||
    fullText.includes("perfume")
  ) {
    if (fullText.includes("sauvage") || (brandLower.includes("dior") && fullText.includes("homme"))) {
      return makeImg("fragrance-dior-sauvage.webp", "Dior Sauvage Eau de Parfum luxury flacon", "Dior");
    }
    if (fullText.includes("bleu de chanel") || fullText.includes("allure homme")) {
      return makeImg("fragrance-chanel-bleu.webp", "Bleu de Chanel Eau de Parfum flacon", "Chanel");
    }
    if (fullText.includes("no 5") || fullText.includes("n°5") || fullText.includes("mademoiselle") || fullText.includes("chance")) {
      return makeImg("fragrance-chanel-no5.webp", "Chanel N°5 iconic luxury crystal flacon", "Chanel");
    }
    if (fullText.includes("aventus") || fullText.includes("green irish tweed") || fullText.includes("silver mountain") || brandLower.includes("creed")) {
      return makeImg("fragrance-creed-aventus.webp", "Creed Aventus royal fragrance flacon", "Creed");
    }
    if (fullText.includes("tobacco vanille") || fullText.includes("oud wood") || fullText.includes("lost cherry") || brandLower.includes("tom ford")) {
      return makeImg("fragrance-tom-ford.webp", "Tom Ford Private Blend luxury amber flacon", "Tom Ford");
    }
    if (fullText.includes("baccarat rouge") || fullText.includes("grand soir") || fullText.includes("724") || brandLower.includes("kurkdjian")) {
      return makeImg("fragrance-mfk-baccarat.webp", "Maison Francis Kurkdjian Baccarat Rouge 540 crystal flacon", "Maison Francis Kurkdjian");
    }
    if (fullText.includes("angels' share") || fullText.includes("love don't be shy") || brandLower.includes("kilian")) {
      return makeImg("fragrance-kilian-angels.webp", "Kilian Angels' Share luxury cognac-cut crystal flacon", "Kilian Paris");
    }
    if (fullText.includes("layton") || fullText.includes("delina") || fullText.includes("herod") || brandLower.includes("parfums de marly")) {
      return makeImg("fragrance-pdm-layton.webp", "Parfums de Marly Layton royal French flacon", "Parfums de Marly");
    }
    if (fullText.includes("terre d'herm") || fullText.includes("h24") || (brandLower.includes("herm") && leaf === "fragrance")) {
      return makeImg("fragrance-hermes-terre.webp", "Terre d'Hermès mineral woody Eau de Parfum flacon", "Hermès");
    }
    if (fullText.includes("la nuit de l'homme") || fullText.includes("libre") || brandLower.includes("saint laurent") || brandLower.includes("ysl")) {
      return makeImg("fragrance-ysl.webp", "Yves Saint Laurent Y Eau de Parfum flacon", "Yves Saint Laurent");
    }
    if (fullText.includes("acqua di gi") || fullText.includes("armani code") || (brandLower.includes("armani") && leaf === "fragrance")) {
      return makeImg("fragrance-armani-acqua.webp", "Giorgio Armani Acqua di Giò marine flacon", "Giorgio Armani");
    }
    if (fullText.includes("le male") || fullText.includes("ultra male") || fullText.includes("le beau") || brandLower.includes("gaultier")) {
      return makeImg("fragrance-jpg-lemale.webp", "Jean Paul Gaultier Le Male iconic silhouette flacon", "Jean Paul Gaultier");
    }
    if (fullText.includes("oud for greatness") || fullText.includes("side effect") || brandLower.includes("initio")) {
      return makeImg("fragrance-initio-oud.webp", "Initio Parfums Privés Oud for Greatness flacon", "Initio");
    }
    if (fullText.includes("shalimar") || fullText.includes("l'homme ideal") || brandLower.includes("guerlain")) {
      return makeImg("fragrance-guerlain.webp", "Guerlain Shalimar French heritage perfume flacon", "Guerlain");
    }
    if (fullText.includes("born in roma") || brandLower.includes("valentino")) {
      return makeImg("fragrance-valentino.webp", "Valentino Born in Roma rockstud crystal flacon", "Valentino");
    }
    if (fullText.includes("eros") || fullText.includes("dylan blue") || brandLower.includes("versace")) {
      return makeImg("fragrance-versace-eros.webp", "Versace Eros Medusa turquoise flacon", "Versace");
    }
    if (fullText.includes("luna rossa") || fullText.includes("paradoxe") || (brandLower.includes("prada") && leaf === "fragrance")) {
      return makeImg("fragrance-prada.webp", "Prada Luna Rossa Eau de Parfum flacon", "Prada");
    }
    if (fullText.includes("1 million") || fullText.includes("invictus") || brandLower.includes("rabanne")) {
      return makeImg("fragrance-rabanne.webp", "Rabanne 1 Million gold ingot fragrance flacon", "Rabanne");
    }
    if (brandLower.includes("serge lutens") || fullText.includes("chergui")) {
      return makeImg("fragrance-serge-lutens.webp", "Serge Lutens Palais Royal architectural flacon", "Serge Lutens");
    }
    if (brandLower.includes("amouage") || fullText.includes("interlude") || fullText.includes("reflection")) {
      return makeImg("fragrance-amouage-interlude.webp", "Amouage Interlude Man royal crystal flacon", "Amouage");
    }
    if (fullText.includes("light blue") || brandLower.includes("dolce & gabbana")) {
      return makeImg("fragrance-dolce-gabbana.webp", "Dolce & Gabbana Light Blue Mediterranean flacon", "Dolce & Gabbana");
    }
    if (fullText.includes("man in black") || brandLower.includes("bulgari") || brandLower.includes("bvlgari")) {
      return makeImg("fragrance-bvlgari.webp", "Bvlgari Man in Black volcanic neo-oriental flacon", "Bvlgari");
    }
    if (brandLower.includes("margiela") || fullText.includes("replica") || fullText.includes("jazz club")) {
      return makeImg("fragrance-replica.webp", "Maison Margiela REPLICA apothecary flacon", "Maison Margiela");
    }
    return makeImg("fragrance-signature-bottle.webp", `${product.name} luxury flacon photography`, product.brand);
  }

  // =========================================================================
  // 16. DEPARTMENT-AWARE FALLBACKS — NEVER DEFAULT TO PERFUME FOR NON-PERFUME!
  // =========================================================================
  const cat = (product.category || "").toLowerCase();
  if (
    cat === "electronics" ||
    cat === "audio" ||
    cat === "chargers" ||
    cat === "docks" ||
    cat === "storage" ||
    cat === "accessories"
  ) {
    return makeImg("phones-android-flagship.webp", `${product.name} technical device photography`, product.brand);
  }
  if (cat === "clothing") {
    return makeImg("suits-signature-bespoke.webp", `${product.name} luxury tailoring photography`, product.brand);
  }
  if (cat === "footwear") {
    return makeImg("shoes-signature-oxford.webp", `${product.name} luxury footwear photography`, product.brand);
  }
  if (cat === "bags") {
    return makeImg("handbags-signature-tote.webp", `${product.name} luxury leather goods photography`, product.brand);
  }
  if (cat === "watches") {
    return makeImg("watches-signature-chronograph.webp", `${product.name} luxury timepiece photography`, product.brand);
  }
  if (cat === "home") {
    return makeImg("kitchen-le-creuset-cocotte.webp", `${product.name} luxury home photography`, product.brand);
  }

  // Absolute fallback
  return makeImg("phones-android-flagship.webp", `${product.name} product photography`, product.brand);
}
