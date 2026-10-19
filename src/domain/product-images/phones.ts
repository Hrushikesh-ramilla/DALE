import { ProductQuery, ProductImageResolution, makeImg } from "./types";

export function resolvePhoneImage(product: ProductQuery): ProductImageResolution | null {
  const nameLower = (product.name || "").toLowerCase();
  const brandLower = (product.brand || "").toLowerCase();
  const modelLower = (
    product.modelName ||
    (product.attributes?.modelName as string) ||
    ""
  ).toLowerCase();
  const fullText = `${nameLower} ${brandLower} ${modelLower}`;
  const leaf = (product.leafType || product.category || "").toLowerCase();

  const isPhone =
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
    ));

  if (!isPhone) return null;

  // --- MOTOROLA ---
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

  // --- SAMSUNG ---
  if (brandLower.includes("samsung") || fullText.includes("galaxy")) {
    if (fullText.includes("s25 ultra")) return makeImg("phones-samsung-s25-ultra.webp", "Samsung Galaxy S25 Ultra Titanium AI flagship", "Samsung");
    if (fullText.includes("s24 ultra")) return makeImg("phones-samsung-s24-ultra.webp", "Samsung Galaxy S24 Ultra Titanium 200MP Quad Tele", "Samsung");
    if (fullText.includes("s24+") || fullText.includes("s24 plus")) return makeImg("phones-samsung-s24-plus.webp", "Samsung Galaxy S24+ QHD+ Dynamic AMOLED 2X", "Samsung");
    if (fullText.includes("s24 fe")) return makeImg("phones-samsung-s24-fe.webp", "Samsung Galaxy S24 FE Galaxy AI Dynamic AMOLED", "Samsung");
    if (fullText.includes("s24")) return makeImg("phones-samsung-s24.webp", "Samsung Galaxy S24 Dynamic AMOLED 2X smartphone", "Samsung");
    if (fullText.includes("fold6") || fullText.includes("fold 6") || fullText.includes("z fold")) return makeImg("phones-samsung-z-fold6.webp", "Samsung Galaxy Z Fold6 dual screen book foldable", "Samsung");
    if (fullText.includes("flip6") || fullText.includes("flip 6") || fullText.includes("z flip")) return makeImg("phones-samsung-z-flip6.webp", "Samsung Galaxy Z Flip6 FlexWindow compact flip phone", "Samsung");
    if (fullText.includes("s23 ultra")) return makeImg("phones-samsung-s23-ultra.webp", "Samsung Galaxy S23 Ultra S-Pen camera flagship", "Samsung");
    if (fullText.includes("s23")) return makeImg("phones-samsung-s23.webp", "Samsung Galaxy S23 Dynamic AMOLED smartphone", "Samsung");
    if (fullText.includes("a55")) return makeImg("phones-samsung-a55.webp", "Samsung Galaxy A55 5G Metal Frame Super AMOLED", "Samsung");
    if (fullText.includes("a35")) return makeImg("phones-samsung-a35.webp", "Samsung Galaxy A35 5G Infinity-O display smartphone", "Samsung");
    return makeImg("phones-samsung-s24-ultra.webp", `${product.name} smartphone`, "Samsung");
  }

  // --- GOOGLE PIXEL ---
  if (brandLower.includes("google") || fullText.includes("pixel")) {
    if (fullText.includes("9 pro fold")) return makeImg("phones-pixel-9-pro-fold.webp", "Google Pixel 9 Pro Fold foldable smartphone", "Google");
    if (fullText.includes("9 pro xl")) return makeImg("phones-pixel-9-pro-xl.webp", "Google Pixel 9 Pro XL Tensor G4 Super Actua display", "Google");
    if (fullText.includes("9 pro")) return makeImg("phones-pixel-9-pro.webp", "Google Pixel 9 Pro compact telephoto flagship", "Google");
    if (fullText.includes("pixel 9")) return makeImg("phones-pixel-9.webp", "Google Pixel 9 Actua OLED smartphone", "Google");
    if (fullText.includes("8 pro")) return makeImg("phones-pixel-8-pro.webp", "Google Pixel 8 Pro Tensor G3 telephoto flagship", "Google");
    if (fullText.includes("8a")) return makeImg("phones-pixel-8a.webp", "Google Pixel 8a 120Hz Actua display smartphone", "Google");
    if (fullText.includes("pixel 8")) return makeImg("phones-pixel-8.webp", "Google Pixel 8 Actua display Tensor G3 smartphone", "Google");
    if (fullText.includes("7 pro")) return makeImg("phones-pixel-7-pro.webp", "Google Pixel 7 Pro LTPO 120Hz triple camera flagship", "Google");
    if (fullText.includes("7a")) return makeImg("phones-pixel-7a.webp", "Google Pixel 7a 90Hz OLED dual camera smartphone", "Google");
    if (fullText.includes("pixel 7")) return makeImg("phones-pixel-7.webp", "Google Pixel 7 Tensor G2 smartphone", "Google");
    return makeImg("phones-pixel-8-pro.webp", `${product.name} smartphone`, "Google");
  }

  // --- ONEPLUS ---
  if (brandLower.includes("oneplus")) {
    if (fullText.includes("open")) return makeImg("phones-oneplus-open.webp", "OnePlus Open Dual ProXDR displays foldable flagship", "OnePlus");
    if (fullText.includes("13")) return makeImg("phones-oneplus-13.webp", "OnePlus 13 Snapdragon 8 Elite flagship", "OnePlus");
    if (fullText.includes("12r")) return makeImg("phones-oneplus-12r.webp", "OnePlus 12R 4th Gen LTPO 5500mAh smartphone", "OnePlus");
    if (fullText.includes("12")) return makeImg("phones-oneplus-12.webp", "OnePlus 12 4th Gen Hasselblad camera Snapdragon 8 Gen 3", "OnePlus");
    if (fullText.includes("11r")) return makeImg("phones-oneplus-11r.webp", "OnePlus 11R 100W SUPERVOOC smartphone", "OnePlus");
    if (fullText.includes("11")) return makeImg("phones-oneplus-11.webp", "OnePlus 11 5G Hasselblad camera flagship", "OnePlus");
    if (fullText.includes("10 pro")) return makeImg("phones-oneplus-10-pro.webp", "OnePlus 10 Pro Hasselblad smartphone", "OnePlus");
    if (fullText.includes("10t")) return makeImg("phones-oneplus-10t.webp", "OnePlus 10T 150W SUPERVOOC smartphone", "OnePlus");
    if (fullText.includes("nord ce4 lite")) return makeImg("phones-oneplus-nord-ce4-lite.webp", "OnePlus Nord CE4 Lite AMOLED 80W smartphone", "OnePlus");
    if (fullText.includes("nord ce4")) return makeImg("phones-oneplus-nord-ce4.webp", "OnePlus Nord CE4 Snapdragon 7 Gen 3 smartphone", "OnePlus");
    if (fullText.includes("nord 4") || fullText.includes("nord")) return makeImg("phones-oneplus-nord-4.webp", "OnePlus Nord 4 metal unibody 5G smartphone", "OnePlus");
    return makeImg("phones-oneplus-12.webp", `${product.name} smartphone`, "OnePlus");
  }

  // --- NOTHING & CMF ---
  if (brandLower.includes("nothing") || fullText.includes("cmf")) {
    if (fullText.includes("cmf")) return makeImg("phones-nothing-cmf-1.webp", "CMF Phone 1 modular back cover Super AMOLED smartphone", "Nothing");
    if (fullText.includes("2a plus") || fullText.includes("(2a) plus")) return makeImg("phones-nothing-phone-2a-plus.webp", "Nothing Phone (2a) Plus metallic finish Glyph smartphone", "Nothing");
    if (fullText.includes("2a") || fullText.includes("phone (2a)")) return makeImg("phones-nothing-phone-2a.webp", "Nothing Phone (2a) custom Dimensity 7200 Pro Glyph", "Nothing");
    if (fullText.includes("phone (2)") || fullText.includes("phone 2")) return makeImg("phones-nothing-phone-2.webp", "Nothing Phone (2) transparent glass Glyph interface", "Nothing");
    if (fullText.includes("phone (1)") || fullText.includes("phone 1")) return makeImg("phones-nothing-phone-1.webp", "Nothing Phone (1) iconic transparent back 120Hz OLED", "Nothing");
    return makeImg("phones-nothing-phone-2.webp", `${product.name} smartphone`, "Nothing");
  }

  // --- XIAOMI / REDMI / POCO ---
  if (brandLower.includes("xiaomi") || fullText.includes("redmi") || fullText.includes("poco")) {
    if (fullText.includes("15")) return makeImg("phones-xiaomi-15.webp", "Xiaomi 15 compact Snapdragon 8 Elite flagship", "Xiaomi");
    if (fullText.includes("14 ultra")) return makeImg("phones-xiaomi-14-ultra.webp", "Xiaomi 14 Ultra Leica quad-camera 1-inch sensor flagship", "Xiaomi");
    if (fullText.includes("14 civi") || fullText.includes("civi")) return makeImg("phones-xiaomi-14-civi.webp", "Xiaomi 14 CIVI dual front camera floating quad-curved display", "Xiaomi");
    if (fullText.includes("14")) return makeImg("phones-xiaomi-14.webp", "Xiaomi 14 compact Leica Summilux flagship", "Xiaomi");
    if (fullText.includes("13 pro")) return makeImg("phones-xiaomi-13-pro.webp", "Xiaomi 13 Pro 1-inch IMX989 Leica 75mm floating telephoto", "Xiaomi");
    if (fullText.includes("redmi note 13 pro+") || fullText.includes("note 13 pro+")) return makeImg("phones-xiaomi-redmi-note-13-pro-plus.webp", "Redmi Note 13 Pro+ 200MP OIS curved AMOLED", "Xiaomi");
    if (fullText.includes("redmi note 13 pro") || fullText.includes("note 13 pro")) return makeImg("phones-xiaomi-redmi-note-13-pro.webp", "Redmi Note 13 Pro 200MP camera smartphone", "Xiaomi");
    if (fullText.includes("redmi note 13") || fullText.includes("note 13")) return makeImg("phones-xiaomi-redmi-note-13.webp", "Redmi Note 13 5G slim AMOLED smartphone", "Xiaomi");
    if (fullText.includes("redmi 13c") || fullText.includes("13c")) return makeImg("phones-xiaomi-redmi-13c.webp", "Redmi 13C 5G 50MP AI camera smartphone", "Xiaomi");
    if (fullText.includes("poco f6 pro")) return makeImg("phones-xiaomi-poco-f6-pro.webp", "POCO F6 Pro WQHD+ 120Hz Flow AMOLED flagship killer", "POCO");
    if (fullText.includes("poco x6 pro") || fullText.includes("poco")) return makeImg("phones-xiaomi-poco-x6-pro.webp", "POCO X6 Pro Dimensity 8300-Ultra smartphone", "POCO");
    return makeImg("phones-xiaomi-14.webp", `${product.name} smartphone`, "Xiaomi");
  }

  // --- SONY ---
  if (brandLower.includes("sony") || fullText.includes("xperia")) {
    if (fullText.includes("pro-i")) return makeImg("phones-sony-xperia-pro-i.webp", "Sony Xperia PRO-I 1-inch sensor professional smartphone", "Sony");
    if (fullText.includes("5 v") || fullText.includes("5v")) return makeImg("phones-sony-xperia-5-v.webp", "Sony Xperia 5 V compact premium camera smartphone", "Sony");
    if (fullText.includes("10 vi")) return makeImg("phones-sony-xperia-10-vi.webp", "Sony Xperia 10 VI lightweight 5000mAh 21:9 OLED", "Sony");
    if (fullText.includes("10 v")) return makeImg("phones-sony-xperia-10-v.webp", "Sony Xperia 10 V lightweight 5000mAh smartphone", "Sony");
    if (fullText.includes("1 v") && !fullText.includes("1 vi")) return makeImg("phones-sony-xperia-1-v.webp", "Sony Xperia 1 V Exmor T for mobile 4K 120Hz HDR", "Sony");
    return makeImg("phones-sony-xperia-1-vi.webp", "Sony Xperia 1 VI optical telephoto zoom 4K OLED", "Sony");
  }

  // --- ASUS ---
  if (brandLower.includes("asus") || fullText.includes("rog phone") || fullText.includes("zenfone")) {
    if (fullText.includes("zenfone 10")) return makeImg("phones-asus-zenfone-10.webp", "ASUS Zenfone 10 compact gimbal stabilization smartphone", "ASUS");
    if (fullText.includes("zenfone 11") || fullText.includes("zenfone")) return makeImg("phones-asus-zenfone-11-ultra.webp", "ASUS Zenfone 11 Ultra 144Hz LTPO AMOLED flagship", "ASUS");
    if (fullText.includes("rog phone 7") || fullText.includes("rog 7")) return makeImg("phones-asus-rog-phone-7-ultimate.webp", "ASUS ROG Phone 7 Ultimate AeroActive Portal gaming", "ASUS");
    if (fullText.includes("rog phone 8 pro") || fullText.includes("rog 8 pro")) return makeImg("phones-asus-rog-8-pro.webp", "ASUS ROG Phone 8 Pro AniMe Vision 165Hz gaming powerhouse", "ASUS");
    if (fullText.includes("rog phone 8") || fullText.includes("rog 8")) return makeImg("phones-asus-rog-phone-8.webp", "ASUS ROG Phone 8 Snapdragon 8 Gen 3 gaming phone", "ASUS");
    return makeImg("phones-asus-rog-8-pro.webp", "ASUS ROG Phone 8 Pro", "ASUS");
  }

  // --- VIVO ---
  if (brandLower.includes("vivo")) {
    if (fullText.includes("fold")) return makeImg("phones-vivo-x-fold3-pro.webp", "vivo X Fold3 Pro ultra-light carbon fiber hinge foldable", "vivo");
    if (fullText.includes("x100 pro")) return makeImg("phones-vivo-x100-pro.webp", "vivo X100 Pro ZEISS APO 1-inch sensor camera flagship", "vivo");
    if (fullText.includes("x100")) return makeImg("phones-vivo-x100.webp", "vivo X100 ZEISS optics Dimensity 9300 flagship", "vivo");
    if (fullText.includes("v40 pro")) return makeImg("phones-vivo-v40-pro.webp", "vivo V40 Pro ZEISS portrait camera smartphone", "vivo");
    if (fullText.includes("v40")) return makeImg("phones-vivo-v40.webp", "vivo V40 50MP ZEISS group selfie smartphone", "vivo");
    if (fullText.includes("t3 ultra")) return makeImg("phones-vivo-t3-ultra.webp", "vivo T3 Ultra 3D curved AMOLED smartphone", "vivo");
    if (fullText.includes("t3 pro") || fullText.includes("t3")) return makeImg("phones-vivo-t3-pro.webp", "vivo T3 Pro 5G vegan leather finish smartphone", "vivo");
    if (fullText.includes("y200")) return makeImg("phones-vivo-y200-pro.webp", "vivo Y200 Pro 3D curved display smartphone", "vivo");
    return makeImg("phones-vivo-x100-pro.webp", `${product.name} smartphone`, "vivo");
  }

  // --- REALME ---
  if (brandLower.includes("realme")) {
    if (fullText.includes("gt 6t") || fullText.includes("gt6t")) return makeImg("phones-realme-gt-6t.webp", "realme GT 6T 7+ Gen 3 flagship killer", "realme");
    if (fullText.includes("gt 6") || fullText.includes("gt6")) return makeImg("phones-realme-gt6.webp", "realme GT 6 6000nit ultra-bright display AI flagship", "realme");
    if (fullText.includes("13 pro+") || fullText.includes("13 pro plus")) return makeImg("phones-realme-13-pro-plus.webp", "realme 13 Pro+ Monet inspired periscope camera", "realme");
    if (fullText.includes("13 pro")) return makeImg("phones-realme-13-pro.webp", "realme 13 Pro 50MP Sony LYT-600 OIS camera", "realme");
    if (fullText.includes("12 pro+") || fullText.includes("12 pro plus")) return makeImg("phones-realme-12-pro-plus.webp", "realme 12 Pro+ submarine blue periscope telephoto", "realme");
    if (fullText.includes("12 pro")) return makeImg("phones-realme-12-pro.webp", "realme 12 Pro luxury watch design smartphone", "realme");
    if (fullText.includes("narzo")) return makeImg("phones-realme-narzo-70-pro.webp", "realme Narzo 70 Pro Glass design Horizon camera", "realme");
    if (fullText.includes("p1")) return makeImg("phones-realme-p1-pro.webp", "realme P1 Pro 120Hz curved AMOLED smartphone", "realme");
    return makeImg("phones-realme-gt6.webp", `${product.name} smartphone`, "realme");
  }

  // --- APPLE IPHONE ---
  if (brandLower.includes("apple") || fullText.includes("iphone")) {
    if (fullText.includes("18 pro max")) return makeImg("phones-apple-iphone-18-pro-max.webp", "Apple iPhone 18 Pro Max titanium camera flagship", "Apple");
    if (fullText.includes("18 pro")) return makeImg("phones-apple-iphone-18-pro.webp", "Apple iPhone 18 Pro titanium smartphone", "Apple");
    if (fullText.includes("17 pro max")) return makeImg("phones-apple-iphone-17-pro-max.webp", "Apple iPhone 17 Pro Max silver titanium smartphone", "Apple");
    if (fullText.includes("17 pro")) return makeImg("phones-apple-iphone-17-pro.webp", "Apple iPhone 17 Pro silver titanium smartphone", "Apple");
    if (fullText.includes("17e")) return makeImg("phones-apple-iphone-17e.webp", "Apple iPhone 17e compact smartphone", "Apple");
    if (fullText.includes("iphone 17")) return makeImg("phones-apple-iphone-17.webp", "Apple iPhone 17 smartphone", "Apple");
    if (fullText.includes("iphone air")) return makeImg("phones-apple-iphone-air.webp", "Apple iPhone Air ultra-thin space black smartphone", "Apple");
    if (fullText.includes("16 pro max")) return makeImg("phones-apple-iphone-16-pro-max.webp", "Apple iPhone 16 Pro Max black titanium Camera Control", "Apple");
    if (fullText.includes("16 pro")) return makeImg("phones-apple-iphone-16-pro.webp", "Apple iPhone 16 Pro black titanium Camera Control", "Apple");
    if (fullText.includes("16 plus")) return makeImg("phones-apple-iphone-16-plus.webp", "Apple iPhone 16 Plus vibrant color-infused glass", "Apple");
    if (fullText.includes("16e")) return makeImg("phones-apple-iphone-16e.webp", "Apple iPhone 16e compact black smartphone", "Apple");
    if (fullText.includes("15 pro max")) return makeImg("phones-apple-iphone-15-pro-max.webp", "Apple iPhone 15 Pro Max aerospace-grade titanium 5x telephoto", "Apple");
    if (fullText.includes("15 pro")) return makeImg("phones-apple-iphone-15-pro.webp", "Apple iPhone 15 Pro aerospace-grade titanium A17 Pro", "Apple");
    return makeImg("phones-apple-iphone-15.webp", "Apple iPhone 15 Dynamic Island 48MP main camera", "Apple");
  }

  return makeImg("phones-moto-g54.webp", `${product.name} smartphone`, product.brand);
}
