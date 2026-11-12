import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

export interface BeautyHomeImageTarget {
  slug: string;
  category:
    | "cleansers"
    | "serums"
    | "moisturizers"
    | "sunscreens"
    | "kitchenware"
    | "decor"
    | "home-textiles"
    | "vacuum-cleaners"
    | "air-purifiers";
  brand: string;
  model: string;
  url: string;
  alt: string;
  prefix: "beauty" | "home";
  aliases?: string[];
}

export const BEAUTY_HOME_TARGETS: BeautyHomeImageTarget[] = [
  // =========================================================================
  // 1. MOISTURIZERS & CREAMS
  // =========================================================================
  {
    slug: "la-mer-creme-de-la-mer",
    category: "moisturizers",
    brand: "La Mer",
    model: "Crème de la Mer Moisturizing Cream",
    url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
    alt: "La Mer Crème de la Mer signature porcelain jar luxury moisturizing cream",
    prefix: "beauty",
    aliases: ["creme-de-la-mer", "la-mer-cream"]
  },
  {
    slug: "augustinus-bader-rich-cream",
    category: "moisturizers",
    brand: "Augustinus Bader",
    model: "The Rich Cream (TFC8 Ultimate Nourishment)",
    url: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80",
    alt: "Augustinus Bader The Rich Cream TFC8 iconic blue and bronze cylindrical dispenser",
    prefix: "beauty",
    aliases: ["augustinus-bader-the-rich-cream", "the-rich-cream"]
  },
  {
    slug: "valmont-prime-renewing-pack",
    category: "moisturizers",
    brand: "Valmont",
    model: "Prime Renewing Pack Cellular Mask Cream",
    url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
    alt: "Valmont Prime Renewing Pack Swiss cellular anti-stress radiance jar",
    prefix: "beauty",
    aliases: ["valmont-renewing-pack"]
  },
  {
    slug: "sk-ii-skinpower-cream",
    category: "moisturizers",
    brand: "SK-II",
    model: "Skinpower Advanced Cream",
    url: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80",
    alt: "SK-II Skinpower Advanced Cream signature crimson jar anti-aging moisturizer",
    prefix: "beauty",
    aliases: ["sk-ii-cream", "skinpower-cream"]
  },
  {
    slug: "cle-de-peau-la-creme",
    category: "moisturizers",
    brand: "Clé de Peau Beauté",
    model: "La Crème Multi-Benefit Cream",
    url: "https://images.unsplash.com/photo-1512290900672-1f4f585d58fb?auto=format&fit=crop&w=800&q=80",
    alt: "Clé de Peau Beauté La Crème faceted crystal-jewel jar night cream",
    prefix: "beauty",
    aliases: ["cle-de-peau-la-creme"]
  },
  {
    slug: "sisley-black-rose-cream",
    category: "moisturizers",
    brand: "Sisley Paris",
    model: "Black Rose Skin Infusion Cream",
    url: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=800&q=80",
    alt: "Sisley Paris Black Rose Skin Infusion Cream plumping water-drop texture jar",
    prefix: "beauty",
    aliases: ["sisley-black-rose"]
  },
  {
    slug: "guerlain-orchidee-imperiale",
    category: "moisturizers",
    brand: "Guerlain",
    model: "Orchidée Impériale The Cream",
    url: "https://images.unsplash.com/photo-1567928815104-b7980ee070b6?auto=format&fit=crop&w=800&q=80",
    alt: "Guerlain Orchidée Impériale gold and sapphire jar imperial orchid cream",
    prefix: "beauty",
    aliases: ["orchidee-imperiale"]
  },
  {
    slug: "chanel-sublimage-la-creme",
    category: "moisturizers",
    brand: "Chanel",
    model: "Sublimage La Crème Ultimate Skin Regeneration",
    url: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=800&q=80",
    alt: "Chanel Sublimage La Crème gold glass jar Vanilla Planifolia face cream",
    prefix: "beauty",
    aliases: ["chanel-sublimage", "sublimage-la-creme"]
  },
  {
    slug: "dior-prestige-la-creme",
    category: "moisturizers",
    brand: "Dior",
    model: "Prestige La Crème Haute Réparation",
    url: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&w=800&q=80",
    alt: "Dior Prestige La Crème Haute Réparation Rose de Granville gold-topped jar",
    prefix: "beauty",
    aliases: ["dior-prestige", "prestige-la-creme"]
  },

  // =========================================================================
  // 2. SERUMS
  // =========================================================================
  {
    slug: "la-mer-the-concentrate",
    category: "serums",
    brand: "La Mer",
    model: "The Concentrate Barrier Serum",
    url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80",
    alt: "La Mer The Concentrate emerald flacon with spatula applicator skin barrier serum",
    prefix: "beauty",
    aliases: ["la-mer-concentrate", "the-concentrate"]
  },
  {
    slug: "augustinus-bader-the-serum",
    category: "serums",
    brand: "Augustinus Bader",
    model: "The Serum (TFC8 Cellular Renewal)",
    url: "https://images.unsplash.com/photo-1608248597359-0099042b5ba6?auto=format&fit=crop&w=800&q=80",
    alt: "Augustinus Bader The Serum slender blue copper cylinder cellular revitalizing serum",
    prefix: "beauty",
    aliases: ["augustinus-bader-serum"]
  },
  {
    slug: "sk-ii-facial-treatment-essence",
    category: "serums",
    brand: "SK-II",
    model: "Facial Treatment Essence (Pitera)",
    url: "https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=800&q=80",
    alt: "SK-II Facial Treatment Essence frosted flacon pure Pitera miracle water",
    prefix: "beauty",
    aliases: ["sk-ii-pitera", "facial-treatment-essence"]
  },
  {
    slug: "cle-de-peau-the-serum",
    category: "serums",
    brand: "Clé de Peau Beauté",
    model: "The Serum Le Sérum Awakening",
    url: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&w=800&q=80",
    alt: "Clé de Peau Beauté The Serum prismatic iridescent pump dispenser bottle",
    prefix: "beauty",
    aliases: ["cle-de-peau-serum"]
  },
  {
    slug: "guerlain-abeille-royale-double-r",
    category: "serums",
    brand: "Guerlain",
    model: "Abeille Royale Double R Renew & Repair Serum",
    url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
    alt: "Guerlain Abeille Royale Double R honey-gold dual pump peeling and lifting serum",
    prefix: "beauty",
    aliases: ["abeille-royale-serum"]
  },

  // =========================================================================
  // 3. CLEANSERS
  // =========================================================================
  {
    slug: "augustinus-bader-cleansing-gel",
    category: "cleansers",
    brand: "Augustinus Bader",
    model: "The Cream Cleansing Gel",
    url: "https://images.unsplash.com/photo-1556228722-d0b5de73171c?auto=format&fit=crop&w=800&q=80",
    alt: "Augustinus Bader The Cream Cleansing Gel non-foaming hydrating face wash",
    prefix: "beauty",
    aliases: ["augustinus-bader-cleanser"]
  },
  {
    slug: "la-mer-the-cleansing-foam",
    category: "cleansers",
    brand: "La Mer",
    model: "The Cleansing Foam",
    url: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=800&q=80",
    alt: "La Mer The Cleansing Foam sea algae mineral cleansing tube",
    prefix: "beauty",
    aliases: ["la-mer-cleanser"]
  },
  {
    slug: "sk-ii-facial-treatment-cleanser",
    category: "cleansers",
    brand: "SK-II",
    model: "Facial Treatment Cleanser",
    url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
    alt: "SK-II Facial Treatment Cleanser white tube gentle Pitera foam wash",
    prefix: "beauty",
    aliases: ["sk-ii-cleanser"]
  },
  {
    slug: "cle-de-peau-softening-cleansing-foam",
    category: "cleansers",
    brand: "Clé de Peau Beauté",
    model: "Softening Cleansing Foam",
    url: "https://images.unsplash.com/photo-1556228722-d0b5de73171c?auto=format&fit=crop&w=800&q=80",
    alt: "Clé de Peau Beauté Softening Cleansing Foam rich botanical micro-bubble cleanser",
    prefix: "beauty",
    aliases: ["cle-de-peau-cleanser"]
  },

  // =========================================================================
  // 4. SUNSCREENS
  // =========================================================================
  {
    slug: "chanel-uv-essentiel-spf50",
    category: "sunscreens",
    brand: "Chanel",
    model: "UV Essentiel Multi-Protection Daily Shield SPF 50",
    url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
    alt: "Chanel UV Essentiel SPF 50 elegant white pocket shield sunscreen flacon",
    prefix: "beauty",
    aliases: ["chanel-sunscreen", "uv-essentiel"]
  },
  {
    slug: "cle-de-peau-uv-protective-cream",
    category: "sunscreens",
    brand: "Clé de Peau Beauté",
    model: "UV Protective Cream SPF 50+",
    url: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=800&q=80",
    alt: "Clé de Peau Beauté UV Protective Cream SPF 50+ broad-spectrum cellular defense",
    prefix: "beauty",
    aliases: ["cle-de-peau-sunscreen"]
  },
  {
    slug: "dior-prestige-mineral-uv-protector",
    category: "sunscreens",
    brand: "Dior",
    model: "Dior Prestige Light-in-White The Mineral UV Protector SPF 50+",
    url: "https://images.unsplash.com/photo-1556228722-d0b5de73171c?auto=format&fit=crop&w=800&q=80",
    alt: "Dior Prestige Mineral UV Protector SPF 50+ luxury Rose de Granville protective fluid",
    prefix: "beauty",
    aliases: ["dior-sunscreen"]
  },
  {
    slug: "shiseido-synchroshield-sunscreen",
    category: "sunscreens",
    brand: "Shiseido",
    model: "Ultimate Sun Protector Lotion SPF 50+ SynchroShield",
    url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
    alt: "Shiseido WetForce and HeatForce SynchroShield invisible water-resistant sun lotion",
    prefix: "beauty",
    aliases: ["shiseido-sunscreen"]
  },

  // =========================================================================
  // 5. KITCHENWARE & COOKWARE
  // =========================================================================
  {
    slug: "le-creuset-round-dutch-oven",
    category: "kitchenware",
    brand: "Le Creuset",
    model: "Signature Round Dutch Oven Cocotte",
    url: "https://images.unsplash.com/photo-1584990347449-389f41b2c4e6?auto=format&fit=crop&w=800&q=80",
    alt: "Le Creuset Signature Round Dutch Oven enamelled cast iron cocotte in Volcanic Cerise Red",
    prefix: "home",
    aliases: ["le-creuset-dutch-oven", "le-creuset-cocotte"]
  },
  {
    slug: "staub-round-cocotte",
    category: "kitchenware",
    brand: "Staub",
    model: "Cast Iron Round Cocotte Grenadine",
    url: "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=800&q=80",
    alt: "Staub Cast Iron Round Cocotte majolica enamelled in Grenadine Red with brass knob",
    prefix: "home",
    aliases: ["staub-cocotte"]
  },
  {
    slug: "mauviel-1830-copper-saucepan",
    category: "kitchenware",
    brand: "Mauviel 1830",
    model: "M'Héritage 150B Copper Saucepan with Bronze Handle",
    url: "https://images.unsplash.com/photo-1583778176476-4a8b02a64c01?auto=format&fit=crop&w=800&q=80",
    alt: "Mauviel 1830 handcrafted Normandy extra-thick copper saucepan with cast bronze handle",
    prefix: "home",
    aliases: ["mauviel-saucepan", "mauviel-copper"]
  },
  {
    slug: "smeg-dolce-gabbana-toaster",
    category: "kitchenware",
    brand: "Smeg x Dolce & Gabbana",
    model: "Sicily Is My Love 2-Slice Toaster",
    url: "https://images.unsplash.com/photo-1583778176476-4a8b02a64c01?auto=format&fit=crop&w=800&q=80",
    alt: "Smeg x Dolce & Gabbana Sicily Is My Love decorative hand-painted motif 2-slice toaster",
    prefix: "home",
    aliases: ["smeg-dolce-gabbana", "smeg-toaster"]
  },
  {
    slug: "christofle-mood-cutlery-egg",
    category: "kitchenware",
    brand: "Christofle",
    model: "Mood Silver-Plated 24-Piece Flatware Egg Centerpiece",
    url: "https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?auto=format&fit=crop&w=800&q=80",
    alt: "Christofle Mood mirror-polished silver-plated 24-piece cutlery set housed in iconic steel egg",
    prefix: "home",
    aliases: ["christofle-mood", "christofle-egg"]
  },
  {
    slug: "wusthof-classic-ikon-knives",
    category: "kitchenware",
    brand: "Wüsthof",
    model: "Classic Ikon 7-Piece Knife Block Set",
    url: "https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=800&q=80",
    alt: "Wüsthof Classic Ikon Solingen precision forged German high-carbon steel knives in ash wood block",
    prefix: "home",
    aliases: ["wusthof-knives"]
  },

  // =========================================================================
  // 6. DECOR & LIVING
  // =========================================================================
  {
    slug: "baccarat-eye-vase",
    category: "decor",
    brand: "Baccarat",
    model: "Eye Crystal Oval Vase",
    url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80",
    alt: "Baccarat Eye collection mouth-blown clear crystal oval vase with undulating horizontal cuts",
    prefix: "home",
    aliases: ["baccarat-vase", "eye-vase"]
  },
  {
    slug: "lalique-anemones-vase",
    category: "decor",
    brand: "Lalique",
    model: "Anémones Crystal Sculptural Vase",
    url: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
    alt: "Lalique frosted and polished satin-finish sculptural crystal vase decorated with anemone flowers",
    prefix: "home",
    aliases: ["lalique-vase"]
  },
  {
    slug: "hermes-avalon-blanket",
    category: "decor",
    brand: "Hermès Home",
    model: "Avalon III Cashmere Blanket Throw",
    url: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80",
    alt: "Hermès Avalon III jacquard woven merino wool and cashmere blanket throw with signature H initials",
    prefix: "home",
    aliases: ["hermes-avalon", "avalon-blanket"]
  },
  {
    slug: "fornasetti-tema-e-variazioni-plate",
    category: "decor",
    brand: "Fornasetti",
    model: "Tema e Variazioni Porcelain Wall Plate No. 1",
    url: "https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&w=800&q=80",
    alt: "Fornasetti Milan hand-decorated porcelain plate portraying Lina Cavalieri in black and white",
    prefix: "home",
    aliases: ["fornasetti-plate"]
  },
  {
    slug: "versace-medusa-rhapsody-vase",
    category: "decor",
    brand: "Versace Home",
    model: "Medusa Rhapsody Porcelain Vase",
    url: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
    alt: "Versace Home Rosenthal porcelain baroque floral urn vase with golden Medusa head",
    prefix: "home",
    aliases: ["versace-vase", "medusa-vase"]
  },

  // =========================================================================
  // 7. HOME TEXTILES & BEDDING
  // =========================================================================
  {
    slug: "frette-ultimate-sateen-sheet-set",
    category: "home-textiles",
    brand: "Frette",
    model: "Ultimate Luxury Cotton Sateen Bed Sheet Set",
    url: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
    alt: "Frette Italian-crafted long-staple cotton sateen ultra-soft luxury bed linen sheet set in milk white",
    prefix: "home",
    aliases: ["frette-sheets", "frette-bedding"]
  },
  {
    slug: "sferra-giza-45-sateen-set",
    category: "home-textiles",
    brand: "SFERRA",
    model: "Giza 45 Sateen Luxury Sheet Set",
    url: "https://images.unsplash.com/photo-1540518614846-7ede433c4ef7?auto=format&fit=crop&w=800&q=80",
    alt: "SFERRA rare Egyptian Giza 45 woven Italian heirloom sateen bedsheets with hemstitch detailing",
    prefix: "home",
    aliases: ["sferra-sheets"]
  },
  {
    slug: "pratesi-tre-righe-sheet-set",
    category: "home-textiles",
    brand: "Pratesi",
    model: "Tre Righe Pure Egyptian Cotton Sheet Set",
    url: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80",
    alt: "Pratesi Tre Righe iconic three-line embroidered Italian Angel Skin cotton percale bedding",
    prefix: "home",
    aliases: ["pratesi-sheets"]
  },

  // =========================================================================
  // 8. VACUUM CLEANERS
  // =========================================================================
  {
    slug: "dyson-v15-detect",
    category: "vacuum-cleaners",
    brand: "Dyson",
    model: "V15 Detect Cordless Vacuum Cleaner",
    url: "https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=800&q=80",
    alt: "Dyson V15 Detect laser illuminated cordless stick vacuum cleaner with LCD piezo sensor",
    prefix: "home",
    aliases: ["dyson-v15", "v15-detect"]
  },
  {
    slug: "dyson-gen5detect",
    category: "vacuum-cleaners",
    brand: "Dyson",
    model: "Gen5detect Absolute Cordless Vacuum",
    url: "https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=800&q=80",
    alt: "Dyson Gen5detect Absolute high-efficiency HEPA filtration cordless stick vacuum cleaner",
    prefix: "home",
    aliases: ["gen5detect", "dyson-gen5"]
  },
  {
    slug: "roborock-s8-pro-ultra",
    category: "vacuum-cleaners",
    brand: "Roborock",
    model: "S8 Pro Ultra Robot Vacuum and Mop",
    url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    alt: "Roborock S8 Pro Ultra robot vacuum and sonic mop with RockDock self-washing base station",
    prefix: "home",
    aliases: ["roborock-s8", "s8-pro-ultra"]
  },
  {
    slug: "ecovacs-deebot-x2-omni",
    category: "vacuum-cleaners",
    brand: "Ecovacs",
    model: "Deebot X2 Omni Square Robot Vacuum",
    url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    alt: "Ecovacs Deebot X2 Omni square form-factor robot vacuum and mop with dual rotating pads",
    prefix: "home",
    aliases: ["deebot-x2", "ecovacs-deebot"]
  },
  {
    slug: "miele-triflex-hx2-pro",
    category: "vacuum-cleaners",
    brand: "Miele",
    model: "Triflex HX2 Pro Cordless Stick Vacuum",
    url: "https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=800&q=80",
    alt: "Miele Triflex HX2 Pro 3-in-1 modular cordless stick vacuum cleaner with dual Varta batteries",
    prefix: "home",
    aliases: ["miele-triflex"]
  },

  // =========================================================================
  // 9. AIR PURIFIERS
  // =========================================================================
  {
    slug: "dyson-purifier-big-quiet",
    category: "air-purifiers",
    brand: "Dyson",
    model: "Purifier Big+Quiet Formaldehyde BP03",
    url: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80",
    alt: "Dyson Purifier Big+Quiet Formaldehyde large room acoustic cone projection air purifier",
    prefix: "home",
    aliases: ["dyson-big-quiet", "purifier-big-quiet"]
  },
  {
    slug: "dyson-purifier-hot-cool",
    category: "air-purifiers",
    brand: "Dyson",
    model: "Purifier Hot+Cool Formaldehyde HP09",
    url: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80",
    alt: "Dyson Purifier Hot+Cool Formaldehyde HP09 heating and purifying bladeless fan tower",
    prefix: "home",
    aliases: ["dyson-hp09", "purifier-hot-cool"]
  },
  {
    slug: "blueair-protect-7770i",
    category: "air-purifiers",
    brand: "Blueair",
    model: "Protect 7770i Smart Air Purifier",
    url: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80",
    alt: "Blueair Protect 7770i HEPASilent Ultra medical-grade smart air purifier tower",
    prefix: "home",
    aliases: ["blueair-protect"]
  },
  {
    slug: "iqair-healthpro-plus",
    category: "air-purifiers",
    brand: "IQAir",
    model: "HealthPro Plus HyperHEPA Air Purifier",
    url: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80",
    alt: "IQAir HealthPro Plus Swiss medical HyperHEPA modular filtration air cleaner",
    prefix: "home",
    aliases: ["iqair-healthpro"]
  }
];

export async function downloadBeautyHomeImages(): Promise<void> {
  const targetDir = path.resolve(process.cwd(), "public/images/products");
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  console.log(`Starting download and WebP optimization for ${BEAUTY_HOME_TARGETS.length} luxury beauty & home assets...`);
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of BEAUTY_HOME_TARGETS) {
    const filename = `${item.prefix}-${item.slug}.webp`;
    const dest = path.join(targetDir, filename);

    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      console.log(`[EXISTS] ${filename} (${(fs.statSync(dest).size / 1024).toFixed(1)} KB)`);
      skipped++;
      continue;
    }

    try {
      const res = await fetch(item.url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 500) {
        throw new Error("Payload too small");
      }

      // Convert to 600x600 WebP on clean studio canvas #fbfbfb
      const webp = await sharp(buf)
        .resize(600, 600, {
          fit: "contain",
          background: { r: 251, g: 251, b: 251, alpha: 1 },
        })
        .webp({ quality: 82, effort: 6 })
        .toBuffer();

      fs.writeFileSync(dest, webp);
      console.log(`[SAVED] ${filename.padEnd(46)} -> ${(webp.length / 1024).toFixed(1)} KB`);
      downloaded++;
    } catch (err: any) {
      console.error(`[FAILED] ${filename}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nBeauty & Home summary: ${downloaded} downloaded, ${skipped} skipped, ${failed} failed.`);
}

if (process.argv[1]?.includes("fetch-beauty-home-images")) {
  downloadBeautyHomeImages().catch(console.error);
}
