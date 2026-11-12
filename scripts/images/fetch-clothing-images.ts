import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

export interface ClothingImageTarget {
  slug: string;
  category: "suits" | "coats" | "jackets" | "shirts" | "t-shirts" | "knitwear" | "trousers" | "denim" | "dresses";
  brand: string;
  model: string;
  url: string;
  alt: string;
  aliases?: string[];
}

export const CLOTHING_TARGETS: ClothingImageTarget[] = [
  // =========================================================================
  // 1. SUITS & TAILORING
  // =========================================================================
  {
    slug: "tom-ford-shelton-tuxedo",
    category: "suits",
    brand: "Tom Ford",
    model: "Shelton Peak Lapel Tuxedo",
    url: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
    alt: "Tom Ford Shelton Peak Lapel black silk-faille tuxedo with satin lapels",
    aliases: ["shelton-tuxedo", "tom-ford-tuxedo"]
  },
  {
    slug: "tom-ford-oconnor-suit",
    category: "suits",
    brand: "Tom Ford",
    model: "O'Connor Slim Fit Suit",
    url: "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&w=800&q=80",
    alt: "Tom Ford O'Connor tailored slim-fit charcoal wool suit",
    aliases: ["oconnor-suit"]
  },
  {
    slug: "brioni-vanquish-suit",
    category: "suits",
    brand: "Brioni",
    model: "Vanquish II Bespoke Two-Piece Suit",
    url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
    alt: "Brioni Vanquish II bespoke hand-stitched navy Super 180s wool suit",
    aliases: ["brioni-vanquish"]
  },
  {
    slug: "brioni-continental-suit",
    category: "suits",
    brand: "Brioni",
    model: "Continental Wool Suit",
    url: "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=800&q=80",
    alt: "Brioni Continental classic two-piece tailored grey melange wool suit",
    aliases: ["brioni-continental"]
  },
  {
    slug: "canali-kei-suit",
    category: "suits",
    brand: "Canali",
    model: "Kei Soft Unstructured Suit",
    url: "https://images.unsplash.com/photo-1598808503746-f34c53b9323e?auto=format&fit=crop&w=800&q=80",
    alt: "Canali Kei unstructured fluid tailored wool jacket and trousers",
    aliases: ["canali-kei"]
  },
  {
    slug: "ralph-lauren-purple-label-gregory-tuxedo",
    category: "suits",
    brand: "Ralph Lauren Purple Label",
    model: "Gregory Handmade Tuxedo",
    url: "https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80",
    alt: "Ralph Lauren Purple Label Gregory handmade black barathea wool tuxedo",
    aliases: ["gregory-tuxedo"]
  },
  {
    slug: "zegna-trofeo-suit",
    category: "suits",
    brand: "Zegna",
    model: "Trofeo Wool Two-Piece Suit",
    url: "https://images.unsplash.com/photo-1555069519-127aadedf1ee?auto=format&fit=crop&w=800&q=80",
    alt: "Ermenegildo Zegna Trofeo superfine Australian wool tailored suit",
    aliases: ["zegna-trofeo"]
  },
  {
    slug: "armani-soho-suit",
    category: "suits",
    brand: "Giorgio Armani",
    model: "Soho Unstructured Two-Button Fluid Virgin Wool Suit",
    url: "https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?auto=format&fit=crop&w=800&q=80",
    alt: "Giorgio Armani Soho deconstructed navy virgin wool fluid suit",
    aliases: ["armani-soho", "giorgio-armani-soho"]
  },
  {
    slug: "dior-men-oblique-tuxedo",
    category: "suits",
    brand: "Dior Men",
    model: "Oblique Tailored Wool Tuxedo",
    url: "https://images.unsplash.com/photo-1589310243389-96a5483213a8?auto=format&fit=crop&w=800&q=80",
    alt: "Dior Men tailored oblique closure grain de poudre wool tuxedo",
    aliases: ["dior-tuxedo", "dior-oblique-suit"]
  },
  {
    slug: "prada-single-breasted-suit",
    category: "suits",
    brand: "Prada",
    model: "Single-Breasted Stretch Mohair Suit",
    url: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=800&q=80",
    alt: "Prada slim-cut black stretch wool-mohair two-button tailored suit",
    aliases: ["prada-mohair-suit"]
  },
  {
    slug: "saint-laurent-smoking-jacket-suit",
    category: "suits",
    brand: "Saint Laurent",
    model: "Le Smoking Wool Grain de Poudre Suit",
    url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
    alt: "Saint Laurent Le Smoking iconic sharp peak lapel black evening suit",
    aliases: ["saint-laurent-le-smoking"]
  },

  // =========================================================================
  // 2. COATS
  // =========================================================================
  {
    slug: "burberry-kensington-trench",
    category: "coats",
    brand: "Burberry",
    model: "Kensington Heritage Trench Coat",
    url: "https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&w=800&q=80",
    alt: "Burberry Kensington Heritage double-breasted honey cotton gabardine trench coat",
    aliases: ["burberry-trench", "kensington-trench"]
  },
  {
    slug: "burberry-westminster-car-coat",
    category: "coats",
    brand: "Burberry",
    model: "Westminster Heritage Trench Coat",
    url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80",
    alt: "Burberry Westminster relaxed-fit dark military green gabardine coat",
    aliases: ["burberry-westminster"]
  },
  {
    slug: "max-mara-101801-icon-coat",
    category: "coats",
    brand: "Max Mara",
    model: "101801 Icon Double-Breasted Coat",
    url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80",
    alt: "Max Mara 101801 Icon camel wool and cashmere double-breasted coat",
    aliases: ["max-mara-101801", "max-mara-camel-coat"]
  },
  {
    slug: "max-mara-teddy-bear-coat",
    category: "coats",
    brand: "Max Mara",
    model: "Teddy Bear Icon Coat",
    url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80",
    alt: "Max Mara Teddy Bear plush camel hair on a silk base cocoon coat",
    aliases: ["teddy-bear-coat"]
  },
  {
    slug: "loro-piana-martingala-overcoat",
    category: "coats",
    brand: "Loro Piana",
    model: "Martingala Cashmere Overcoat",
    url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80",
    alt: "Loro Piana double-faced pure baby cashmere Martingala tailored overcoat",
    aliases: ["martingala-overcoat", "loro-piana-coat"]
  },
  {
    slug: "moncler-maya-down-jacket",
    category: "coats",
    brand: "Moncler",
    model: "Maya Lacquered Down Jacket",
    url: "https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80",
    alt: "Moncler Maya black shiny nylon laqué boudin-quilted goose down jacket",
    aliases: ["moncler-maya"]
  },
  {
    slug: "celine-reefer-coat",
    category: "coats",
    brand: "Celine",
    model: "Double-Breasted Wool Reefer Coat",
    url: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=800&q=80",
    alt: "Celine double-breasted officer collar tailored black wool peacoat",
    aliases: ["celine-coat"]
  },

  // =========================================================================
  // 3. JACKETS & OUTERWEAR
  // =========================================================================
  {
    slug: "saint-laurent-l01-leather-biker",
    category: "jackets",
    brand: "Saint Laurent",
    model: "Classic Motorcycle Leather Biker Jacket (L01)",
    url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80",
    alt: "Saint Laurent Paris L01 black washed lambskin asymmetrical motorcycle biker jacket",
    aliases: ["ysl-l01", "saint-laurent-biker"]
  },
  {
    slug: "bottega-veneta-leather-harrington",
    category: "jackets",
    brand: "Bottega Veneta",
    model: "Leather Harrington Jacket",
    url: "https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=800&q=80",
    alt: "Bottega Veneta supple nappa leather zipped Harrington jacket with Intrecciato tab",
    aliases: ["bottega-harrington"]
  },
  {
    slug: "brunello-cucinelli-suede-bomber",
    category: "jackets",
    brand: "Brunello Cucinelli",
    model: "Suede Bomber Jacket",
    url: "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80",
    alt: "Brunello Cucinelli Solomeo butter-soft goat suede bomber jacket with ribbed cashmere trim",
    aliases: ["cucinelli-bomber"]
  },
  {
    slug: "balenciaga-hourglass-blazer",
    category: "jackets",
    brand: "Balenciaga",
    model: "Hourglass Tailored Blazer",
    url: "https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?auto=format&fit=crop&w=800&q=80",
    alt: "Balenciaga Hourglass sculptured waist double-breasted virgin wool blazer",
    aliases: ["balenciaga-hourglass"]
  },
  {
    slug: "gucci-web-stripe-track-jacket",
    category: "jackets",
    brand: "Gucci",
    model: "Web Stripe Zip Track Jacket",
    url: "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=800&q=80",
    alt: "Gucci technical jersey zip-up jacket with green and red signature Web stripe",
    aliases: ["gucci-track-jacket"]
  },

  // =========================================================================
  // 4. SHIRTS
  // =========================================================================
  {
    slug: "brioni-royal-oxford-shirt",
    category: "shirts",
    brand: "Brioni",
    model: "Milano Spread Collar West Indian Sea Island Cotton Shirt",
    url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
    alt: "Brioni crisp white Sea Island cotton spread-collar tailored dress shirt",
    aliases: ["brioni-shirt", "royal-oxford-shirt"]
  },
  {
    slug: "dior-men-oblique-shirt",
    category: "shirts",
    brand: "Dior Men",
    model: "Dior Oblique Silk Jacquard Button-Down Shirt",
    url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80",
    alt: "Dior Men all-over Oblique monogram motif navy silk twill short-sleeve shirt",
    aliases: ["dior-oblique-shirt"]
  },
  {
    slug: "gucci-gg-silk-bowling-shirt",
    category: "shirts",
    brand: "Gucci",
    model: "GG Monogram Silk Bowling Shirt",
    url: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80",
    alt: "Gucci beige and ebony GG supreme print fluid silk-satin bowling shirt",
    aliases: ["gucci-bowling-shirt"]
  },
  {
    slug: "tom-ford-classic-poplin-shirt",
    category: "shirts",
    brand: "Tom Ford",
    model: "Classic Barrel Cuff Cotton Poplin Shirt",
    url: "https://images.unsplash.com/photo-1620012253295-c15c429f66bf?auto=format&fit=crop&w=800&q=80",
    alt: "Tom Ford slim-fit white Swiss cotton poplin shirt with spread collar",
    aliases: ["tom-ford-shirt"]
  },
  {
    slug: "zegna-linen-over-shirt",
    category: "shirts",
    brand: "Zegna",
    model: "Oasi Lino Spread Collar Pure Linen Shirt",
    url: "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&w=800&q=80",
    alt: "Zegna Oasi Lino natural flax breathable Italian linen casual overshirt",
    aliases: ["zegna-shirt", "oasi-lino"]
  },

  // =========================================================================
  // 5. T-SHIRTS
  // =========================================================================
  {
    slug: "balenciaga-political-campaign-tshirt",
    category: "t-shirts",
    brand: "Balenciaga",
    model: "Political Campaign Large Fit T-Shirt",
    url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
    alt: "Balenciaga Political Campaign wave logo printed oversized vintage jersey T-shirt",
    aliases: ["balenciaga-tshirt", "political-campaign-tshirt"]
  },
  {
    slug: "balenciaga-tape-type-tshirt",
    category: "t-shirts",
    brand: "Balenciaga",
    model: "Tape Type Oversized T-Shirt",
    url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80",
    alt: "Balenciaga Tape Type faded black distressed heavy cotton graphic T-shirt",
    aliases: ["balenciaga-tape-type"]
  },
  {
    slug: "celine-loose-logo-tshirt",
    category: "t-shirts",
    brand: "Celine",
    model: "Loose Celine Cotton Jersey T-Shirt",
    url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80",
    alt: "Celine Paris chest logo printed loose-fit white organic cotton T-shirt",
    aliases: ["celine-tshirt"]
  },
  {
    slug: "brunello-cucinelli-cashmere-silk-tshirt",
    category: "t-shirts",
    brand: "Brunello Cucinelli",
    model: "Cashmere and Silk Crewneck T-Shirt",
    url: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80",
    alt: "Brunello Cucinelli ultra-fine featherweight cashmere-silk crewneck knit T-shirt",
    aliases: ["cucinelli-tshirt"]
  },
  {
    slug: "prada-re-nylon-pocket-tshirt",
    category: "t-shirts",
    brand: "Prada",
    model: "Cotton T-Shirt with Enamelled Triangle Pocket",
    url: "https://images.unsplash.com/photo-1527719327859-c6ce80353573?auto=format&fit=crop&w=800&q=80",
    alt: "Prada black piqué cotton T-shirt featuring Re-Nylon pocket and metal enamel triangle logo",
    aliases: ["prada-tshirt"]
  },

  // =========================================================================
  // 6. KNITWEAR
  // =========================================================================
  {
    slug: "loro-piana-baby-cashmere-crewneck",
    category: "knitwear",
    brand: "Loro Piana",
    model: "Baby Cashmere Crewneck Sweater",
    url: "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=800&q=80",
    alt: "Loro Piana classic ribbed knit pure Mongolian baby cashmere crewneck sweater in vicuña brown",
    aliases: ["loro-piana-cashmere", "baby-cashmere"]
  },
  {
    slug: "loro-piana-mezzocollo-zip",
    category: "knitwear",
    brand: "Loro Piana",
    model: "Roadster Mezzocollo Half-Zip Cashmere Pullover",
    url: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=800&q=80",
    alt: "Loro Piana Roadster high-neck half-zip pure cashmere sweater with suede pull",
    aliases: ["loro-piana-mezzocollo", "mezzocollo-zip"]
  },
  {
    slug: "brunello-cucinelli-cable-knit",
    category: "knitwear",
    brand: "Brunello Cucinelli",
    model: "Solomeo Cashmere Cable-Knit Crewneck Sweater",
    url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80",
    alt: "Brunello Cucinelli artisanal textured cable-knit pure cashmere crewneck in oat cream",
    aliases: ["cucinelli-cashmere", "solomeo-cable-knit"]
  },
  {
    slug: "chanel-cashmere-cardigan",
    category: "knitwear",
    brand: "Chanel",
    model: "Cashmere Cardigan with Coco Buttons",
    url: "https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&w=800&q=80",
    alt: "Chanel ivory fine cashmere cardigan with contrasting black trim and CC gold buttons",
    aliases: ["chanel-cardigan"]
  },
  {
    slug: "hermes-cashmere-silk-knit",
    category: "knitwear",
    brand: "Hermès",
    model: "H En Biais Cashmere-Silk Crewneck",
    url: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=800&q=80",
    alt: "Hermès luxury cashmere and silk blend fine-gauge sweater with subtle H motif",
    aliases: ["hermes-knitwear"]
  },

  // =========================================================================
  // 7. TROUSERS
  // =========================================================================
  {
    slug: "brunello-cucinelli-pleated-trousers",
    category: "trousers",
    brand: "Brunello Cucinelli",
    model: "Double-Pleated Wool Gabardine Trousers",
    url: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80",
    alt: "Brunello Cucinelli double-pleated sartorial virgin wool tapered trousers with horn buttons",
    aliases: ["cucinelli-trousers"]
  },
  {
    slug: "brioni-sarto-wool-trousers",
    category: "trousers",
    brand: "Brioni",
    model: "Tailored Straight-Leg Compact Mohair Trousers",
    url: "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=800&q=80",
    alt: "Brioni bespoke tailored straight-leg midnight navy wool-mohair trousers",
    aliases: ["brioni-trousers"]
  },
  {
    slug: "bottega-veneta-gabardine-trousers",
    category: "trousers",
    brand: "Bottega Veneta",
    model: "Curved Seam Relaxed Wool Gabardine Trousers",
    url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80",
    alt: "Bottega Veneta architectural curved-seam relaxed tailored wool trousers",
    aliases: ["bottega-trousers"]
  },
  {
    slug: "tom-ford-atticus-trousers",
    category: "trousers",
    brand: "Tom Ford",
    model: "Atticus Side-Tab Tailored Wool Trousers",
    url: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80",
    alt: "Tom Ford Atticus flat-front tailored trousers with gold-finish side adjusters",
    aliases: ["tom-ford-trousers"]
  },

  // =========================================================================
  // 8. DENIM
  // =========================================================================
  {
    slug: "saint-laurent-d02-skinny-denim",
    category: "denim",
    brand: "Saint Laurent",
    model: "D02 Skinny Raw Indigo Denim Jeans",
    url: "https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=800&q=80",
    alt: "Saint Laurent Paris D02 signature skinny mid-waist raw Japanese selvedge denim jeans",
    aliases: ["saint-laurent-d02", "ysl-denim"]
  },
  {
    slug: "balenciaga-super-large-baggy-denim",
    category: "denim",
    brand: "Balenciaga",
    model: "Super Large Baggy Fit Japanese Denim Jeans",
    url: "https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=800&q=80",
    alt: "Balenciaga extreme oversized skater baggy Japanese ring-spun denim in washed blue",
    aliases: ["balenciaga-baggy-jeans", "balenciaga-denim"]
  },
  {
    slug: "celine-wesley-denim",
    category: "denim",
    brand: "Celine",
    model: "Wesley Straight Leg Washed Denim Jeans",
    url: "https://images.unsplash.com/photo-1565084888279-aca607ecce0c?auto=format&fit=crop&w=800&q=80",
    alt: "Celine Paris Wesley vintage washed straight-leg cotton denim jeans",
    aliases: ["celine-denim"]
  },
  {
    slug: "prada-bleached-denim",
    category: "denim",
    brand: "Prada",
    model: "Five-Pocket Washed Denim Jeans with Enamelled Triangle",
    url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80",
    alt: "Prada regular-fit bleached indigo denim jeans with rear saffiano leather triangle logo",
    aliases: ["prada-denim"]
  },

  // =========================================================================
  // 9. DRESSES & GOWNS
  // =========================================================================
  {
    slug: "chanel-little-black-dress",
    category: "dresses",
    brand: "Chanel",
    model: "Little Black Dress in Tweed Bouclé",
    url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80",
    alt: "Chanel iconic Little Black Dress in structured wool tweed bouclé with silk lining",
    aliases: ["chanel-lbd", "chanel-dress"]
  },
  {
    slug: "dior-corolle-evening-gown",
    category: "dresses",
    brand: "Dior",
    model: "Corolle Silk Organza Evening Gown",
    url: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80",
    alt: "Christian Dior Corolle architectural pleated silk organza haute couture evening gown",
    aliases: ["dior-corolle", "dior-dress"]
  },
  {
    slug: "alexander-mcqueen-anemone-gown",
    category: "dresses",
    brand: "Alexander McQueen",
    model: "Anemone Print Exploded Sleeve Silk Gown",
    url: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=800&q=80",
    alt: "Alexander McQueen dramatic floral exploded sleeve draped pure silk faille evening gown",
    aliases: ["mcqueen-dress", "mcqueen-gown"]
  },
  {
    slug: "saint-laurent-crepe-gown",
    category: "dresses",
    brand: "Saint Laurent",
    model: "Floor-Length Silk Crepe Gown with Slit",
    url: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=800&q=80",
    alt: "Saint Laurent backless bias-cut floor-length black silk crepe evening dress",
    aliases: ["saint-laurent-dress"]
  },
  {
    slug: "versace-barocco-corset-dress",
    category: "dresses",
    brand: "Versace",
    model: "Barocco Print Silk Corset Midi Dress",
    url: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80",
    alt: "Versace gold Medusa hardware Barocco print bonded silk boned corset dress",
    aliases: ["versace-dress"]
  }
];

export async function downloadClothingImages(): Promise<void> {
  const targetDir = path.resolve(process.cwd(), "public/images/products");
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  console.log(`Starting download and WebP optimization for ${CLOTHING_TARGETS.length} luxury clothing assets...`);
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of CLOTHING_TARGETS) {
    const filename = `clothing-${item.slug}.webp`;
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

      // Convert to 600x600 WebP on studio canvas #fbfbfb
      const webp = await sharp(buf)
        .resize(600, 600, {
          fit: "contain",
          background: { r: 251, g: 251, b: 251, alpha: 1 },
        })
        .webp({ quality: 82, effort: 6 })
        .toBuffer();

      fs.writeFileSync(dest, webp);
      console.log(`[SAVED] ${filename.padEnd(42)} -> ${(webp.length / 1024).toFixed(1)} KB`);
      downloaded++;
    } catch (err: any) {
      console.error(`[FAILED] ${filename}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nClothing summary: ${downloaded} downloaded, ${skipped} skipped, ${failed} failed.`);
}

if (process.argv[1]?.includes("fetch-clothing-images")) {
  downloadClothingImages().catch(console.error);
}
