import { ProductQuery, ProductImageResolution, makeImg } from "./types";

export function resolveBagsImage(product: ProductQuery): ProductImageResolution | null {
  const leaf = (product.leafType || product.category || "").toLowerCase();
  const nameLower = (product.name || "").toLowerCase();
  const brandLower = (product.brand || "").toLowerCase();
  const modelLower = (
    product.modelName ||
    (product.attributes?.modelName as string) ||
    ""
  ).toLowerCase();
  const fullText = `${nameLower} ${brandLower} ${modelLower}`;

  const isBag =
    leaf === "handbags" ||
    leaf === "backpacks" ||
    leaf === "wallets" ||
    leaf === "bags" ||
    fullText.includes("handbag") ||
    fullText.includes("tote") ||
    fullText.includes("backpack") ||
    fullText.includes("wallet") ||
    fullText.includes("shoulder bag") ||
    fullText.includes("crossbody") ||
    fullText.includes("clutch") ||
    fullText.includes("hobo") ||
    fullText.includes("satchel") ||
    fullText.includes("bifold") ||
    fullText.includes("bi-fold") ||
    fullText.includes("card case") ||
    fullText.includes("card holder") ||
    fullText.includes("coin purse");

  if (!isBag) return null;

  // --- HERMÈS ---
  if (brandLower.includes("hermès") || brandLower.includes("hermes")) {
    if (leaf === "wallets" || fullText.includes("wallet") || fullText.includes("purse") || fullText.includes("card") || fullText.includes("bastia") || fullText.includes("calvi") || fullText.includes("dogon")) {
      if (fullText.includes("bearn") || fullText.includes("béarn")) {
        return makeImg("bags-hermes-bearn-compact.webp", "Hermès Béarn Compact Epsom leather wallet", "Hermès");
      }
      return makeImg("bags-hermes-kelly-pocket.webp", "Hermès Kelly Pocket Slim Togo leather wallet", "Hermès");
    }
    if (fullText.includes("birkin")) {
      return makeImg("bags-hermes-birkin.webp", "Hermès Birkin Togo leather iconic handbag", "Hermès");
    }
    if (fullText.includes("kelly")) {
      return makeImg("bags-hermes-kelly.webp", "Hermès Kelly 28 Sellier Box Calf leather bag", "Hermès");
    }
    if (fullText.includes("constance")) {
      return makeImg("bags-hermes-constance.webp", "Hermès Constance 18 Epsom leather shoulder bag", "Hermès");
    }
    return makeImg("bags-hermes-birkin.webp", `${product.name} handcrafted leather bag`, "Hermès");
  }

  // --- CHANEL ---
  if (brandLower.includes("chanel")) {
    if (leaf === "wallets" || (fullText.includes("wallet") && !fullText.includes("backpack"))) {
      if (fullText.includes("coin") || fullText.includes("zipped")) {
        return makeImg("bags-chanel-zipped-coin-purse.webp", "Chanel Classic Zipped Coin Purse Wallet", "Chanel");
      }
      return makeImg("bags-chanel-classic-flap-wallet.webp", "Chanel Classic Small Flap Caviar Wallet", "Chanel");
    }
    if (leaf === "backpacks" || fullText.includes("backpack")) {
      return makeImg("bags-chanel-duma-backpack.webp", "Chanel Duma Vintage Quilted Lambskin Backpack", "Chanel");
    }
    if (fullText.includes("2.55") || fullText.includes("reissue")) {
      return makeImg("bags-chanel-255-reissue.webp", "Chanel 2.55 Reissue aged calfskin flap bag", "Chanel");
    }
    if (fullText.includes("boy")) {
      return makeImg("bags-chanel-boy.webp", "Chanel Boy Bag quilted calfskin flap bag", "Chanel");
    }
    if (fullText.includes("19")) {
      return makeImg("bags-chanel-19.webp", "Chanel 19 Large Flap goatskin bag", "Chanel");
    }
    if (fullText.includes("22")) {
      return makeImg("bags-chanel-22.webp", "Chanel 22 shiny calfskin luxury handbag", "Chanel");
    }
    if (fullText.includes("classic") || fullText.includes("flap") || fullText.includes("11.12")) {
      return makeImg("bags-chanel-classic-flap.webp", "Chanel Classic Double Flap quilted lambskin bag", "Chanel");
    }
    return makeImg("bags-chanel-classic-flap.webp", `${product.name} quilted luxury bag`, "Chanel");
  }

  // --- DIOR ---
  if (brandLower.includes("dior")) {
    if (leaf === "wallets" || (fullText.includes("wallet") && !fullText.includes("backpack"))) {
      return makeImg("bags-dior-lotus-wallet.webp", "Dior Lady Dior Lotus Wallet in Cannage Lambskin", "Dior");
    }
    if (leaf === "backpacks" || fullText.includes("backpack")) {
      return makeImg("bags-dior-rider-backpack.webp", "Dior Rider Backpack in Dior Oblique Jacquard", "Dior");
    }
    if (fullText.includes("saddle")) {
      return makeImg("bags-dior-saddle.webp", "Dior Saddle Bag grained calfskin handbag", "Dior");
    }
    if (fullText.includes("book tote")) {
      return makeImg("bags-dior-book-tote.webp", "Dior Book Tote embroidered canvas bag", "Dior");
    }
    if (fullText.includes("30 montaigne") || fullText.includes("montaigne")) {
      return makeImg("bags-dior-30-montaigne.webp", "Dior 30 Montaigne box calfskin flap bag", "Dior");
    }
    if (fullText.includes("lady dior") || fullText.includes("lady d-joy") || fullText.includes("cannage") || fullText.includes("caro")) {
      return makeImg("bags-dior-lady-dior.webp", "Dior Lady Dior Cannage lambskin handbag", "Dior");
    }
    return makeImg("bags-dior-lady-dior.webp", `${product.name} luxury cannage leather handbag`, "Dior");
  }

  // --- LOUIS VUITTON ---
  if (brandLower.includes("louis vuitton") || brandLower.includes("vuitton") || fullText.includes("louis vuitton")) {
    if (leaf === "wallets" || (fullText.includes("wallet") && !fullText.includes("backpack"))) {
      if (fullText.includes("zippy")) {
        return makeImg("bags-lv-zippy-wallet.webp", "Louis Vuitton Zippy Wallet Monogram leather", "Louis Vuitton");
      }
      if (fullText.includes("brazza") || fullText.includes("sarah")) {
        return makeImg("bags-lv-brazza-wallet.webp", "Louis Vuitton Brazza Taïga leather continental wallet", "Louis Vuitton");
      }
      return makeImg("bags-lv-multiple-wallet.webp", "Louis Vuitton Multiple Wallet Damier Ebene", "Louis Vuitton");
    }
    if (leaf === "backpacks" || fullText.includes("backpack") || fullText.includes("slingbag")) {
      if (fullText.includes("christopher")) {
        return makeImg("bags-lv-christopher.webp", "Louis Vuitton Christopher PM Epi leather backpack", "Louis Vuitton");
      }
      return makeImg("bags-lv-michael.webp", "Louis Vuitton Discovery Damier graphite backpack", "Louis Vuitton");
    }
    if (fullText.includes("speedy")) {
      return makeImg("bags-lv-speedy-30.webp", "Louis Vuitton Speedy 30 Bandoulière Damier Ebene bag", "Louis Vuitton");
    }
    if (fullText.includes("alma")) {
      return makeImg("bags-lv-alma-bb.webp", "Louis Vuitton Alma BB Epi leather handbag", "Louis Vuitton");
    }
    if (fullText.includes("capucines")) {
      return makeImg("bags-lv-capucines.webp", "Louis Vuitton Capucines MM Taurillon leather handbag", "Louis Vuitton");
    }
    if (fullText.includes("neverfull")) {
      return makeImg("bags-lv-neverfull.webp", "Louis Vuitton Neverfull MM Monogram canvas tote", "Louis Vuitton");
    }
    return makeImg("bags-lv-neverfull.webp", `${product.name} Monogram canvas luxury bag`, "Louis Vuitton");
  }

  // --- GOYARD ---
  if (brandLower.includes("goyard")) {
    if (leaf === "wallets" || (fullText.includes("wallet") && !fullText.includes("backpack"))) {
      if (fullText.includes("victoire")) {
        return makeImg("bags-goyard-victoire.webp", "Goyard Victoire Bifold Wallet in Goyardine Canvas", "Goyard");
      }
      return makeImg("bags-goyard-saint-pierre.webp", "Goyard Saint-Pierre Card Wallet in Goyardine Canvas", "Goyard");
    }
    if (leaf === "backpacks" || fullText.includes("backpack")) {
      return makeImg("bags-goyard-alpin-backpack.webp", "Goyard Alpin MM Goyardine canvas backpack", "Goyard");
    }
    if (fullText.includes("anjou")) {
      return makeImg("bags-goyard-anjou.webp", "Goyard Anjou PM reversible Goyardine leather tote", "Goyard");
    }
    if (fullText.includes("saigon") || fullText.includes("saïgon")) {
      return makeImg("bags-goyard-saigon.webp", "Goyard Saïgon Structuré Mini wood handle handbag", "Goyard");
    }
    if (fullText.includes("saint louis") || fullText.includes("st louis")) {
      return makeImg("bags-goyard-saint-louis.webp", "Goyard Saint Louis PM Goyardine canvas tote", "Goyard");
    }
    return makeImg("bags-goyard-saint-louis.webp", `${product.name} Goyardine chevron tote bag`, "Goyard");
  }

  // --- BOTTEGA VENETA ---
  if (brandLower.includes("bottega veneta") || brandLower.includes("bottega")) {
    if (leaf === "wallets" || (fullText.includes("wallet") && !fullText.includes("backpack"))) {
      if (fullText.includes("cassette")) {
        return makeImg("bags-bv-cassette-wallet.webp", "Bottega Veneta Cassette Bi-Fold Wallet Intreccio", "Bottega Veneta");
      }
      return makeImg("bags-bv-bifold-wallet.webp", "Bottega Veneta Intrecciato Slim Bi-Fold Wallet", "Bottega Veneta");
    }
    if (leaf === "backpacks" || fullText.includes("backpack") || fullText.includes("daypack")) {
      return makeImg("bags-bv-backpack.webp", "Bottega Veneta Intrecciato Leather Classic Backpack", "Bottega Veneta");
    }
    if (fullText.includes("jodie")) {
      return makeImg("bags-bv-jodie.webp", "Bottega Veneta Jodie Small Intrecciato Nappa hobo bag", "Bottega Veneta");
    }
    if (fullText.includes("andiamo")) {
      return makeImg("bags-bv-andiamo.webp", "Bottega Veneta Andiamo Medium Intrecciato leather handbag", "Bottega Veneta");
    }
    if (fullText.includes("cassette")) {
      return makeImg("bags-bv-cassette.webp", "Bottega Veneta Cassette Padded Intreccio crossbody bag", "Bottega Veneta");
    }
    return makeImg("bags-bv-cassette.webp", `${product.name} Intrecciato woven leather bag`, "Bottega Veneta");
  }

  // --- CELINE ---
  if (brandLower.includes("celine") || brandLower.includes("céline")) {
    if (fullText.includes("luggage")) {
      return makeImg("bags-celine-luggage.webp", "Celine Luggage Nano drummed calfskin bag", "Celine");
    }
    if (fullText.includes("16 ") || fullText.includes("16 small") || fullText.includes("belt bag")) {
      return makeImg("bags-celine-16.webp", "Celine 16 Small Satinated Calfskin Bag", "Celine");
    }
    if (fullText.includes("triomphe") || fullText.includes("claude") || fullText.includes("ava")) {
      return makeImg("bags-celine-triomphe.webp", "Celine Triomphe Classique Bag in Shiny Calfskin", "Celine");
    }
    return makeImg("bags-celine-triomphe.webp", `${product.name} luxury calfskin handbag`, "Celine");
  }

  // --- FENDI ---
  if (brandLower.includes("fendi")) {
    if (leaf === "wallets" || (fullText.includes("wallet") && !fullText.includes("backpack"))) {
      return makeImg("bags-fendi-baguette-wallet.webp", "Fendi Baguette Micro Trifold Wallet", "Fendi");
    }
    if (fullText.includes("peekaboo")) {
      return makeImg("bags-fendi-peekaboo.webp", "Fendi Peekaboo ISeeU Medium Leather Bag", "Fendi");
    }
    if (fullText.includes("baguette")) {
      return makeImg("bags-fendi-baguette.webp", "Fendi Baguette Medium Leather Shoulder Bag", "Fendi");
    }
    return makeImg("bags-fendi-baguette.webp", `${product.name} FF clasp leather shoulder bag`, "Fendi");
  }

  // --- GUCCI ---
  if (brandLower.includes("gucci")) {
    if (leaf === "wallets" || (fullText.includes("wallet") && !fullText.includes("backpack"))) {
      return makeImg("bags-gucci-marmont-wallet.webp", "Gucci GG Marmont Bifold Wallet Chevron Leather", "Gucci");
    }
    if (fullText.includes("jackie")) {
      return makeImg("bags-gucci-jackie.webp", "Gucci Jackie 1961 Small Leather Shoulder Bag", "Gucci");
    }
    if (fullText.includes("horsebit")) {
      return makeImg("bags-gucci-horsebit.webp", "Gucci Horsebit 1955 Small Shoulder Bag", "Gucci");
    }
    if (fullText.includes("dionysus")) {
      return makeImg("bags-gucci-dionysus.webp", "Gucci Dionysus Small GG Supreme Shoulder Bag", "Gucci");
    }
    if (fullText.includes("marmont")) {
      return makeImg("bags-gucci-marmont.webp", "Gucci GG Marmont Small Matelassé Shoulder Bag", "Gucci");
    }
    return makeImg("bags-gucci-jackie.webp", `${product.name} Italian luxury designer bag`, "Gucci");
  }

  // --- PRADA ---
  if (brandLower.includes("prada")) {
    if (leaf === "wallets" || (fullText.includes("wallet") && !fullText.includes("backpack"))) {
      return makeImg("bags-prada-saffiano-bifold-wallet.webp", "Prada Saffiano Metal Lettering Small Flap Wallet", "Prada");
    }
    if (leaf === "backpacks" || fullText.includes("backpack")) {
      return makeImg("bags-prada-re-nylon-backpack.webp", "Prada Re-Nylon Medium Backpack with Saffiano Details", "Prada");
    }
    if (fullText.includes("galleria")) {
      return makeImg("bags-prada-galleria.webp", "Prada Galleria Medium Saffiano Leather Bag", "Prada");
    }
    if (fullText.includes("re-edition") || fullText.includes("re edition") || fullText.includes("nylon")) {
      return makeImg("bags-prada-re-edition-2005.webp", "Prada Re-Edition 2005 Saffiano Leather Bag", "Prada");
    }
    if (fullText.includes("cleo")) {
      return makeImg("bags-prada-cleo.webp", "Prada Cleo Brushed Leather Shoulder Bag with Flap", "Prada");
    }
    return makeImg("bags-prada-galleria.webp", `${product.name} Saffiano leather structured tote`, "Prada");
  }

  // --- SAINT LAURENT (YSL) ---
  if (brandLower.includes("saint laurent") || brandLower.includes("ysl") || brandLower.includes("laurent")) {
    if (leaf === "wallets" || (fullText.includes("wallet") && !fullText.includes("backpack"))) {
      return makeImg("bags-ysl-cassandre-wallet.webp", "Saint Laurent Cassandre Matelassé Large Flap Wallet", "Saint Laurent");
    }
    if (leaf === "backpacks" || fullText.includes("backpack")) {
      return makeImg("bags-ysl-city-backpack.webp", "Saint Laurent City Backpack in Matte Leather", "Saint Laurent");
    }
    if (fullText.includes("loulou")) {
      return makeImg("bags-ysl-loulou.webp", "Saint Laurent Loulou Puffer Medium Bag in Quilted Lambskin", "Saint Laurent");
    }
    if (fullText.includes("sac de jour")) {
      return makeImg("bags-ysl-sac-de-jour.webp", "Saint Laurent Sac de Jour Small Supple Grained Leather Bag", "Saint Laurent");
    }
    if (fullText.includes("kate")) {
      return makeImg("bags-ysl-kate.webp", "Saint Laurent Kate Small Reversible Chain Shoulder Bag", "Saint Laurent");
    }
    if (fullText.includes("5 à 7") || fullText.includes("5 a 7")) {
      return makeImg("bags-ysl-le-5-a-7.webp", "Saint Laurent Le 5 à 7 Smooth Leather Shoulder Bag", "Saint Laurent");
    }
    return makeImg("bags-ysl-loulou.webp", `${product.name} luxury monogram leather bag`, "Saint Laurent");
  }

  // --- VALENTINO ---
  if (brandLower.includes("valentino")) {
    if (fullText.includes("locò") || fullText.includes("loco")) {
      return makeImg("bags-valentino-loco.webp", "Valentino Garavani Locò Small Leather Shoulder Bag", "Valentino");
    }
    return makeImg("bags-valentino-rockstud.webp", "Valentino Garavani Rockstud Grainy Calfskin Bag", "Valentino");
  }

  // --- RIMOWA ---
  if (brandLower.includes("rimowa")) {
    return makeImg("bags-rimowa-never-still-backpack.webp", "Rimowa Never Still Flap Backpack Canvas & Leather", "Rimowa");
  }

  // --- TUMI ---
  if (brandLower.includes("tumi")) {
    return makeImg("bags-tumi-alpha-bravo-navigation.webp", "Tumi Alpha Bravo Navigation Backpack", "Tumi");
  }

  // --- MONTBLANC ---
  if (brandLower.includes("montblanc")) {
    if (leaf === "wallets" || fullText.includes("wallet") || fullText.includes("bifold")) {
      return makeImg("bags-montblanc-meisterstuck-wallet.webp", "Montblanc Meisterstück 6cc Bi-Fold Wallet", "Montblanc");
    }
    return makeImg("bags-montblanc-meisterstuck-backpack.webp", "Montblanc Meisterstück Selection Soft Leather Backpack", "Montblanc");
  }

  // --- LOEWE ---
  if (brandLower.includes("loewe")) {
    return makeImg("bags-loewe-puzzle.webp", "Loewe Puzzle Small Bag in Classic Calfskin", "Loewe");
  }

  // --- BALENCIAGA ---
  if (brandLower.includes("balenciaga")) {
    if (leaf === "backpacks" || fullText.includes("backpack")) {
      return makeImg("bags-balenciaga-explorer-backpack.webp", "Balenciaga Explorer Nylon Backpack in Recycled Polyamide", "Balenciaga");
    }
    if (fullText.includes("bel air") || fullText.includes("bel-air") || fullText.includes("carry all")) {
      return makeImg("bags-balenciaga-bel-air.webp", "Balenciaga Bel Air Carry All Medium Leather Handbag", "Balenciaga");
    }
    if (fullText.includes("crush")) {
      return makeImg("bags-balenciaga-crush.webp", "Balenciaga Crush Medium Quilted Leather Bag", "Balenciaga");
    }
    if (fullText.includes("downtown")) {
      return makeImg("bags-balenciaga-downtown.webp", "Balenciaga Downtown Small Leather Shoulder Bag", "Balenciaga");
    }
    if (fullText.includes("cagole")) {
      return makeImg("bags-balenciaga-le-cagole.webp", "Balenciaga Le Cagole Small Arena Leather Shoulder Bag", "Balenciaga");
    }
    if (fullText.includes("rodeo")) {
      return makeImg("bags-balenciaga-rodeo.webp", "Balenciaga Rodeo Medium Smooth Calfskin Handbag", "Balenciaga");
    }
    if (fullText.includes("monaco")) {
      return makeImg("bags-balenciaga-monaco.webp", "Balenciaga Monaco Medium Quilted Leather Chain Bag", "Balenciaga");
    }
    if (fullText.includes("neo classic")) {
      return makeImg("bags-balenciaga-neo-classic.webp", "Balenciaga Neo Classic Mini Grained Leather Handbag", "Balenciaga");
    }
    if (fullText.includes("xs") && fullText.includes("hourglass")) {
      return makeImg("bags-balenciaga-hourglass-xs.webp", "Balenciaga Hourglass XS Croc-Embossed Handbag", "Balenciaga");
    }
    return makeImg("bags-balenciaga-hourglass.webp", "Balenciaga Hourglass Small Calfskin Handbag", "Balenciaga");
  }

  // --- FERRAGAMO ---
  if (brandLower.includes("ferragamo")) {
    if (leaf === "wallets" || fullText.includes("wallet")) {
      return makeImg("bags-ferragamo-wallet.webp", "Ferragamo Gancini Embossed Bi-Fold Wallet", "Ferragamo");
    }
    if (fullText.includes("studio")) {
      return makeImg("bags-ferragamo-studio.webp", "Ferragamo Studio Box Structured Leather Bag", "Ferragamo");
    }
    if (fullText.includes("wanda")) {
      return makeImg("bags-ferragamo-wanda.webp", "Ferragamo Wanda Mini Brushed Leather Bag", "Ferragamo");
    }
    if (fullText.includes("trifolio") || fullText.includes("flap")) {
      return makeImg("bags-ferragamo-trifolio.webp", "Ferragamo Trifolio Leather Flap Shoulder Bag", "Ferragamo");
    }
    if (fullText.includes("tote") || fullText.includes("cut-out") || fullText.includes("cutout")) {
      return makeImg("bags-ferragamo-tote.webp", "Ferragamo Gancini Cutout Leather Tote", "Ferragamo");
    }
    return makeImg("bags-ferragamo-hug.webp", "Ferragamo Hug Small Leather Top Handle Bag", "Ferragamo");
  }

  // --- BURBERRY / TOM FORD WALLETS ---
  if (brandLower.includes("burberry")) {
    return makeImg("bags-burberry-wallet.webp", "Burberry Vintage Check Bi-Fold Wallet", "Burberry");
  }
  if (brandLower.includes("tom ford")) {
    return makeImg("bags-tom-ford-wallet.webp", "Tom Ford T-Line Grained Leather Bi-Fold Wallet", "Tom Ford");
  }

  // --- GENERIC CATEGORY FALLBACKS ---
  if (leaf === "backpacks" || fullText.includes("backpack")) {
    return makeImg("bags-lv-christopher.webp", `${product.name} luxury designer backpack`, product.brand);
  }

  if (leaf === "wallets" || fullText.includes("wallet") || fullText.includes("card case")) {
    return makeImg("bags-lv-multiple-wallet.webp", `${product.name} artisanal full-grain leather wallet`, product.brand);
  }

  if (leaf === "handbags" || leaf === "bags" || fullText.includes("bag") || fullText.includes("tote")) {
    return makeImg("bags-hermes-birkin.webp", `${product.name} luxury artisanal leather handbag`, product.brand);
  }

  return null;
}
