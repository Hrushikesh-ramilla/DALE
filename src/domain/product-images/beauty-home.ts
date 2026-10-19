import { ProductQuery, ProductImageResolution, makeImg } from "./types";

export function resolveBeautyHomeImage(product: ProductQuery): ProductImageResolution | null {
  const nameLower = (product.name || "").toLowerCase();
  const brandLower = (product.brand || "").toLowerCase();
  const modelLower = (
    product.modelName ||
    (product.attributes?.modelName as string) ||
    ""
  ).toLowerCase();
  const fullText = `${nameLower} ${brandLower} ${modelLower}`;
  const leaf = (product.leafType || product.category || "").toLowerCase();

  const beautyHomeLeaves = [
    "cleansers",
    "serums",
    "moisturizers",
    "sunscreens",
    "kitchenware",
    "decor",
    "home-textiles",
    "vacuum-cleaners",
    "air-purifiers"
  ];

  const isBeautyHomeLeaf = beautyHomeLeaves.includes(leaf);
  const isBeautyHomeCategory =
    leaf === "beauty" ||
    leaf === "home" ||
    leaf === "appliances" ||
    (product.category || "").toLowerCase() === "beauty" ||
    (product.category || "").toLowerCase() === "home" ||
    (product.category || "").toLowerCase() === "appliances";

  const isBeautyHomeText =
    fullText.includes("cream") ||
    fullText.includes("serum") ||
    fullText.includes("cleanser") ||
    fullText.includes("sunscreen") ||
    fullText.includes("spf") ||
    fullText.includes("dutch oven") ||
    fullText.includes("cocotte") ||
    fullText.includes("saucepan") ||
    fullText.includes("toaster") ||
    fullText.includes("cutlery") ||
    fullText.includes("knife") ||
    fullText.includes("vase") ||
    fullText.includes("blanket") ||
    fullText.includes("plate") ||
    fullText.includes("sheet") ||
    fullText.includes("duvet") ||
    fullText.includes("vacuum") ||
    fullText.includes("purifier");

  if (!isBeautyHomeLeaf && !isBeautyHomeCategory && !isBeautyHomeText) {
    return null;
  }

  // =========================================================================
  // 1. MOISTURIZERS & FACIAL CREAMS
  // =========================================================================
  if (
    leaf === "moisturizers" ||
    fullText.includes("moisturizer") ||
    (fullText.includes("cream") && !fullText.includes("cleansing") && !fullText.includes("cleanser"))
  ) {
    if (brandLower.includes("chanel") || fullText.includes("sublimage") || fullText.includes("hydra beauty") || fullText.includes("le lift")) {
      if (fullText.includes("camellia") || (fullText.includes("hydra") && !fullText.includes("nutrition") && !fullText.includes("protection"))) {
        return makeImg("beauty-chanel-hydra-beauty.webp", "Chanel Hydra Beauty Camellia Water Cream hydration jar", "Chanel");
      }
      if (fullText.includes("le lift") || fullText.includes("protection")) {
        return makeImg("beauty-chanel-le-lift.webp", "Chanel Le Lift Crème Smooths-Firms anti-aging jar", "Chanel");
      }
      return makeImg("beauty-chanel-sublimage-la-creme.webp", "Chanel Sublimage La Crème Ultimate Skin Regeneration gold jar", "Chanel");
    }
    if (brandLower.includes("dior") || fullText.includes("prestige")) {
      return makeImg("beauty-dior-prestige-la-creme.webp", "Dior Prestige La Crème Haute Réparation", "Dior");
    }
    if (brandLower.includes("lancôme") || brandLower.includes("lancome") || fullText.includes("absolue")) {
      return makeImg("beauty-lancome-absolue-soft-cream.webp", "Lancôme Absolue Soft Cream Regenerating Brightening", "Lancôme");
    }
    if (brandLower.includes("la mer") || fullText.includes("crème de la mer") || fullText.includes("creme de la mer")) {
      return makeImg("beauty-la-mer-creme-de-la-mer.webp", "La Mer Crème de la Mer Moisturizing Cream", "La Mer");
    }
    if (brandLower.includes("augustinus bader") || fullText.includes("tfc8")) {
      return makeImg("beauty-augustinus-bader-rich-cream.webp", "Augustinus Bader The Rich Cream (TFC8)", "Augustinus Bader");
    }
    if (brandLower.includes("sk-ii") || fullText.includes("skinpower")) {
      return makeImg("beauty-sk-ii-skinpower-cream.webp", "SK-II Skinpower Advanced Cream", "SK-II");
    }
    if (brandLower.includes("shiseido") || fullText.includes("future solution")) {
      return makeImg("beauty-shiseido-future-solution-cream.webp", "Shiseido Future Solution LX Cream", "Shiseido");
    }
    if (brandLower.includes("clé de peau") || brandLower.includes("cle de peau") || fullText.includes("la crème") || fullText.includes("la creme")) {
      return makeImg("beauty-cle-de-peau-la-creme.webp", "Clé de Peau Beauté La Crème Multi-Benefit Cream", "Clé de Peau Beauté");
    }
    if (brandLower.includes("la prairie") || fullText.includes("skin caviar")) {
      return makeImg("beauty-la-prairie-skin-caviar.webp", "La Prairie Skin Caviar Luxe Cream", "La Prairie");
    }
    if (brandLower.includes("armani") || fullText.includes("crema nera")) {
      return makeImg("beauty-armani-crema-nera.webp", "Giorgio Armani Crema Nera Supreme Reviving Cream", "Giorgio Armani");
    }
    if (brandLower.includes("guerlain") || fullText.includes("orchidée") || fullText.includes("orchidee")) {
      return makeImg("beauty-guerlain-orchidee-imperiale.webp", "Guerlain Orchidée Impériale The Cream", "Guerlain");
    }
    if (brandLower.includes("sisley") || fullText.includes("black rose") || fullText.includes("sisleÿa") || fullText.includes("sisleya")) {
      return makeImg("beauty-sisley-black-rose-cream.webp", "Sisley Paris Black Rose Skin Infusion Cream", "Sisley Paris");
    }
    if (brandLower.includes("valmont") || fullText.includes("renewing pack")) {
      return makeImg("beauty-valmont-prime-renewing-pack.webp", "Valmont Prime Renewing Pack Cellular Mask Cream", "Valmont");
    }
    return makeImg("beauty-la-mer-creme-de-la-mer.webp", `${product.name} luxury moisturizer`, product.brand);
  }

  // =========================================================================
  // 2. SERUMS & ESSENCES
  // =========================================================================
  if (
    leaf === "serums" ||
    fullText.includes("serum") ||
    fullText.includes("essence") ||
    fullText.includes("concentrate")
  ) {
    if (brandLower.includes("la mer") || fullText.includes("the concentrate")) {
      return makeImg("beauty-la-mer-the-concentrate.webp", "La Mer The Concentrate Barrier Serum", "La Mer");
    }
    if (brandLower.includes("augustinus bader") || fullText.includes("the serum")) {
      return makeImg("beauty-augustinus-bader-the-serum.webp", "Augustinus Bader The Serum", "Augustinus Bader");
    }
    if (brandLower.includes("sk-ii") || fullText.includes("treatment essence") || fullText.includes("pitera")) {
      return makeImg("beauty-sk-ii-facial-treatment-essence.webp", "SK-II Facial Treatment Essence (Pitera)", "SK-II");
    }
    if (brandLower.includes("clé de peau") || brandLower.includes("cle de peau") || fullText.includes("the serum")) {
      return makeImg("beauty-cle-de-peau-the-serum.webp", "Clé de Peau Beauté The Serum Le Sérum Awakening", "Clé de Peau Beauté");
    }
    if (brandLower.includes("guerlain") || fullText.includes("abeille royale") || fullText.includes("double r")) {
      return makeImg("beauty-guerlain-abeille-royale-double-r.webp", "Guerlain Abeille Royale Double R Renew & Repair Serum", "Guerlain");
    }
    return makeImg("beauty-la-mer-the-concentrate.webp", `${product.name} luxury cellular serum`, product.brand);
  }

  // =========================================================================
  // 3. CLEANSERS
  // =========================================================================
  if (
    leaf === "cleansers" ||
    fullText.includes("cleanser") ||
    fullText.includes("cleansing") ||
    fullText.includes("foam wash")
  ) {
    if (brandLower.includes("augustinus bader")) {
      return makeImg("beauty-augustinus-bader-cleansing-gel.webp", "Augustinus Bader The Cream Cleansing Gel", "Augustinus Bader");
    }
    if (brandLower.includes("la mer")) {
      return makeImg("beauty-la-mer-the-cleansing-foam.webp", "La Mer The Cleansing Foam", "La Mer");
    }
    if (brandLower.includes("sk-ii")) {
      return makeImg("beauty-sk-ii-facial-treatment-cleanser.webp", "SK-II Facial Treatment Cleanser", "SK-II");
    }
    if (brandLower.includes("clé de peau") || brandLower.includes("cle de peau")) {
      return makeImg("beauty-cle-de-peau-cleansing-foam.webp", "Clé de Peau Beauté Softening Cleansing Foam", "Clé de Peau Beauté");
    }
    return makeImg("beauty-la-mer-the-cleansing-foam.webp", `${product.name} luxury facial cleanser`, product.brand);
  }

  // =========================================================================
  // 4. SUNSCREENS
  // =========================================================================
  if (
    leaf === "sunscreens" ||
    fullText.includes("sunscreen") ||
    fullText.includes("spf") ||
    fullText.includes("uv shield")
  ) {
    if (brandLower.includes("chanel") || fullText.includes("uv essentiel")) {
      return makeImg("beauty-chanel-uv-essentiel-spf50.webp", "Chanel UV Essentiel Multi-Protection SPF 50", "Chanel");
    }
    if (brandLower.includes("clé de peau") || brandLower.includes("cle de peau")) {
      return makeImg("beauty-cle-de-peau-uv-protective-cream.webp", "Clé de Peau Beauté UV Protective Cream SPF 50+", "Clé de Peau Beauté");
    }
    if (brandLower.includes("dior") || fullText.includes("prestige")) {
      return makeImg("beauty-dior-prestige-mineral-uv-protector.webp", "Dior Prestige Light-in-White Mineral UV Protector SPF 50+", "Dior");
    }
    if (brandLower.includes("shiseido") || fullText.includes("synchroshield")) {
      return makeImg("beauty-shiseido-synchroshield-sunscreen.webp", "Shiseido Ultimate Sun Protector SPF 50+ SynchroShield", "Shiseido");
    }
    return makeImg("beauty-chanel-uv-essentiel-spf50.webp", `${product.name} luxury broad-spectrum UV protection`, product.brand);
  }

  // =========================================================================
  // 5. KITCHENWARE & COOKWARE
  // =========================================================================
  if (
    leaf === "kitchenware" ||
    fullText.includes("dutch oven") ||
    fullText.includes("cocotte") ||
    fullText.includes("saucepan") ||
    fullText.includes("cookware") ||
    fullText.includes("cutlery") ||
    fullText.includes("knife")
  ) {
    if (brandLower.includes("le creuset") || fullText.includes("le creuset")) {
      return makeImg("home-le-creuset-round-dutch-oven.webp", "Le Creuset Signature Round Dutch Oven Cocotte", "Le Creuset");
    }
    if (brandLower.includes("staub") || fullText.includes("staub")) {
      return makeImg("home-staub-round-cocotte.webp", "Staub Cast Iron Round Cocotte Grenadine", "Staub");
    }
    if (brandLower.includes("mauviel") || fullText.includes("mauviel")) {
      return makeImg("home-mauviel-1830-copper-saucepan.webp", "Mauviel 1830 M'Héritage 150B Copper Saucepan", "Mauviel 1830");
    }
    if (brandLower.includes("smeg") || fullText.includes("smeg") || fullText.includes("toaster")) {
      return makeImg("home-smeg-dolce-gabbana-toaster.webp", "Smeg x Dolce & Gabbana Sicily Is My Love 2-Slice Toaster", "Smeg");
    }
    if (brandLower.includes("christofle") || fullText.includes("mood") || fullText.includes("egg")) {
      return makeImg("home-christofle-mood-cutlery-egg.webp", "Christofle Mood 24-Piece Flatware Egg Centerpiece", "Christofle");
    }
    if (brandLower.includes("wüsthof") || brandLower.includes("wusthof") || fullText.includes("knife")) {
      return makeImg("home-wusthof-classic-ikon-knives.webp", "Wüsthof Classic Ikon 7-Piece Knife Block Set", "Wüsthof");
    }
    return makeImg("home-le-creuset-round-dutch-oven.webp", `${product.name} luxury gourmet cookware`, product.brand);
  }

  // =========================================================================
  // 6. DECOR & LIVING
  // =========================================================================
  if (
    leaf === "decor" ||
    fullText.includes("vase") ||
    fullText.includes("blanket") ||
    fullText.includes("throw") ||
    fullText.includes("plate")
  ) {
    if (brandLower.includes("baccarat") || fullText.includes("baccarat")) {
      return makeImg("home-baccarat-eye-vase.webp", "Baccarat Eye Crystal Oval Vase", "Baccarat");
    }
    if (brandLower.includes("lalique") || fullText.includes("lalique")) {
      return makeImg("home-lalique-anemones-vase.webp", "Lalique Anémones Crystal Sculptural Vase", "Lalique");
    }
    if (brandLower.includes("hermès") || brandLower.includes("hermes") || fullText.includes("avalon")) {
      return makeImg("home-hermes-avalon-blanket.webp", "Hermès Avalon III Cashmere Blanket Throw", "Hermès Home");
    }
    if (brandLower.includes("fornasetti") || fullText.includes("fornasetti")) {
      return makeImg("home-fornasetti-tema-e-variazioni-plate.webp", "Fornasetti Tema e Variazioni Porcelain Wall Plate No. 1", "Fornasetti");
    }
    if (brandLower.includes("versace") || fullText.includes("medusa rhapsody")) {
      return makeImg("home-versace-medusa-rhapsody-vase.webp", "Versace Home Medusa Rhapsody Porcelain Vase", "Versace Home");
    }
    return makeImg("home-baccarat-eye-vase.webp", `${product.name} luxury home decor`, product.brand);
  }

  // =========================================================================
  // 7. HOME TEXTILES & BEDDING
  // =========================================================================
  if (
    leaf === "home-textiles" ||
    fullText.includes("sheet") ||
    fullText.includes("duvet") ||
    fullText.includes("bedding") ||
    fullText.includes("percale") ||
    fullText.includes("sateen")
  ) {
    if (brandLower.includes("frette") || fullText.includes("frette")) {
      return makeImg("home-frette-ultimate-sateen-sheet-set.webp", "Frette Ultimate Luxury Cotton Sateen Bed Sheet Set", "Frette");
    }
    if (brandLower.includes("sferra") || fullText.includes("sferra") || fullText.includes("giza 45")) {
      return makeImg("home-sferra-giza-45-sateen-set.webp", "SFERRA Giza 45 Sateen Luxury Sheet Set", "SFERRA");
    }
    if (brandLower.includes("pratesi") || fullText.includes("pratesi")) {
      return makeImg("home-pratesi-tre-righe-sheet-set.webp", "Pratesi Tre Righe Pure Egyptian Cotton Sheet Set", "Pratesi");
    }
    return makeImg("home-frette-ultimate-sateen-sheet-set.webp", `${product.name} luxury Italian bed linen`, product.brand);
  }

  // =========================================================================
  // 8. VACUUM CLEANERS
  // =========================================================================
  if (
    leaf === "vacuum-cleaners" ||
    fullText.includes("vacuum") ||
    fullText.includes("cordless stick") ||
    fullText.includes("robot vacuum")
  ) {
    if (brandLower.includes("dyson") || fullText.includes("dyson")) {
      if (fullText.includes("gen5") || fullText.includes("gen5detect")) {
        return makeImg("home-dyson-gen5detect.webp", "Dyson Gen5detect Absolute Cordless Vacuum", "Dyson");
      }
      return makeImg("home-dyson-v15-detect.webp", "Dyson V15 Detect Cordless Vacuum Cleaner", "Dyson");
    }
    if (brandLower.includes("roborock") || fullText.includes("roborock")) {
      return makeImg("home-roborock-s8-pro-ultra.webp", "Roborock S8 Pro Ultra Robot Vacuum and Mop", "Roborock");
    }
    if (brandLower.includes("ecovacs") || fullText.includes("deebot")) {
      return makeImg("home-ecovacs-deebot-x2-omni.webp", "Ecovacs Deebot X2 Omni Square Robot Vacuum", "Ecovacs");
    }
    if (brandLower.includes("miele") || fullText.includes("triflex")) {
      return makeImg("home-miele-triflex-hx2-pro.webp", "Miele Triflex HX2 Pro Cordless Stick Vacuum", "Miele");
    }
    return makeImg("home-dyson-v15-detect.webp", `${product.name} premium cordless cleaning system`, product.brand);
  }

  // =========================================================================
  // 9. AIR PURIFIERS
  // =========================================================================
  if (
    leaf === "air-purifiers" ||
    fullText.includes("air purifier") ||
    fullText.includes("purifier")
  ) {
    if (brandLower.includes("dyson") || fullText.includes("dyson")) {
      if (fullText.includes("hot+cool") || fullText.includes("hp09")) {
        return makeImg("home-dyson-purifier-hot-cool.webp", "Dyson Purifier Hot+Cool Formaldehyde HP09", "Dyson");
      }
      return makeImg("home-dyson-purifier-big-quiet.webp", "Dyson Purifier Big+Quiet Formaldehyde BP03", "Dyson");
    }
    if (brandLower.includes("blueair") || fullText.includes("blueair")) {
      return makeImg("home-blueair-protect-7770i.webp", "Blueair Protect 7770i Smart Air Purifier", "Blueair");
    }
    if (brandLower.includes("iqair") || fullText.includes("iqair")) {
      return makeImg("home-iqair-healthpro-plus.webp", "IQAir HealthPro Plus HyperHEPA Air Purifier", "IQAir");
    }
    return makeImg("home-dyson-purifier-big-quiet.webp", `${product.name} medical-grade air purification system`, product.brand);
  }

  return null;
}
