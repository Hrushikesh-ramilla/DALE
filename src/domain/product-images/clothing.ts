import { ProductQuery, ProductImageResolution, makeImg } from "./types";

export function resolveClothingImage(product: ProductQuery): ProductImageResolution | null {
  const nameLower = (product.name || "").toLowerCase();
  const brandLower = (product.brand || "").toLowerCase();
  const modelLower = (
    product.modelName ||
    (product.attributes?.modelName as string) ||
    ""
  ).toLowerCase();
  const fullText = `${nameLower} ${brandLower} ${modelLower}`;
  const leaf = (product.leafType || product.category || "").toLowerCase();

  const clothingLeaves = [
    "suits",
    "coats",
    "jackets",
    "shirts",
    "t-shirts",
    "knitwear",
    "trousers",
    "denim",
    "dresses"
  ];

  const isClothingLeaf = clothingLeaves.includes(leaf);
  const isClothingCategory =
    leaf === "clothing" ||
    (product.category || "").toLowerCase() === "clothing";

  const isClothingText =
    fullText.includes("suit") ||
    fullText.includes("tuxedo") ||
    fullText.includes("coat") ||
    fullText.includes("trench") ||
    fullText.includes("jacket") ||
    fullText.includes("blazer") ||
    fullText.includes("shirt") ||
    fullText.includes("knit") ||
    fullText.includes("sweater") ||
    fullText.includes("trouser") ||
    fullText.includes("denim") ||
    fullText.includes("jeans") ||
    fullText.includes("dress") ||
    fullText.includes("gown");

  if (!isClothingLeaf && !isClothingCategory && !isClothingText) {
    return null;
  }

  // =========================================================================
  // 1. SUITS & TAILORING
  // =========================================================================
  if (leaf === "suits" || fullText.includes("tuxedo") || fullText.includes("suit")) {
    // Tom Ford
    if (brandLower.includes("tom ford") || fullText.includes("tom ford")) {
      if (fullText.includes("shelton") && (fullText.includes("tuxedo") || fullText.includes("peak lapel"))) {
        return makeImg("clothing-tom-ford-shelton-tuxedo.webp", "Tom Ford Shelton Peak Lapel Tuxedo", "Tom Ford");
      }
      if (fullText.includes("shelton")) {
        return makeImg("suits-tom-ford-shelton.webp", "Tom Ford Shelton Tailored Wool Suit", "Tom Ford");
      }
      if (fullText.includes("tuxedo")) {
        return makeImg("clothing-tom-ford-shelton-tuxedo.webp", "Tom Ford Shelton Peak Lapel Tuxedo", "Tom Ford");
      }
      if (fullText.includes("oconnor") || fullText.includes("o'connor")) {
        return makeImg("clothing-tom-ford-oconnor-suit.webp", "Tom Ford O'Connor Slim Fit Suit", "Tom Ford");
      }
      return makeImg("suits-tom-ford-shelton.webp", "Tom Ford Shelton Tailored Wool Suit", "Tom Ford");
    }

    // Brioni
    if (brandLower.includes("brioni") || fullText.includes("brioni")) {
      if (fullText.includes("continental")) {
        return makeImg("clothing-brioni-continental-suit.webp", "Brioni Continental Tailored Wool Suit", "Brioni");
      }
      return makeImg("suits-brioni-vanquish.webp", "Brioni Vanquish II Bespoke Wool Suit", "Brioni");
    }

    // Canali
    if (brandLower.includes("canali") || fullText.includes("canali")) {
      return makeImg("suits-canali.webp", "Canali Milano Classic Tailored Wool Suit", "Canali");
    }

    // Ralph Lauren / Purple Label
    if (brandLower.includes("ralph lauren") || fullText.includes("purple label")) {
      if (fullText.includes("tuxedo") || fullText.includes("dinner")) {
        return makeImg("clothing-ralph-lauren-purple-label-gregory-tuxedo.webp", "Ralph Lauren Purple Label Gregory Tuxedo", "Ralph Lauren");
      }
      return makeImg("suits-ralph-lauren.webp", "Ralph Lauren Purple Label Gregory Hand-Tailored Wool Suit", "Ralph Lauren");
    }

    // Zegna
    if (brandLower.includes("zegna") || fullText.includes("zegna")) {
      return makeImg("clothing-zegna-trofeo-suit.webp", "Zegna Trofeo Wool Two-Piece Suit", "Zegna");
    }

    // Giorgio Armani
    if (brandLower.includes("armani") || fullText.includes("armani")) {
      return makeImg("clothing-armani-soho-suit.webp", "Giorgio Armani Soho Fluid Virgin Wool Suit", "Giorgio Armani");
    }

    // Dior Men
    if (brandLower.includes("dior") || fullText.includes("dior")) {
      if (fullText.includes("tuxedo")) {
        return makeImg("clothing-dior-men-oblique-tuxedo.webp", "Dior Men Oblique Tailored Wool Tuxedo", "Dior Men");
      }
      return makeImg("suits-dior-men.webp", "Dior Men Oblique Tailored Wool Suit", "Dior Men");
    }

    // Dolce & Gabbana
    if (brandLower.includes("dolce") || fullText.includes("dolce & gabbana") || fullText.includes("dolce and gabbana")) {
      return makeImg("suits-dolce-gabbana.webp", "Dolce & Gabbana Martini Sicilia Wool Suit", "Dolce & Gabbana");
    }

    // Fendi
    if (brandLower.includes("fendi") || fullText.includes("fendi")) {
      return makeImg("suits-fendi.webp", "Fendi Tailored Single-Breasted Wool Suit", "Fendi");
    }

    // Balenciaga
    if (brandLower.includes("balenciaga") || fullText.includes("balenciaga")) {
      if (fullText.includes("cocoon") || fullText.includes("unstructured")) {
        return makeImg("suits-balenciaga-cocoon.webp", "Balenciaga Cocoon Cut Unstructured Wool Gabardine Suit", "Balenciaga");
      }
      if (fullText.includes("tuxedo") || fullText.includes("evening")) {
        return makeImg("suits-balenciaga-tuxedo.webp", "Balenciaga Evening Peak Lapel Grain de Poudre Tuxedo", "Balenciaga");
      }
      if (fullText.includes("hourglass")) {
        return makeImg("suits-balenciaga-hourglass.webp", "Balenciaga Hourglass Tailored Single-Breasted Wool Suit", "Balenciaga");
      }
      if (fullText.includes("flared") || fullText.includes("pinstripe")) {
        return makeImg("suits-balenciaga-pinstripe.webp", "Balenciaga Flared Leg Pinstripe Wool Runway Suit", "Balenciaga");
      }
      return makeImg("suits-balenciaga.webp", "Balenciaga Micro-Check Double-Breasted Boxy Suit", "Balenciaga");
    }

    // Prada
    if (brandLower.includes("prada") || fullText.includes("prada")) {
      return makeImg("suits-prada.webp", "Prada Single-Breasted Virgin Wool Suit", "Prada");
    }

    // Saint Laurent
    if (brandLower.includes("saint laurent") || fullText.includes("smoking")) {
      return makeImg("clothing-saint-laurent-smoking-jacket-suit.webp", "Saint Laurent Le Smoking Grain de Poudre Suit", "Saint Laurent");
    }

    // Default suit
    return makeImg("suits-signature-bespoke.webp", `${product.name} luxury tailored suit`, product.brand);
  }

  // =========================================================================
  // 2. COATS
  // =========================================================================
  if (leaf === "coats" || fullText.includes("overcoat") || fullText.includes("trench")) {
    if (brandLower.includes("burberry") || fullText.includes("burberry")) {
      if (fullText.includes("westminster")) {
        return makeImg("clothing-burberry-westminster-car-coat.webp", "Burberry Westminster Heritage Trench Coat", "Burberry");
      }
      return makeImg("clothing-burberry-kensington-trench.webp", "Burberry Kensington Heritage Trench Coat", "Burberry");
    }
    if (brandLower.includes("max mara") || fullText.includes("max mara")) {
      if (fullText.includes("teddy")) {
        return makeImg("clothing-max-mara-teddy-bear-coat.webp", "Max Mara Teddy Bear Icon Coat", "Max Mara");
      }
      return makeImg("clothing-max-mara-101801-icon-coat.webp", "Max Mara 101801 Icon Double-Breasted Coat", "Max Mara");
    }
    if (brandLower.includes("loro piana") || fullText.includes("loro piana")) {
      return makeImg("clothing-loro-piana-martingala-overcoat.webp", "Loro Piana Martingala Cashmere Overcoat", "Loro Piana");
    }
    if (brandLower.includes("moncler") || fullText.includes("moncler")) {
      return makeImg("clothing-moncler-maya-down-jacket.webp", "Moncler Maya Lacquered Down Jacket", "Moncler");
    }
    if (brandLower.includes("celine") || fullText.includes("celine")) {
      return makeImg("clothing-celine-reefer-coat.webp", "Celine Double-Breasted Wool Reefer Coat", "Celine");
    }
    return makeImg("clothing-burberry-kensington-trench.webp", `${product.name} luxury coat`, product.brand);
  }

  // =========================================================================
  // 3. JACKETS & OUTERWEAR
  // =========================================================================
  if (leaf === "jackets" || fullText.includes("jacket") || fullText.includes("blazer") || fullText.includes("bomber")) {
    if (brandLower.includes("saint laurent") || fullText.includes("biker") || fullText.includes("l01")) {
      return makeImg("clothing-saint-laurent-l01-leather-biker.webp", "Saint Laurent Classic Motorcycle Leather Biker Jacket (L01)", "Saint Laurent");
    }
    if (brandLower.includes("bottega veneta") || fullText.includes("harrington")) {
      return makeImg("clothing-bottega-veneta-leather-harrington.webp", "Bottega Veneta Leather Harrington Jacket", "Bottega Veneta");
    }
    if (brandLower.includes("brunello cucinelli") || fullText.includes("cucinelli")) {
      return makeImg("clothing-brunello-cucinelli-suede-bomber.webp", "Brunello Cucinelli Suede Bomber Jacket", "Brunello Cucinelli");
    }
    if (brandLower.includes("balenciaga") || fullText.includes("hourglass")) {
      return makeImg("clothing-balenciaga-hourglass-blazer.webp", "Balenciaga Hourglass Tailored Blazer", "Balenciaga");
    }
    if (brandLower.includes("gucci") || fullText.includes("gucci")) {
      return makeImg("clothing-gucci-web-stripe-track-jacket.webp", "Gucci Web Stripe Zip Track Jacket", "Gucci");
    }
    if (brandLower.includes("moncler") || fullText.includes("moncler")) {
      return makeImg("clothing-moncler-maya-down-jacket.webp", "Moncler Maya Lacquered Down Jacket", "Moncler");
    }
    return makeImg("clothing-saint-laurent-l01-leather-biker.webp", `${product.name} luxury jacket`, product.brand);
  }

  // =========================================================================
  // 4. SHIRTS
  // =========================================================================
  if (leaf === "shirts" || (fullText.includes("shirt") && !fullText.includes("t-shirt") && !fullText.includes("tee"))) {
    if (brandLower.includes("brioni") || fullText.includes("brioni")) {
      return makeImg("clothing-brioni-royal-oxford-shirt.webp", "Brioni Milano Spread Collar Sea Island Cotton Shirt", "Brioni");
    }
    if (brandLower.includes("dior") || fullText.includes("dior")) {
      return makeImg("clothing-dior-men-oblique-shirt.webp", "Dior Men Oblique Silk Jacquard Button-Down Shirt", "Dior");
    }
    if (brandLower.includes("gucci") || fullText.includes("gucci")) {
      return makeImg("clothing-gucci-gg-silk-bowling-shirt.webp", "Gucci GG Monogram Silk Bowling Shirt", "Gucci");
    }
    if (brandLower.includes("tom ford") || fullText.includes("tom ford")) {
      return makeImg("clothing-tom-ford-classic-poplin-shirt.webp", "Tom Ford Classic Barrel Cuff Cotton Poplin Shirt", "Tom Ford");
    }
    if (brandLower.includes("zegna") || fullText.includes("zegna")) {
      return makeImg("clothing-zegna-linen-over-shirt.webp", "Zegna Oasi Lino Spread Collar Pure Linen Shirt", "Zegna");
    }
    return makeImg("clothing-brioni-royal-oxford-shirt.webp", `${product.name} luxury tailored dress shirt`, product.brand);
  }

  // =========================================================================
  // 5. T-SHIRTS
  // =========================================================================
  if (leaf === "t-shirts" || fullText.includes("t-shirt") || fullText.includes("tee")) {
    if (brandLower.includes("balenciaga") || fullText.includes("balenciaga")) {
      if (fullText.includes("tape")) {
        return makeImg("clothing-balenciaga-tape-type-tshirt.webp", "Balenciaga Tape Type Oversized T-Shirt", "Balenciaga");
      }
      return makeImg("clothing-balenciaga-political-campaign-tshirt.webp", "Balenciaga Political Campaign Large Fit T-Shirt", "Balenciaga");
    }
    if (brandLower.includes("celine") || fullText.includes("celine")) {
      return makeImg("clothing-celine-loose-logo-tshirt.webp", "Celine Loose Celine Cotton Jersey T-Shirt", "Celine");
    }
    if (brandLower.includes("brunello cucinelli") || fullText.includes("cucinelli")) {
      return makeImg("clothing-brunello-cucinelli-cashmere-silk-tshirt.webp", "Brunello Cucinelli Cashmere-Silk Crewneck T-Shirt", "Brunello Cucinelli");
    }
    if (brandLower.includes("prada") || fullText.includes("prada")) {
      return makeImg("clothing-prada-re-nylon-pocket-tshirt.webp", "Prada Cotton T-Shirt with Enamelled Triangle Pocket", "Prada");
    }
    return makeImg("clothing-balenciaga-political-campaign-tshirt.webp", `${product.name} luxury designer T-shirt`, product.brand);
  }

  // =========================================================================
  // 6. KNITWEAR
  // =========================================================================
  if (leaf === "knitwear" || fullText.includes("knit") || fullText.includes("sweater") || fullText.includes("cardigan") || fullText.includes("pullover")) {
    if (brandLower.includes("loro piana") || fullText.includes("loro piana")) {
      if (fullText.includes("zip") || fullText.includes("mezzocollo")) {
        return makeImg("clothing-loro-piana-mezzocollo-zip.webp", "Loro Piana Roadster Mezzocollo Half-Zip Cashmere Pullover", "Loro Piana");
      }
      return makeImg("clothing-loro-piana-baby-cashmere-crewneck.webp", "Loro Piana Baby Cashmere Crewneck Sweater", "Loro Piana");
    }
    if (brandLower.includes("brunello cucinelli") || fullText.includes("cucinelli")) {
      return makeImg("clothing-brunello-cucinelli-cable-knit.webp", "Brunello Cucinelli Solomeo Cashmere Cable-Knit Sweater", "Brunello Cucinelli");
    }
    if (brandLower.includes("chanel") || fullText.includes("chanel")) {
      return makeImg("clothing-chanel-cashmere-cardigan.webp", "Chanel Cashmere Cardigan with Coco Buttons", "Chanel");
    }
    if (brandLower.includes("hermès") || brandLower.includes("hermes")) {
      return makeImg("clothing-hermes-cashmere-silk-knit.webp", "Hermès H En Biais Cashmere-Silk Crewneck", "Hermès");
    }
    return makeImg("clothing-loro-piana-baby-cashmere-crewneck.webp", `${product.name} luxury fine-gauge cashmere knitwear`, product.brand);
  }

  // =========================================================================
  // 7. TROUSERS
  // =========================================================================
  if (leaf === "trousers" || fullText.includes("trouser") || fullText.includes("pant")) {
    if (brandLower.includes("brunello cucinelli") || fullText.includes("cucinelli")) {
      return makeImg("clothing-brunello-cucinelli-pleated-trousers.webp", "Brunello Cucinelli Double-Pleated Wool Gabardine Trousers", "Brunello Cucinelli");
    }
    if (brandLower.includes("brioni") || fullText.includes("brioni")) {
      return makeImg("clothing-brioni-sarto-wool-trousers.webp", "Brioni Tailored Straight-Leg Compact Mohair Trousers", "Brioni");
    }
    if (brandLower.includes("bottega veneta") || fullText.includes("bottega")) {
      return makeImg("clothing-bottega-veneta-gabardine-trousers.webp", "Bottega Veneta Curved Seam Relaxed Wool Gabardine Trousers", "Bottega Veneta");
    }
    if (brandLower.includes("tom ford") || fullText.includes("tom ford")) {
      return makeImg("clothing-tom-ford-atticus-trousers.webp", "Tom Ford Atticus Side-Tab Tailored Wool Trousers", "Tom Ford");
    }
    return makeImg("clothing-brunello-cucinelli-pleated-trousers.webp", `${product.name} luxury tailored trousers`, product.brand);
  }

  // =========================================================================
  // 8. DENIM
  // =========================================================================
  if (leaf === "denim" || fullText.includes("denim") || fullText.includes("jean")) {
    if (brandLower.includes("saint laurent") || fullText.includes("saint laurent")) {
      return makeImg("clothing-saint-laurent-d02-skinny-denim.webp", "Saint Laurent D02 Skinny Raw Indigo Denim Jeans", "Saint Laurent");
    }
    if (brandLower.includes("balenciaga") || fullText.includes("balenciaga")) {
      return makeImg("clothing-balenciaga-super-large-baggy-denim.webp", "Balenciaga Super Large Baggy Fit Japanese Denim Jeans", "Balenciaga");
    }
    if (brandLower.includes("celine") || fullText.includes("celine")) {
      return makeImg("clothing-celine-wesley-denim.webp", "Celine Wesley Straight Leg Washed Denim Jeans", "Celine");
    }
    if (brandLower.includes("prada") || fullText.includes("prada")) {
      return makeImg("clothing-prada-bleached-denim.webp", "Prada Five-Pocket Washed Denim Jeans with Enamelled Triangle", "Prada");
    }
    return makeImg("clothing-saint-laurent-d02-skinny-denim.webp", `${product.name} luxury designer denim jeans`, product.brand);
  }

  // =========================================================================
  // 9. DRESSES & GOWNS
  // =========================================================================
  if (leaf === "dresses" || fullText.includes("dress") || fullText.includes("gown")) {
    if (brandLower.includes("chanel") || fullText.includes("chanel")) {
      return makeImg("clothing-chanel-little-black-dress.webp", "Chanel Little Black Dress in Tweed Bouclé", "Chanel");
    }
    if (brandLower.includes("dior") || fullText.includes("dior")) {
      return makeImg("clothing-dior-corolle-evening-gown.webp", "Dior Corolle Silk Organza Evening Gown", "Dior");
    }
    if (brandLower.includes("alexander mcqueen") || fullText.includes("mcqueen")) {
      return makeImg("clothing-alexander-mcqueen-anemone-gown.webp", "Alexander McQueen Anemone Print Exploded Sleeve Silk Gown", "Alexander McQueen");
    }
    if (brandLower.includes("saint laurent") || fullText.includes("saint laurent")) {
      return makeImg("clothing-saint-laurent-crepe-gown.webp", "Saint Laurent Floor-Length Silk Crepe Gown with Slit", "Saint Laurent");
    }
    if (brandLower.includes("versace") || fullText.includes("versace")) {
      return makeImg("clothing-versace-barocco-corset-dress.webp", "Versace Barocco Print Silk Corset Midi Dress", "Versace");
    }
    return makeImg("clothing-chanel-little-black-dress.webp", `${product.name} luxury evening dress`, product.brand);
  }

  return null;
}
