import { ProductQuery, ProductImageResolution, makeImg } from "./types";

export function resolveFootwearImage(product: ProductQuery): ProductImageResolution | null {
  const nameLower = (product.name || "").toLowerCase();
  const brandLower = (product.brand || "").toLowerCase();
  const modelLower = (
    product.modelName ||
    (product.attributes?.modelName as string) ||
    ""
  ).toLowerCase();
  const fullText = `${nameLower} ${brandLower} ${modelLower}`;
  const leaf = (product.leafType || product.category || "").toLowerCase();

  const footwearLeaves = [
    "loafers",
    "formal-shoes",
    "boots",
    "lifestyle-sneakers",
    "running-shoes"
  ];

  const isFootwearLeaf = footwearLeaves.includes(leaf);
  const isFootwearCategory =
    leaf === "footwear" ||
    (product.category || "").toLowerCase() === "footwear";

  const isFootwearText =
    fullText.includes("shoe") ||
    fullText.includes("loafer") ||
    fullText.includes("moccasin") ||
    fullText.includes("sneaker") ||
    fullText.includes("boot") ||
    fullText.includes("oxford") ||
    fullText.includes("derby") ||
    fullText.includes("brogue") ||
    fullText.includes("runner");

  if (!isFootwearLeaf && !isFootwearCategory && !isFootwearText) {
    return null;
  }

  // =========================================================================
  // 1. RUNNING SHOES
  // =========================================================================
  if (
    leaf === "running-shoes" ||
    fullText.includes("running shoe") ||
    fullText.includes("runner") ||
    fullText.includes("alphafly") ||
    fullText.includes("vaporfly") ||
    fullText.includes("cloudmonster") ||
    fullText.includes("kayano") ||
    fullText.includes("nimbus") ||
    fullText.includes("adizero")
  ) {
    // Nike Running
    if (brandLower.includes("nike") || fullText.includes("nike")) {
      if (fullText.includes("alphafly")) return makeImg("shoes-nike-alphafly-3.webp", "Nike Air Zoom Alphafly NEXT% 3 marathon road racing shoe", "Nike");
      if (fullText.includes("infinityrn") || fullText.includes("reactx")) return makeImg("shoes-nike-infinityrn-4.webp", "Nike InfinityRN 4 ReactX cushion running shoe", "Nike");
      if (fullText.includes("streakfly")) return makeImg("shoes-nike-streakfly.webp", "Nike Streakfly 5k 10k road racing shoe", "Nike");
      if (fullText.includes("vomero")) return makeImg("shoes-nike-vomero-17.webp", "Nike Vomero 17 dual ZoomX plush running shoe", "Nike");
      if (fullText.includes("wildhorse")) return makeImg("shoes-nike-wildhorse-8.webp", "Nike Wildhorse 8 rugged trail running shoe", "Nike");
      if (fullText.includes("zegama")) return makeImg("shoes-nike-zegama-2.webp", "Nike Zegama 2 ZoomX Vibram trail shoe", "Nike");
      return makeImg("shoes-nike-vaporfly-3.webp", "Nike ZoomX Vaporfly 3 lightweight road racing shoe", "Nike");
    }

    // Adidas Running
    if (brandLower.includes("adidas") || fullText.includes("adidas")) {
      if (fullText.includes("4dfwd")) return makeImg("shoes-adidas-4dfwd-3.webp", "Adidas 4DFWD 3 running shoe 3D printed lattice", "Adidas");
      if (fullText.includes("boston")) return makeImg("shoes-adidas-adizero-boston-12.webp", "Adidas Adizero Boston 12 running shoes", "Adidas");
      if (fullText.includes("prime x") || fullText.includes("strung")) return makeImg("shoes-adidas-adizero-prime-x-2.webp", "Adidas Adizero Prime X 2 Strung 50mm stack shoe", "Adidas");
      if (fullText.includes("adizero sl") || fullText.includes("sl 2")) return makeImg("shoes-adidas-adizero-sl-2.webp", "Adidas Adizero SL 2 running shoes", "Adidas");
      if (fullText.includes("supernova")) return makeImg("shoes-adidas-supernova-rise.webp", "Adidas Supernova Rise running shoe Dreamstrike+", "Adidas");
      if (fullText.includes("takumi sen")) return makeImg("shoes-adidas-adizero-takumi-sen-10.webp", "Adidas Adizero Takumi Sen 10 racing shoe", "Adidas");
      if (fullText.includes("terrex") || fullText.includes("agravic")) return makeImg("shoes-adidas-terrex-agravic-speed-ultra.webp", "Adidas Terrex Agravic Speed Ultra trail shoe", "Adidas");
      if (fullText.includes("ultraboost")) return makeImg("shoes-adidas-ultraboost-light.webp", "Adidas Ultraboost Light running shoes", "Adidas");
      if (fullText.includes("adistar")) return makeImg("shoes-adidas-adistar-3.webp", "Adidas Adistar 3 max cushion running shoe", "Adidas");
      return makeImg("shoes-adidas-adios-pro-3.webp", "Adidas Adizero Adios Pro 3 EnergyRods carbon racing shoe", "Adidas");
    }

    // ASICS
    if (brandLower.includes("asics") || fullText.includes("asics")) {
      if (fullText.includes("cumulus")) return makeImg("shoes-asics-gel-cumulus-26.webp", "ASICS Gel-Cumulus 26 running shoes", "ASICS");
      if (fullText.includes("superblast")) return makeImg("shoes-asics-superblast-2.webp", "ASICS Superblast 2 Paris running shoe", "ASICS");
      if (fullText.includes("gt-2000") || fullText.includes("gt 2000")) return makeImg("shoes-asics-gt-2000-13.webp", "ASICS GT-2000 13 stability running shoes", "ASICS");
      if (fullText.includes("magic speed")) return makeImg("shoes-asics-magic-speed-4.webp", "ASICS Magic Speed 4 carbon plate racing shoes", "ASICS");
      if (fullText.includes("noosa tri") || fullText.includes("noosa")) return makeImg("shoes-asics-noosa-tri-16.webp", "ASICS Noosa Tri 16 colorful triathlon shoes", "ASICS");
      if (fullText.includes("nimbus")) return makeImg("shoes-asics-gel-nimbus-26.webp", "ASICS GEL-Nimbus 26 PureGEL cushioned road running shoe", "ASICS");
      return makeImg("shoes-asics-gel-kayano-31.webp", "ASICS GEL-Kayano 31 4D GUIDANCE stability road running shoe", "ASICS");
    }

    // HOKA
    if (brandLower.includes("hoka") || fullText.includes("hoka")) {
      if (fullText.includes("arahi")) return makeImg("shoes-hoka-arahi-7.webp", "HOKA Arahi 7 stability road running shoe", "HOKA");
      if (fullText.includes("bondi")) return makeImg("shoes-hoka-bondi-8.webp", "HOKA Bondi 8 max cushion running shoe", "HOKA");
      if (fullText.includes("challenger")) return makeImg("shoes-hoka-challenger-7.webp", "HOKA Challenger 7 all-terrain trail shoe", "HOKA");
      if (fullText.includes("cielo")) return makeImg("shoes-hoka-cielo-x1.webp", "HOKA Cielo X1 carbon plate marathon shoe", "HOKA");
      if (fullText.includes("mach")) return makeImg("shoes-hoka-mach-6.webp", "HOKA Mach 6 lightweight responsive road shoe", "HOKA");
      if (fullText.includes("rocket")) return makeImg("shoes-hoka-rocket-x-2.webp", "HOKA Rocket X 2 carbon plate racing shoe", "HOKA");
      if (fullText.includes("speedgoat")) return makeImg("shoes-hoka-speedgoat-6.webp", "HOKA Speedgoat 6 technical trail running shoe", "HOKA");
      if (fullText.includes("tecton")) return makeImg("shoes-hoka-tecton-x-2.webp", "HOKA Tecton X 2 parallel carbon plates trail shoe", "HOKA");
      if (fullText.includes("transport")) return makeImg("shoes-hoka-transport.webp", "HOKA Transport commuter walking sneaker", "HOKA");
      return makeImg("shoes-hoka-clifton.webp", "HOKA Clifton 9 lightweight maximum cushioned road running shoe", "HOKA");
    }

    // New Balance
    if (brandLower.includes("new balance") || fullText.includes("new balance")) {
      if (fullText.includes("860")) return makeImg("shoes-new-balance-860v14.webp", "New Balance Fresh Foam X 860v14 stability shoe", "New Balance");
      if (fullText.includes("880")) return makeImg("shoes-new-balance-880v14.webp", "New Balance Fresh Foam X 880v14 daily trainer", "New Balance");
      if (fullText.includes("hierro")) return makeImg("shoes-new-balance-hierro-v8.webp", "New Balance Fresh Foam X Hierro v8 Vibram trail shoe", "New Balance");
      if (fullText.includes("more")) return makeImg("shoes-new-balance-more-v5.webp", "New Balance Fresh Foam X More v5 max cushion shoe", "New Balance");
      if (fullText.includes("rebel")) return makeImg("shoes-new-balance-fuelcell-rebel-v4.webp", "New Balance FuelCell Rebel v4 lightweight shoe", "New Balance");
      if (fullText.includes("sc elite")) return makeImg("shoes-new-balance-sc-elite-v4.webp", "New Balance FuelCell SuperComp Elite v4 marathon", "New Balance");
      if (fullText.includes("sc trainer")) return makeImg("shoes-new-balance-sc-trainer-v3.webp", "New Balance FuelCell SuperComp Trainer v3", "New Balance");
      if (fullText.includes("1906r") || fullText.includes("1906")) return makeImg("shoes-new-balance-1906r.webp", "New Balance 1906R retro running lifestyle sneaker", "New Balance");
      if (fullText.includes("9060")) return makeImg("shoes-new-balance-9060.webp", "New Balance 9060 chunky futuristic sneaker", "New Balance");
      return makeImg("shoes-new-balance-1080.webp", "New Balance Fresh Foam X 1080v13 premium cushion road running shoe", "New Balance");
    }

    // Puma
    if (brandLower.includes("puma") || fullText.includes("puma")) {
      if (fullText.includes("electrify")) return makeImg("shoes-puma-electrify-nitro-3.webp", "Puma Electrify Nitro 3 running shoe", "Puma");
      if (fullText.includes("fast-fwd")) return makeImg("shoes-puma-fast-fwd-nitro-elite.webp", "Puma Fast-FWD Nitro Elite racing shoe", "Puma");
      if (fullText.includes("fast-r")) return makeImg("shoes-puma-fast-r-nitro-elite-2.webp", "Puma Fast-R Nitro Elite 2 marathon carbon shoe", "Puma");
      if (fullText.includes("foreverrun")) return makeImg("shoes-puma-foreverrun-nitro.webp", "Puma ForeverRun Nitro stability running shoe", "Puma");
      return makeImg("shoes-puma-deviate-nitro.webp", "Puma Deviate Nitro 3 carbon-infused marathon performance shoe", "Puma");
    }

    // On Running
    if (brandLower.includes("on running") || brandLower.includes("on") || fullText.includes("cloudmonster") || fullText.includes("cloudstratus")) {
      if (fullText.includes("cloudflow")) return makeImg("shoes-on-cloudflow-4.webp", "On Running Cloudflow 4 responsive road shoe", "On Running");
      if (fullText.includes("cloudrunner")) return makeImg("shoes-on-cloudrunner-2.webp", "On Running Cloudrunner 2 support running shoe", "On Running");
      if (fullText.includes("cloudstratus")) return makeImg("shoes-on-cloudstratus.webp", "On Running Cloudstratus double CloudTec endurance road running shoe", "On Running");
      if (fullText.includes("cloudultra")) return makeImg("shoes-on-cloudultra-2.webp", "On Running Cloudultra 2 ultra-trail running shoe", "On Running");
      if (fullText.includes("cloudvista")) return makeImg("shoes-on-cloudvista.webp", "On Running Cloudvista lightweight trail shoe", "On Running");
      return makeImg("shoes-on-cloudmonster.webp", "On Running Cloudmonster maximum cushion road running shoe", "On Running");
    }

    // Saucony
    if (brandLower.includes("saucony") || fullText.includes("saucony")) {
      return makeImg("shoes-saucony-endorphin.webp", "Saucony Endorphin Pro 4 SPEEDROLL carbon plate racing shoe", "Saucony");
    }

    // Balenciaga Running
    if (brandLower.includes("balenciaga") || fullText.includes("balenciaga")) {
      return makeImg("shoes-balenciaga-runner.webp", "Balenciaga Runner vintage mesh and nylon performance sneaker", "Balenciaga");
    }

    // Dior Running
    if (brandLower.includes("dior") || fullText.includes("dior")) {
      return makeImg("shoes-dior-chrono.webp", "Dior Chrono technical mesh running shoe", "Dior");
    }

    return makeImg("shoes-signature-running.webp", `${product.name} elite marathon running shoe`, product.brand);
  }

  // =========================================================================
  // 2. LIFESTYLE SNEAKERS
  // =========================================================================
  if (
    leaf === "lifestyle-sneakers" ||
    fullText.includes("sneaker") ||
    fullText.includes("trainer") ||
    fullText.includes("triple s") ||
    fullText.includes("track")
  ) {
    // Louis Vuitton
    if (brandLower.includes("louis vuitton") || fullText.includes("lv trainer") || fullText.includes("louis vuitton")) {
      return makeImg("shoes-lv-trainer.webp", "Louis Vuitton LV Trainer calf leather sneaker by Virgil Abloh", "Louis Vuitton");
    }

    // Alexander McQueen
    if (brandLower.includes("alexander mcqueen") || fullText.includes("mcqueen")) {
      return makeImg("shoes-alexander-mcqueen-oversized.webp", "Alexander McQueen Oversized sneaker in white calfskin", "Alexander McQueen");
    }

    // Balenciaga
    if (brandLower.includes("balenciaga") || fullText.includes("balenciaga")) {
      if (fullText.includes("track")) return makeImg("shoes-balenciaga-track.webp", "Balenciaga Track layered technical cage sneaker", "Balenciaga");
      if (fullText.includes("3xl") || fullText.includes("cargo") || fullText.includes("defender")) return makeImg("shoes-balenciaga-3xl.webp", "Balenciaga 3XL technical runner sneaker", "Balenciaga");
      return makeImg("shoes-balenciaga-triple-s.webp", "Balenciaga Triple S oversized clear sole chunky designer sneaker", "Balenciaga");
    }

    // Dior
    if (brandLower.includes("dior") || fullText.includes("dior")) {
      if (fullText.includes("b30")) return makeImg("shoes-dior-b30.webp", "Dior B30 technical fabric sneaker with CD Diamond emblem", "Dior");
      return makeImg("shoes-dior-b22.webp", "Dior B22 chunky athletic sneaker with reflective piping", "Dior");
    }

    // Golden Goose
    if (brandLower.includes("golden goose") || fullText.includes("golden goose")) {
      return makeImg("shoes-golden-goose-superstar.webp", "Golden Goose Super-Star distressed Italian leather sneaker", "Golden Goose");
    }

    // Loro Piana
    if (brandLower.includes("loro piana") || fullText.includes("flexy walk")) {
      return makeImg("shoes-loro-piana-360-flexy.webp", "Loro Piana 360 Flexy Walk knitted Wish wool sneaker", "Loro Piana");
    }

    // Prada
    if (brandLower.includes("prada") || fullText.includes("prada")) {
      return makeImg("shoes-prada-americas-cup.webp", "Prada America's Cup patent leather and technical fabric sneaker", "Prada");
    }

    // Chanel
    if (brandLower.includes("chanel") || fullText.includes("chanel")) {
      return makeImg("shoes-chanel-sneaker.webp", "Chanel CC embroidered low-top calfskin and suede runner sneaker", "Chanel");
    }

    // Brunello Cucinelli
    if (brandLower.includes("brunello cucinelli") || fullText.includes("cucinelli")) {
      return makeImg("shoes-brunello-cucinelli-sneaker.webp", "Brunello Cucinelli luxury calfskin runner sneaker", "Brunello Cucinelli");
    }

    // Tom Ford
    if (brandLower.includes("tom ford") || fullText.includes("tom ford")) {
      return makeImg("shoes-tom-ford-cambridge.webp", "Tom Ford Cambridge clean low-top sneaker in burnished calfskin", "Tom Ford");
    }

    // Tod's
    if (brandLower.includes("tod's") || brandLower.includes("tods") || fullText.includes("tod's") || fullText.includes("tods")) {
      return makeImg("shoes-tods-sneaker.webp", "Tod's luxury Italian leather sneaker", "Tod's");
    }

    // Saint Laurent
    if (brandLower.includes("saint laurent") || fullText.includes("saint laurent") || fullText.includes("sl/")) {
      return makeImg("shoes-saint-laurent-court-classic.webp", "Saint Laurent Court Classic luxury leather sneaker", "Saint Laurent");
    }

    // Berluti Sneakers
    if (brandLower.includes("berluti") || fullText.includes("berluti")) {
      return makeImg("shoes-berluti-stellar.webp", "Berluti Stellar Scritto luxury leather sneaker", "Berluti");
    }

    return makeImg("shoes-alexander-mcqueen-oversized.webp", `${product.name} luxury Italian leather sneaker`, product.brand);
  }

  // =========================================================================
  // 3. BOOTS
  // =========================================================================
  if (
    leaf === "boots" ||
    fullText.includes("boot") ||
    fullText.includes("chelsea")
  ) {
    // Bottega Veneta
    if (brandLower.includes("bottega veneta") || fullText.includes("bottega")) {
      if (fullText.includes("lug")) return makeImg("shoes-bottega-veneta-lug-boot.webp", "Bottega Veneta Lug Chelsea boot in vegetable-tanned calfskin", "Bottega Veneta");
      return makeImg("shoes-bottega-veneta-tire-boot.webp", "Bottega Veneta Tire wavy lug sole leather combat Chelsea boot", "Bottega Veneta");
    }

    // Saint Laurent
    if (brandLower.includes("saint laurent") || fullText.includes("saint laurent") || fullText.includes("wyatt")) {
      if (fullText.includes("chelsea") || fullText.includes("nino") || fullText.includes("carson")) {
        return makeImg("shoes-saint-laurent-wyatt-chelsea.webp", "Saint Laurent Wyatt Chelsea 30 pointed toe boot", "Saint Laurent");
      }
      return makeImg("shoes-saint-laurent-wyatt-harness.webp", "Saint Laurent Wyatt 40 harness boot with Cuban heel in oiled suede", "Saint Laurent");
    }

    // Berluti
    if (brandLower.includes("berluti") || fullText.includes("berluti")) {
      return makeImg("shoes-berluti-brunico-boot.webp", "Berluti Brunico Venezia leather lace-up hiking and ankle boot", "Berluti");
    }

    // Christian Louboutin
    if (brandLower.includes("louboutin") || fullText.includes("louboutin")) {
      return makeImg("shoes-louboutin-roadie-boot.webp", "Christian Louboutin Roadie flat Chelsea boot with signature red sole", "Christian Louboutin");
    }

    // Church's
    if (brandLower.includes("church's") || brandLower.includes("churchs")) {
      return makeImg("shoes-churchs-amberley-boot.webp", "Church's Amberley Goodyear-welted leather Chelsea boot", "Church's");
    }

    // Prada
    if (brandLower.includes("prada") || fullText.includes("prada")) {
      return makeImg("shoes-prada-monolith-boot.webp", "Prada Monolith brushed leather and nylon combat boot", "Prada");
    }

    // Tod's
    if (brandLower.includes("tod's") || brandLower.includes("tods")) {
      return makeImg("shoes-tods-winter-gommino-boot.webp", "Tod's Winter Gommino ankle boot in water-resistant suede", "Tod's");
    }

    // John Lobb
    if (brandLower.includes("john lobb") || fullText.includes("john lobb")) {
      return makeImg("shoes-john-lobb-lawry-boot.webp", "John Lobb Lawry museum calf Goodyear-welted Chelsea boot", "John Lobb");
    }

    // R.M. Williams
    if (brandLower.includes("r.m. williams") || brandLower.includes("rm williams") || fullText.includes("craftsman")) {
      return makeImg("shoes-rm-williams-craftsman.webp", "R.M. Williams Comfort Craftsman one-piece yearling leather Chelsea boot", "R.M. Williams");
    }

    return makeImg("shoes-rm-williams-craftsman.webp", `${product.name} handcrafted leather Chelsea boot`, product.brand);
  }

  // =========================================================================
  // 4. LOAFERS
  // =========================================================================
  if (
    leaf === "loafers" ||
    fullText.includes("loafer") ||
    fullText.includes("moccasin") ||
    fullText.includes("gommino")
  ) {
    // Church's Loafers
    if (brandLower.includes("church's") || brandLower.includes("churchs")) {
      if (fullText.includes("darwin")) return makeImg("shoes-churchs-darwin.webp", "Church's Darwin soft suede Goodyear-welted penny loafer", "Church's");
      if (fullText.includes("keats")) return makeImg("shoes-churchs-keats.webp", "Church's Keats II polished leather tassel loafer", "Church's");
      if (fullText.includes("kingsley")) return makeImg("shoes-churchs-kingsley.webp", "Church's Kingsley 2 bookbinder leather tassel loafer", "Church's");
      if (fullText.includes("coldecott") || fullText.includes("oreham") || fullText.includes("split toe")) {
        return makeImg("shoes-churchs-coldecott.webp", "Church's Coldecott handcrafted split-toe leather loafer", "Church's");
      }
      return makeImg("shoes-churchs-pembrey.webp", "Church's Pembrey Goodyear-welted leather penny loafer", "Church's");
    }

    // Loro Piana
    if (brandLower.includes("loro piana") || fullText.includes("loro piana")) {
      if (fullText.includes("open walk")) return makeImg("shoes-loro-piana-open-walk.webp", "Loro Piana Open Walk suede ankle moccasin", "Loro Piana");
      return makeImg("shoes-loro-piana-summer-walk.webp", "Loro Piana Summer Walk water-repellent suede moccasin", "Loro Piana");
    }

    // Gucci
    if (brandLower.includes("gucci") || fullText.includes("gucci")) {
      if (fullText.includes("jordaan") || fullText.includes("brixton") || fullText.includes("princetown")) {
        return makeImg("shoes-gucci-horsebit-loafer.webp", "Gucci Jordaan slim-silhouette black leather Horsebit loafer", "Gucci");
      }
      return makeImg("shoes-gucci-1953-horsebit.webp", "Gucci 1953 Horsebit black leather loafer", "Gucci");
    }

    // Berluti
    if (brandLower.includes("berluti") || fullText.includes("berluti")) {
      if (fullText.includes("alessandro")) return makeImg("shoes-berluti-alessandro.webp", "Berluti Alessandro wholecut Venezia calfskin Oxford dress shoe", "Berluti");
      return makeImg("shoes-berluti-lorenzo-loafer.webp", "Berluti Lorenzo Rimini unlined patinated Venezia leather loafer", "Berluti");
    }

    // Ferragamo
    if (brandLower.includes("ferragamo") || fullText.includes("ferragamo")) {
      return makeImg("shoes-ferragamo-gancini-loafer.webp", "Ferragamo Gancini reversible bit calfskin leather slip-on loafer", "Ferragamo");
    }

    // Tod's
    if (brandLower.includes("tod's") || brandLower.includes("tods")) {
      return makeImg("shoes-tods-gommino.webp", "Tod's Gommino suede driving shoe with iconic rubber pebble sole", "Tod's");
    }

    // Christian Louboutin
    if (brandLower.includes("louboutin") || fullText.includes("louboutin")) {
      if (fullText.includes("red sole") || fullText.includes("spooky") || fullText.includes("rollerboy")) {
        return makeImg("shoes-louboutin-red-sole.webp", "Christian Louboutin signature red-lacquered sole loafer", "Christian Louboutin");
      }
      return makeImg("shoes-louboutin-dandelion.webp", "Christian Louboutin Dandelion velvet loafer with signature red sole", "Christian Louboutin");
    }

    // Hermès
    if (brandLower.includes("hermès") || brandLower.includes("hermes")) {
      return makeImg("shoes-hermes-paris-loafer.webp", "Hermès Paris goatskin loafer with signature H clasp", "Hermès");
    }

    // Santoni
    if (brandLower.includes("santoni") || fullText.includes("santoni")) {
      if (fullText.includes("cleanic") || fullText.includes("penny") || fullText.includes("driver")) {
        return makeImg("shoes-santoni-loafer.webp", "Santoni handcrafted patinated leather penny loafer", "Santoni");
      }
      return makeImg("shoes-santoni-double-monk.webp", "Santoni handcrafted patinated leather monk strap loafer", "Santoni");
    }

    // Brunello Cucinelli
    if (brandLower.includes("brunello cucinelli") || fullText.includes("cucinelli")) {
      return makeImg("shoes-brunello-cucinelli-suede.webp", "Brunello Cucinelli soft suede penny loafer", "Brunello Cucinelli");
    }

    // Prada
    if (brandLower.includes("prada") || fullText.includes("prada")) {
      return makeImg("shoes-prada-chocolate-loafer.webp", "Prada Chocolate brushed Spazzolato leather penny loafer", "Prada");
    }

    return makeImg("shoes-loro-piana-summer-walk.webp", `${product.name} luxury suede penny loafer`, product.brand);
  }

  // =========================================================================
  // 5. FORMAL SHOES
  // =========================================================================
  if (
    leaf === "formal-shoes" ||
    fullText.includes("oxford") ||
    fullText.includes("derby") ||
    fullText.includes("wholecut") ||
    fullText.includes("monk strap")
  ) {
    // Christian Louboutin
    if (brandLower.includes("louboutin") || fullText.includes("louboutin")) {
      return makeImg("shoes-louboutin-greggo.webp", "Christian Louboutin Greggo Oxford dress shoe", "Christian Louboutin");
    }

    // John Lobb
    if (brandLower.includes("john lobb") || fullText.includes("john lobb")) {
      return makeImg("shoes-john-lobb-city-ii.webp", "John Lobb City II iconic cap-toe Oxford in black calfskin", "John Lobb");
    }

    // Berluti
    if (brandLower.includes("berluti") || fullText.includes("berluti")) {
      if (fullText.includes("alessandro")) return makeImg("shoes-berluti-alessandro.webp", "Berluti Alessandro wholecut Venezia calfskin Oxford dress shoe", "Berluti");
      return makeImg("shoes-berluti-scritto-wholecut.webp", "Berluti Scritto calligraphy engraved Venezia leather wholecut Oxford", "Berluti");
    }

    // Church's
    if (brandLower.includes("church's") || brandLower.includes("churchs")) {
      if (fullText.includes("shannon")) return makeImg("shoes-churchs-shannon.webp", "Church's Shannon wholecut storm-welted Derby shoe", "Church's");
      return makeImg("shoes-churchs-consul.webp", "Church's Consul 173 classic English cap-toe Oxford shoe", "Church's");
    }

    // Tom Ford
    if (brandLower.includes("tom ford") || fullText.includes("tom ford")) {
      return makeImg("shoes-tom-ford-edgar.webp", "Tom Ford Edgar cap-toe Oxford dress shoe in burnished calf leather", "Tom Ford");
    }

    // Prada
    if (brandLower.includes("prada") || fullText.includes("prada")) {
      return makeImg("shoes-prada-spazzolato-derby.webp", "Prada brushed Spazzolato leather formal Derby shoe", "Prada");
    }

    // Ferragamo
    if (brandLower.includes("ferragamo") || fullText.includes("ferragamo")) {
      return makeImg("shoes-ferragamo-tramezza.webp", "Ferragamo Tramezza artisanal Goodyear-welted cap-toe Oxford", "Ferragamo");
    }

    // Dior Men
    if (brandLower.includes("dior") || fullText.includes("dior")) {
      return makeImg("shoes-dior-men-carlo.webp", "Dior Men Carlo polished black calfskin dress shoe", "Dior Men");
    }

    // Saint Laurent
    if (brandLower.includes("saint laurent") || fullText.includes("saint laurent")) {
      return makeImg("shoes-saint-laurent-derby.webp", "Saint Laurent glazed leather formal Derby shoe", "Saint Laurent");
    }

    // Santoni
    if (brandLower.includes("santoni") || fullText.includes("santoni")) {
      return makeImg("shoes-santoni-double-monk.webp", "Santoni handcrafted patinated leather monk strap dress shoe", "Santoni");
    }

    return makeImg("shoes-signature-oxford.webp", `${product.name} bespoke calfskin dress Oxford shoe`, product.brand);
  }

  // Fallback for general footwear category
  return makeImg("shoes-signature-oxford.webp", `${product.name} luxury footwear photography`, product.brand);
}
