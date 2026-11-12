import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

export interface FootwearImageTarget {
  slug: string;
  category: "loafers" | "formal-shoes" | "boots" | "lifestyle-sneakers" | "running-shoes";
  brand: string;
  model: string;
  url: string;
  alt: string;
  aliases?: string[];
}

export const FOOTWEAR_TARGETS: FootwearImageTarget[] = [
  // =========================================================================
  // 1. LOAFERS
  // =========================================================================
  {
    slug: "loro-piana-summer-walk",
    category: "loafers",
    brand: "Loro Piana",
    model: "Summer Walk",
    url: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=800&q=80",
    alt: "Loro Piana Summer Walk water-repellent suede moccasin with white rubber sole"
  },
  {
    slug: "loro-piana-open-walk",
    category: "loafers",
    brand: "Loro Piana",
    model: "Open Walk",
    url: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=800&q=80",
    alt: "Loro Piana Open Walk suede ankle moccasin with concealed elastic insert"
  },
  {
    slug: "gucci-1953-horsebit",
    category: "loafers",
    brand: "Gucci",
    model: "1953 Horsebit Leather Loafer",
    url: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80",
    alt: "Gucci 1953 Horsebit black leather loafer with gold-toned horsebit hardware",
    aliases: ["gucci-horsebit-loafer"]
  },
  {
    slug: "berluti-lorenzo-loafer",
    category: "loafers",
    brand: "Berluti",
    model: "Lorenzo Rimini Loafer",
    url: "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=800&q=80",
    alt: "Berluti Lorenzo Rimini unlined patinated Venezia leather loafer"
  },
  {
    slug: "berluti-alessandro",
    category: "loafers",
    brand: "Berluti",
    model: "Alessandro Demesure",
    url: "https://images.unsplash.com/photo-1531310197839-ccf54634509e?auto=format&fit=crop&w=800&q=80",
    alt: "Berluti Alessandro wholecut Venezia calfskin Oxford dress shoe"
  },
  {
    slug: "ferragamo-gancini-loafer",
    category: "loafers",
    brand: "Ferragamo",
    model: "Gancini Reversible Loafer",
    url: "https://images.unsplash.com/photo-1582845512747-e42001c95638?auto=format&fit=crop&w=800&q=80",
    alt: "Ferragamo Gancini reversible bit calfskin leather slip-on loafer"
  },
  {
    slug: "tods-gommino",
    category: "loafers",
    brand: "Tod's",
    model: "Gommino Driving Shoe",
    url: "https://upload.wikimedia.org/wikipedia/commons/9/90/A_brown_Loafer_Shoes_from_TODS.jpg",
    alt: "Tod's Gommino suede driving shoe with iconic 133 rubber pebble sole"
  },
  {
    slug: "louboutin-dandelion",
    category: "loafers",
    brand: "Christian Louboutin",
    model: "Dandelion Spikes / Red Sole Loafer",
    url: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80",
    alt: "Christian Louboutin Dandelion velvet loafer with signature red-lacquered sole",
    aliases: ["louboutin-red-sole"]
  },
  {
    slug: "hermes-paris-loafer",
    category: "loafers",
    brand: "Hermès",
    model: "Paris Loafer",
    url: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=800&q=80",
    alt: "Hermès Paris goatskin loafer with signature palladium-plated H clasp"
  },
  {
    slug: "santoni-double-monk",
    category: "loafers",
    brand: "Santoni",
    model: "Double Buckle Loafer / Monk",
    url: "https://upload.wikimedia.org/wikipedia/commons/6/68/Pair_of_full_brogue_shoes_by_Santoni.jpg",
    alt: "Santoni handcrafted patinated leather monk strap loafer"
  },
  {
    slug: "brunello-cucinelli-suede",
    category: "loafers",
    brand: "Brunello Cucinelli",
    model: "Suede Penny Loafer",
    url: "https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=800&q=80",
    alt: "Brunello Cucinelli soft suede penny loafer with contrast lightweight welt"
  },
  {
    slug: "churchs-pembrey",
    category: "loafers",
    brand: "Church's",
    model: "Pembrey Loafer",
    url: "https://upload.wikimedia.org/wikipedia/commons/6/61/A_Penny_Loafer.jpg",
    alt: "Church's Pembrey Goodyear-welted leather penny loafer"
  },
  {
    slug: "prada-chocolate-loafer",
    category: "loafers",
    brand: "Prada",
    model: "Chocolate Brushed Leather Loafer",
    url: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80",
    alt: "Prada Chocolate brushed Spazzolato leather penny loafer with enamelled triangle logo"
  },

  // =========================================================================
  // 2. FORMAL SHOES
  // =========================================================================
  {
    slug: "louboutin-greggo",
    category: "formal-shoes",
    brand: "Christian Louboutin",
    model: "Greggo Oxford",
    url: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80",
    alt: "Christian Louboutin Greggo Oxford dress shoe with signature red-lacquered sole"
  },
  {
    slug: "john-lobb-city-ii",
    category: "formal-shoes",
    brand: "John Lobb",
    model: "City II Cap-Toe Oxford",
    url: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=800&q=80",
    alt: "John Lobb City II iconic 7000 last cap-toe Oxford in black calfskin",
    aliases: ["signature-oxford"]
  },
  {
    slug: "berluti-scritto-wholecut",
    category: "formal-shoes",
    brand: "Berluti",
    model: "Scritto Leather Wholecut",
    url: "https://upload.wikimedia.org/wikipedia/commons/0/04/Leather_soled_shoes_-_Made-to-order_shoes_%28patina%29.png",
    alt: "Berluti Scritto calligraphy engraved Venezia leather wholecut Oxford"
  },
  {
    slug: "churchs-consul",
    category: "formal-shoes",
    brand: "Church's",
    model: "Consul 173 Oxford",
    url: "https://upload.wikimedia.org/wikipedia/commons/e/ed/Parts_of_a_shoe_-_Oxford_brogue_with_toe_cap.jpg",
    alt: "Church's Consul 173 classic English cap-toe Oxford shoe"
  },
  {
    slug: "tom-ford-edgar",
    category: "formal-shoes",
    brand: "Tom Ford",
    model: "Edgar Cap-Toe Dress Shoe",
    url: "https://upload.wikimedia.org/wikipedia/commons/f/f5/Oxfords.jpg",
    alt: "Tom Ford Edgar cap-toe Oxford dress shoe in burnished Italian calf leather"
  },
  {
    slug: "prada-spazzolato-derby",
    category: "formal-shoes",
    brand: "Prada",
    model: "Brushed Spazzolato Derby",
    url: "https://upload.wikimedia.org/wikipedia/commons/0/0c/Derby_shoe1.jpg",
    alt: "Prada brushed Spazzolato leather formal Derby shoe"
  },
  {
    slug: "ferragamo-tramezza",
    category: "formal-shoes",
    brand: "Ferragamo",
    model: "Tramezza Cap-Toe Oxford",
    url: "https://upload.wikimedia.org/wikipedia/commons/0/04/Leather_soled_shoes_-_Made-to-order_shoes_%28patina%29.png",
    alt: "Ferragamo Tramezza artisanal Goodyear-welted cap-toe Oxford"
  },
  {
    slug: "dior-men-carlo",
    category: "formal-shoes",
    brand: "Dior Men",
    model: "Dior Carlo Oxford",
    url: "https://upload.wikimedia.org/wikipedia/commons/f/f5/Oxfords.jpg",
    alt: "Dior Men Carlo polished black calfskin dress shoe with bevelled heel"
  },
  {
    slug: "churchs-shannon",
    category: "formal-shoes",
    brand: "Church's",
    model: "Shannon Derby",
    url: "https://upload.wikimedia.org/wikipedia/commons/0/0c/Derby_shoe1.jpg",
    alt: "Church's Shannon wholecut storm-welted Derby shoe in polished binder leather"
  },

  // =========================================================================
  // 3. BOOTS
  // =========================================================================
  {
    slug: "bottega-veneta-tire-boot",
    category: "boots",
    brand: "Bottega Veneta",
    model: "Tire Boot",
    url: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=800&q=80",
    alt: "Bottega Veneta Tire wavy lug sole leather combat Chelsea boot"
  },
  {
    slug: "bottega-veneta-lug-boot",
    category: "boots",
    brand: "Bottega Veneta",
    model: "Lug Chelsea Boot",
    url: "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&w=800&q=80",
    alt: "Bottega Veneta Lug Chelsea boot in vegetable-tanned calfskin leather"
  },
  {
    slug: "rm-williams-craftsman",
    category: "boots",
    brand: "R.M. Williams",
    model: "Comfort Craftsman Chelsea Boot",
    url: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Chelsea_boot%2C_black.jpg",
    alt: "R.M. Williams Comfort Craftsman one-piece yearling leather Chelsea boot"
  },
  {
    slug: "saint-laurent-wyatt-harness",
    category: "boots",
    brand: "Saint Laurent",
    model: "Wyatt 40 Harness Boot",
    url: "https://upload.wikimedia.org/wikipedia/commons/4/4b/Beatle_boots-125090930.jpg",
    alt: "Saint Laurent Wyatt 40 harness boot with Cuban heel in oiled suede"
  },
  {
    slug: "saint-laurent-wyatt-chelsea",
    category: "boots",
    brand: "Saint Laurent",
    model: "Wyatt Chelsea 30 Boot",
    url: "https://upload.wikimedia.org/wikipedia/commons/1/19/Chelsea_boot%2C_brown_suede.jpg",
    alt: "Saint Laurent Wyatt Chelsea 30 pointed toe boot in velvety suede"
  },
  {
    slug: "berluti-brunico-boot",
    category: "boots",
    brand: "Berluti",
    model: "Brunico Leather Ankle Boot",
    url: "https://upload.wikimedia.org/wikipedia/commons/0/0a/VeggieChelseaBoots.jpg",
    alt: "Berluti Brunico Venezia leather lace-up hiking and ankle boot"
  },
  {
    slug: "prada-monolith-boot",
    category: "boots",
    brand: "Prada",
    model: "Monolith Brushed Leather Combat Boot",
    url: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=800&q=80",
    alt: "Prada Monolith brushed leather and nylon combat boot with oversized lug sole"
  },
  {
    slug: "louboutin-roadie-boot",
    category: "boots",
    brand: "Christian Louboutin",
    model: "Roadie Flat Chelsea Boot",
    url: "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&w=800&q=80",
    alt: "Christian Louboutin Roadie flat Chelsea boot with signature red-lacquered sole"
  },
  {
    slug: "john-lobb-lawry-boot",
    category: "boots",
    brand: "John Lobb",
    model: "Lawry Chelsea Boot",
    url: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Chelsea_boot%2C_black.jpg",
    alt: "John Lobb Lawry museum calf Goodyear-welted Chelsea boot"
  },
  {
    slug: "tods-winter-gommino-boot",
    category: "boots",
    brand: "Tod's",
    model: "Winter Gommino Boot",
    url: "https://upload.wikimedia.org/wikipedia/commons/1/19/Chelsea_boot%2C_brown_suede.jpg",
    alt: "Tod's Winter Gommino ankle boot in water-resistant suede with shearling lining"
  },

  // =========================================================================
  // 4. LIFESTYLE SNEAKERS
  // =========================================================================
  {
    slug: "lv-trainer",
    category: "lifestyle-sneakers",
    brand: "Louis Vuitton",
    model: "LV Trainer Sneaker",
    url: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80",
    alt: "Louis Vuitton LV Trainer sneaker designed by Virgil Abloh in calf leather"
  },
  {
    slug: "alexander-mcqueen-oversized",
    category: "lifestyle-sneakers",
    brand: "Alexander McQueen",
    model: "Oversized Sneaker (white/black tab)",
    url: "https://images.unsplash.com/photo-1549298916-f52d724204b4?auto=format&fit=crop&w=800&q=80",
    alt: "Alexander McQueen Oversized sneaker in smooth white calfskin with black heel counter"
  },
  {
    slug: "balenciaga-triple-s",
    category: "lifestyle-sneakers",
    brand: "Balenciaga",
    model: "Triple S Sneaker",
    url: "https://upload.wikimedia.org/wikipedia/commons/c/cf/Balenciaga-Triple_S.jpg",
    alt: "Balenciaga Triple S oversized clear sole chunky designer sneaker"
  },
  {
    slug: "balenciaga-track",
    category: "lifestyle-sneakers",
    brand: "Balenciaga",
    model: "Track Sneaker",
    url: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80",
    alt: "Balenciaga Track multi-panel layered technical cage sneaker"
  },
  {
    slug: "balenciaga-3xl",
    category: "lifestyle-sneakers",
    brand: "Balenciaga",
    model: "3XL Sneaker",
    url: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80",
    alt: "Balenciaga 3XL worn-out effect technical runner sneaker"
  },
  {
    slug: "dior-b22",
    category: "lifestyle-sneakers",
    brand: "Dior",
    model: "B22 Sneaker",
    url: "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=800&q=80",
    alt: "Dior B22 chunky athletic sneaker with reflective piping and technical mesh"
  },
  {
    slug: "dior-b30",
    category: "lifestyle-sneakers",
    brand: "Dior",
    model: "B30 Sneaker",
    url: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?auto=format&fit=crop&w=800&q=80",
    alt: "Dior B30 technical fabric running sneaker with CD Diamond emblem"
  },
  {
    slug: "golden-goose-superstar",
    category: "lifestyle-sneakers",
    brand: "Golden Goose",
    model: "Super-Star Distressed Sneaker",
    url: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80",
    alt: "Golden Goose Super-Star hand-distressed vintage leather sneaker with signature star patch"
  },
  {
    slug: "loro-piana-360-flexy",
    category: "lifestyle-sneakers",
    brand: "Loro Piana",
    model: "360 Flexy Walk",
    url: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=800&q=80",
    alt: "Loro Piana 360 Flexy Walk knitted Wish wool ultra-lightweight sneaker"
  },
  {
    slug: "prada-americas-cup",
    category: "lifestyle-sneakers",
    brand: "Prada",
    model: "America's Cup Sneaker",
    url: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80",
    alt: "Prada America's Cup patent leather and technical bike fabric low-top sneaker"
  },
  {
    slug: "chanel-sneaker",
    category: "lifestyle-sneakers",
    brand: "Chanel",
    model: "CC Low-Top Sneaker",
    url: "https://images.unsplash.com/photo-1549298916-f52d724204b4?auto=format&fit=crop&w=800&q=80",
    alt: "Chanel CC embroidered low-top calfskin and suede runner sneaker"
  },
  {
    slug: "tom-ford-cambridge",
    category: "lifestyle-sneakers",
    brand: "Tom Ford",
    model: "Cambridge Sneaker",
    url: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80",
    alt: "Tom Ford Cambridge clean low-top sneaker in burnished calfskin"
  },

  // =========================================================================
  // 5. RUNNING SHOES
  // =========================================================================
  {
    slug: "balenciaga-runner",
    category: "running-shoes",
    brand: "Balenciaga",
    model: "Balenciaga Runner Sneaker",
    url: "https://images.unsplash.com/photo-1597045566677-8cf032ed6634?auto=format&fit=crop&w=800&q=80",
    alt: "Balenciaga Runner distressed vintage track and marathon performance runner"
  },
  {
    slug: "dior-chrono",
    category: "running-shoes",
    brand: "Dior",
    model: "Dior Chrono Mesh Runner",
    url: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80",
    alt: "Dior Chrono technical mesh runner with metallic accents"
  },
  {
    slug: "on-cloudmonster",
    category: "running-shoes",
    brand: "On Running",
    model: "Cloudmonster",
    url: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80",
    alt: "On Running Cloudmonster maximum cushion CloudTec road running shoe"
  },
  {
    slug: "on-cloudstratus",
    category: "running-shoes",
    brand: "On Running",
    model: "Cloudstratus",
    url: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80",
    alt: "On Running Cloudstratus double CloudTec layer endurance marathon running shoe"
  },
  {
    slug: "nike-alphafly-3",
    category: "running-shoes",
    brand: "Nike",
    model: "Air Zoom Alphafly NEXT% 3",
    url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80",
    alt: "Nike Air Zoom Alphafly NEXT% 3 carbon plate marathon racing shoe",
    aliases: ["signature-running"]
  },
  {
    slug: "nike-vaporfly-3",
    category: "running-shoes",
    brand: "Nike",
    model: "ZoomX Vaporfly 3",
    url: "https://upload.wikimedia.org/wikipedia/commons/d/d5/HK_clothing_NIKE_brand_Vaporfly_Next_sneakers_white_n_silver_shoes_October_2022_Px3_03.jpg",
    alt: "Nike ZoomX Vaporfly 3 road racing shoe with full-length carbon flyplate"
  },
  {
    slug: "adidas-adios-pro-3",
    category: "running-shoes",
    brand: "Adidas",
    model: "Adizero Adios Pro 3",
    url: "https://images.unsplash.com/photo-1518002171953-a080ee817e1f?auto=format&fit=crop&w=800&q=80",
    alt: "Adidas Adizero Adios Pro 3 Lightstrike Pro carbon EnergyRods racing shoe"
  },
  {
    slug: "asics-gel-kayano-31",
    category: "running-shoes",
    brand: "ASICS",
    model: "GEL-Kayano 31",
    url: "https://upload.wikimedia.org/wikipedia/commons/b/bb/ASICS_Gel-Kayano_26_%28womens%29.jpg",
    alt: "ASICS GEL-Kayano 31 4D GUIDANCE system stability marathon road running shoe"
  },
  {
    slug: "asics-gel-nimbus-26",
    category: "running-shoes",
    brand: "ASICS",
    model: "GEL-Nimbus 26",
    url: "https://upload.wikimedia.org/wikipedia/commons/8/8b/Asics_Gel-Cumulus_22.jpg",
    alt: "ASICS GEL-Nimbus 26 PureGEL maximum cushioning neutral road running shoe"
  },
  {
    slug: "hoka-clifton",
    category: "running-shoes",
    brand: "HOKA",
    model: "Clifton 9 / Bondi",
    url: "https://upload.wikimedia.org/wikipedia/commons/d/d9/Hoka_One_One_-_Bondi_6.jpg",
    alt: "HOKA Clifton 9 lightweight maximum cushioned road running shoe"
  },
  {
    slug: "saucony-endorphin",
    category: "running-shoes",
    brand: "Saucony",
    model: "Endorphin Pro 4",
    url: "https://upload.wikimedia.org/wikipedia/commons/3/37/Saucony_Peregrine_8.jpg",
    alt: "Saucony Endorphin Pro 4 SPEEDROLL carbon plate racing shoe"
  },
  {
    slug: "puma-deviate-nitro",
    category: "running-shoes",
    brand: "Puma",
    model: "Deviate Nitro 3",
    url: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80",
    alt: "Puma Deviate Nitro 3 NITROFOAM Elite propulsion road runner"
  },
  {
    slug: "new-balance-1080",
    category: "running-shoes",
    brand: "New Balance",
    model: "Fresh Foam X 1080v13",
    url: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80",
    alt: "New Balance Fresh Foam X 1080v13 premium cushion road running shoe"
  }
];

export async function fetchAndProcessFootwearImages(): Promise<{ success: number; failed: number }> {
  const targetDir = path.resolve(process.cwd(), "public/images/products");
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  console.log(`[Footwear Specialist] Processing ${FOOTWEAR_TARGETS.length} iconic footwear models into ${targetDir}...`);
  let success = 0;
  let failed = 0;

  for (const item of FOOTWEAR_TARGETS) {
    const filename = `shoes-${item.slug}.webp`;
    const dest = path.join(targetDir, filename);

    try {
      console.log(`Fetching [${item.brand}] ${item.model} from ${item.url.slice(0, 60)}...`);
      const res = await fetch(item.url, {
        headers: {
          "User-Agent": "BuyerGuardCatalogBot/1.0 (catalog@buyerguard.luxury; Footwear Archive)",
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const rawBuf = Buffer.from(await res.arrayBuffer());
      if (rawBuf.length < 500) {
        throw new Error("Received empty or corrupt payload");
      }

      // Resize each to 600x600, fit "contain" on #fbfbfb, compress to WebP (quality 82, 15-30 KB)
      const webpBuffer = await sharp(rawBuf)
        .resize(600, 600, {
          fit: "contain",
          background: { r: 251, g: 251, b: 251, alpha: 1 }
        })
        .webp({
          quality: 82,
          effort: 6
        })
        .toBuffer();

      fs.writeFileSync(dest, webpBuffer);
      const kb = (webpBuffer.length / 1024).toFixed(1);
      console.log(`[SAVED] ${filename.padEnd(35)} -> ${kb} KB (600x600 contain #fbfbfb WebP q82)`);
      success++;

      // Handle any legacy aliases if specified
      if (item.aliases && item.aliases.length > 0) {
        for (const alias of item.aliases) {
          const aliasFilename = `shoes-${alias}.webp`;
          const aliasDest = path.join(targetDir, aliasFilename);
          fs.writeFileSync(aliasDest, webpBuffer);
          console.log(`  └─ [ALIAS] ${aliasFilename.padEnd(31)} -> synced`);
        }
      }
    } catch (err: any) {
      console.error(`[ERROR] ${filename}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n[Footwear Specialist] Finished: ${success} succeeded, ${failed} failed.`);
  return { success, failed };
}

if (process.argv[1]?.includes("fetch-footwear-images")) {
  fetchAndProcessFootwearImages()
    .then(({ failed }) => {
      if (failed > 0) {
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
