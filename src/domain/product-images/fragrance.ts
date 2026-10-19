import { ProductQuery, ProductImageResolution, makeImg } from "./types";

export function resolveFragranceImage(product: ProductQuery): ProductImageResolution | null {
  const leaf = (product.leafType || product.category || "").toLowerCase();
  const nameLower = (product.name || "").toLowerCase();
  const brandLower = (product.brand || "").toLowerCase();
  const modelLower = (
    product.modelName ||
    (product as any).model ||
    (product.attributes?.modelName as string) ||
    ""
  ).toLowerCase();
  const fullText = `${nameLower} ${brandLower} ${modelLower}`;

  const isFragranceModel =
    fullText.includes("tobacco vanille") ||
    fullText.includes("oud wood") ||
    fullText.includes("lost cherry") ||
    fullText.includes("neroli portofino") ||
    fullText.includes("black orchid") ||
    fullText.includes("tuscan leather") ||
    fullText.includes("sauvage") ||
    fullText.includes("fahrenheit") ||
    fullText.includes("j'adore") ||
    fullText.includes("jadore") ||
    fullText.includes("miss dior") ||
    fullText.includes("bleu de chanel") ||
    fullText.includes("coco mademoiselle") ||
    fullText.includes("no 5") ||
    fullText.includes("n°5") ||
    fullText.includes("aventus") ||
    fullText.includes("green irish tweed") ||
    fullText.includes("silver mountain water") ||
    fullText.includes("millésime") ||
    fullText.includes("millesime") ||
    fullText.includes("royal oud") ||
    fullText.includes("le male") ||
    fullText.includes("ultra male") ||
    fullText.includes("le beau") ||
    fullText.includes("1 million") ||
    fullText.includes("invictus") ||
    fullText.includes("eros") ||
    fullText.includes("dylan blue") ||
    fullText.includes("born in roma") ||
    fullText.includes("uomo intense") ||
    fullText.includes("shalimar") ||
    fullText.includes("habit rouge") ||
    fullText.includes("l'homme idéal") ||
    fullText.includes("lhomme ideal") ||
    fullText.includes("terre d'hermès") ||
    fullText.includes("terre d'hermes") ||
    fullText.includes("un jardin") ||
    fullText.includes("twilly") ||
    fullText.includes("black opium") ||
    fullText.includes("baccarat rouge") ||
    fullText.includes("angels' share") ||
    fullText.includes("jazz club") ||
    fullText.includes("by the fireplace") ||
    fullText.includes("beach walk") ||
    fullText.includes("chergui") ||
    fullText.includes("ambre sultan") ||
    fullText.includes("féminité du bois") ||
    fullText.includes("light blue") ||
    fullText.includes("the one") ||
    fullText.includes("man in black") ||
    fullText.includes("aqva") ||
    fullText.includes("omnia");

  const nonFragranceLeaves = [
    "cleansers", "serums", "moisturizers", "sunscreens",
    "phones", "laptops", "tablets", "watches", "sunglasses",
    "handbags", "backpacks", "wallets", "loafers", "formal-shoes",
    "boots", "lifestyle-sneakers", "running-shoes", "suits", "coats",
    "jackets", "shirts", "t-shirts", "knitwear", "trousers", "denim",
    "dresses", "kitchenware", "decor", "home-textiles", "vacuum-cleaners", "air-purifiers"
  ];
  if (nonFragranceLeaves.includes(leaf)) return null;

  const isFragrance =
    leaf === "fragrance" ||
    leaf === "fragrances" ||
    leaf === "perfume" ||
    leaf === "perfumes" ||
    fullText.includes("eau de parfum") ||
    fullText.includes("eau de toilette") ||
    fullText.includes("perfume") ||
    fullText.includes("parfum") ||
    fullText.includes("cologne") ||
    fullText.includes("extrait") ||
    fullText.includes("elixir") ||
    fullText.includes("edp") ||
    fullText.includes("edt") ||
    fullText.includes("flacon") ||
    brandLower.includes("amouage") ||
    brandLower.includes("creed") ||
    brandLower.includes("parfums de marly") ||
    brandLower.includes("marly") ||
    brandLower.includes("initio") ||
    brandLower.includes("serge lutens") ||
    brandLower.includes("kurkdjian") ||
    brandLower.includes("kilian") ||
    brandLower.includes("by kilian") ||
    brandLower.includes("margiela") ||
    brandLower.includes("guerlain") ||
    brandLower.includes("diptyque") ||
    brandLower.includes("byredo") ||
    brandLower.includes("penhaligon") ||
    isFragranceModel;

  if (!isFragrance) return null;

  // ==========================================
  // 1. DIOR
  // ==========================================
  if (brandLower.includes("dior") || fullText.includes("dior")) {
    if (fullText.includes("ambre nuit")) {
      return makeImg("fragrance-dior-ambre-nuit.webp", "Dior Ambre Nuit La Collection Privée flacon", "Dior");
    }
    if (fullText.includes("oud ispahan")) {
      return makeImg("fragrance-dior-oud-ispahan.webp", "Dior Oud Ispahan La Collection Privée flacon", "Dior");
    }
    if (fullText.includes("bois d'argent") || fullText.includes("bois dargent")) {
      return makeImg("fragrance-dior-bois-dargent.webp", "Dior Bois d'Argent La Collection Privée flacon", "Dior");
    }
    if (fullText.includes("elixir") || fullText.includes("sauvage elixir")) {
      return makeImg("fragrance-dior-sauvage-elixir.webp", "Dior Sauvage Elixir luxury concentrated flacon", "Dior");
    }
    if (fullText.includes("sauvage")) {
      return makeImg("fragrance-dior-sauvage.webp", "Dior Sauvage Eau de Parfum official flacon", "Dior");
    }
    if (fullText.includes("fahrenheit")) {
      return makeImg("fragrance-dior-fahrenheit.webp", "Dior Fahrenheit Eau de Toilette iconic ombre flacon", "Dior");
    }
    if (fullText.includes("j'adore") || fullText.includes("jadore")) {
      return makeImg("fragrance-dior-jadore.webp", "Dior J'adore l'Or amphora luxury flacon", "Dior");
    }
    if (fullText.includes("miss dior")) {
      return makeImg("fragrance-dior-miss-dior.webp", "Miss Dior Eau de Parfum couture bow flacon", "Dior");
    }
    if (fullText.includes("gris dior")) {
      return makeImg("fragrance-dior-gris-dior.webp", "Dior Gris Dior La Collection Privée flacon", "Dior");
    }
    if (fullText.includes("dior homme") || fullText.includes("homme intense")) {
      return makeImg("fragrance-dior-homme.webp", "Dior Homme Intense Eau de Parfum architectural flacon", "Dior");
    }
    return makeImg("fragrance-dior-sauvage.webp", `${product.name} luxury flacon`, "Dior");
  }

  // ==========================================
  // 2. CHANEL
  // ==========================================
  if (brandLower.includes("chanel") || fullText.includes("chanel")) {
    if (fullText.includes("coromandel")) {
      return makeImg("fragrance-chanel-coromandel.webp", "Chanel Coromandel Les Exclusifs de Chanel flacon", "Chanel");
    }
    if (fullText.includes("sycomore")) {
      return makeImg("fragrance-chanel-sycomore.webp", "Chanel Sycomore Les Exclusifs de Chanel flacon", "Chanel");
    }
    if (fullText.includes("platinum") || fullText.includes("égoïste") || fullText.includes("egoiste")) {
      return makeImg("fragrance-chanel-platinum-egoiste.webp", "Chanel Platinum Égoïste Eau de Toilette flacon", "Chanel");
    }
    if (fullText.includes("antaeus")) {
      return makeImg("fragrance-chanel-antaeus.webp", "Chanel Antaeus Eau de Toilette black flacon", "Chanel");
    }
    if (fullText.includes("bleu de chanel") || fullText.includes("bleu")) {
      return makeImg("fragrance-chanel-bleu.webp", "Bleu de Chanel Eau de Parfum deep blue bottle", "Chanel");
    }
    if (fullText.includes("no. 5") || fullText.includes("no 5") || fullText.includes("n°5")) {
      return makeImg("fragrance-chanel-no5.webp", "Chanel No. 5 iconic crystal flacon", "Chanel");
    }
    if (fullText.includes("coco mademoiselle") || fullText.includes("mademoiselle")) {
      return makeImg("fragrance-chanel-coco-mademoiselle.webp", "Chanel Coco Mademoiselle Eau de Parfum bottle", "Chanel");
    }
    if (fullText.includes("allure homme sport") || fullText.includes("allure")) {
      return makeImg("fragrance-chanel-allure-homme-sport.webp", "Chanel Allure Homme Sport Eau Extrême flacon", "Chanel");
    }
    if (fullText.includes("chance")) {
      return makeImg("fragrance-chanel-chance.webp", "Chanel Chance Eau Tendre Eau de Parfum flacon", "Chanel");
    }
    return makeImg("fragrance-chanel-bleu.webp", `${product.name} luxury flacon`, "Chanel");
  }

  // ==========================================
  // 3. CREED
  // ==========================================
  if (brandLower.includes("creed") || fullText.includes("creed")) {
    if (fullText.includes("aventus cologne")) {
      return makeImg("fragrance-creed-aventus-cologne.webp", "Creed Aventus Cologne fresh citrus woody flacon", "Creed");
    }
    if (fullText.includes("aventus")) {
      return makeImg("fragrance-creed-aventus.webp", "Creed Aventus Eau de Parfum iconic heritage flacon", "Creed");
    }
    if (fullText.includes("green irish tweed")) {
      return makeImg("fragrance-creed-green-irish-tweed.webp", "Creed Green Irish Tweed opaque black flacon", "Creed");
    }
    if (fullText.includes("silver mountain water")) {
      return makeImg("fragrance-creed-silver-mountain-water.webp", "Creed Silver Mountain Water alpine white flacon", "Creed");
    }
    if (fullText.includes("millésime impérial") || fullText.includes("millesime imperial")) {
      return makeImg("fragrance-creed-millesime-imperial.webp", "Creed Millésime Impérial gold metallic flacon", "Creed");
    }
    if (fullText.includes("royal oud")) {
      return makeImg("fragrance-creed-royal-oud.webp", "Creed Royal Oud luxury smoky amber flacon", "Creed");
    }
    if (fullText.includes("viking")) {
      return makeImg("fragrance-creed-viking.webp", "Creed Viking fiery red seafaring flacon", "Creed");
    }
    if (fullText.includes("original vetiver")) {
      return makeImg("fragrance-creed-original-vetiver.webp", "Creed Original Vetiver green translucent flacon", "Creed");
    }
    if (fullText.includes("carmina")) {
      return makeImg("fragrance-creed-carmina.webp", "Creed Carmina electric magenta flacon", "Creed");
    }
    if (fullText.includes("virgin island water")) {
      return makeImg("fragrance-creed-virgin-island-water.webp", "Creed Virgin Island Water Caribbean coconut lime flacon", "Creed");
    }
    return makeImg("fragrance-creed-aventus.webp", `${product.name} luxury flacon`, "Creed");
  }

  // ==========================================
  // 4. TOM FORD
  // ==========================================
  if (brandLower.includes("tom ford") || fullText.includes("tom ford")) {
    if (fullText.includes("soleil blanc")) {
      return makeImg("fragrance-tom-ford-soleil-blanc.webp", "Tom Ford Soleil Blanc white chess flacon", "Tom Ford");
    }
    if (fullText.includes("bitter peach")) {
      return makeImg("fragrance-tom-ford-bitter-peach.webp", "Tom Ford Bitter Peach peach glass flacon", "Tom Ford");
    }
    if (fullText.includes("grey vetiver")) {
      return makeImg("fragrance-tom-ford-grey-vetiver.webp", "Tom Ford Grey Vetiver silver flacon", "Tom Ford");
    }
    if (fullText.includes("ébène fumé") || fullText.includes("ebene fume")) {
      return makeImg("fragrance-tom-ford-ebene-fume.webp", "Tom Ford Ébène Fumé amber chess flacon", "Tom Ford");
    }
    if (fullText.includes("tobacco vanille")) {
      return makeImg("fragrance-tom-ford-tobacco-vanille.webp", "Tom Ford Private Blend Tobacco Vanille amber flacon", "Tom Ford");
    }
    if (fullText.includes("oud wood")) {
      return makeImg("fragrance-tom-ford-oud-wood.webp", "Tom Ford Private Blend Oud Wood dark grey chess flacon", "Tom Ford");
    }
    if (fullText.includes("lost cherry")) {
      return makeImg("fragrance-tom-ford-lost-cherry.webp", "Tom Ford Lost Cherry crimson glass flacon", "Tom Ford");
    }
    if (fullText.includes("neroli portofino")) {
      return makeImg("fragrance-tom-ford-neroli-portofino.webp", "Tom Ford Neroli Portofino turquoise Italian Riviera flacon", "Tom Ford");
    }
    if (fullText.includes("black orchid")) {
      return makeImg("fragrance-tom-ford-black-orchid.webp", "Tom Ford Black Orchid fluted black glass gold plaque flacon", "Tom Ford");
    }
    if (fullText.includes("tuscan leather")) {
      return makeImg("fragrance-tom-ford-tuscan-leather.webp", "Tom Ford Tuscan Leather dark amber luxury flacon", "Tom Ford");
    }
    return makeImg("fragrance-tom-ford-oud-wood.webp", `${product.name} luxury flacon`, "Tom Ford");
  }

  // ==========================================
  // 5. MAISON FRANCIS KURKDJIAN (MFK)
  // ==========================================
  if (
    brandLower.includes("kurkdjian") ||
    brandLower.includes("mfk") ||
    fullText.includes("kurkdjian") ||
    fullText.includes("baccarat rouge")
  ) {
    if (fullText.includes("oud satin mood") || (fullText.includes("oud") && fullText.includes("satin"))) {
      return makeImg("fragrance-mfk-oud-satin-mood.webp", "MFK Oud Satin Mood midnight blue gold flacon", "Maison Francis Kurkdjian");
    }
    if (fullText.includes("oud silk mood") || (fullText.includes("oud") && fullText.includes("silk"))) {
      return makeImg("fragrance-mfk-oud-silk-mood.webp", "MFK Oud Silk Mood crystal flacon", "Maison Francis Kurkdjian");
    }
    if (fullText.includes("oud")) {
      return makeImg("fragrance-mfk-oud.webp", "MFK OUD Eau de Parfum gold cap crystal flacon", "Maison Francis Kurkdjian");
    }
    if (fullText.includes("l’homme à la rose") || fullText.includes("l'homme a la rose") || (fullText.includes("homme") && fullText.includes("rose"))) {
      return makeImg("fragrance-mfk-lhomme-a-la-rose.webp", "MFK L'Homme À la rose zinc cap flacon", "Maison Francis Kurkdjian");
    }
    if (fullText.includes("à la rose") || fullText.includes("a la rose")) {
      return makeImg("fragrance-mfk-a-la-rose.webp", "MFK À la rose gold cap blush flacon", "Maison Francis Kurkdjian");
    }
    if (fullText.includes("gentle fluidity silver")) {
      return makeImg("fragrance-mfk-gentle-fluidity-silver.webp", "MFK Gentle Fluidity Silver architectural flacon", "Maison Francis Kurkdjian");
    }
    if (fullText.includes("gentle fluidity gold") || fullText.includes("gentle fluidity")) {
      return makeImg("fragrance-mfk-gentle-fluidity-gold.webp", "MFK Gentle Fluidity Gold architectural flacon", "Maison Francis Kurkdjian");
    }
    if (fullText.includes("amyris")) {
      return makeImg("fragrance-mfk-amyris.webp", "MFK Amyris Eau de Parfum golden flacon", "Maison Francis Kurkdjian");
    }
    if (fullText.includes("pluriel")) {
      return makeImg("fragrance-mfk-feminin-pluriel.webp", "MFK féminin Pluriel elegant crystal flacon", "Maison Francis Kurkdjian");
    }
    if (fullText.includes("petit matin") || fullText.includes("matin")) {
      return makeImg("fragrance-mfk-petit-matin.webp", "MFK Petit Matin Parisian sunrise gold flacon", "Maison Francis Kurkdjian");
    }
    if (fullText.includes("grand soir") || fullText.includes("soir")) {
      return makeImg("fragrance-mfk-grand-soir.webp", "MFK Grand Soir Parisian evening amber flacon", "Maison Francis Kurkdjian");
    }
    if (fullText.includes("724")) {
      return makeImg("fragrance-mfk-724.webp", "MFK 724 Eau de Parfum urban architectural flacon", "Maison Francis Kurkdjian");
    }
    if (fullText.includes("aqua universalis")) {
      return makeImg("fragrance-mfk-aqua-universalis.webp", "MFK Aqua Universalis Forte luminous white crystal flacon", "Maison Francis Kurkdjian");
    }
    if (fullText.includes("baccarat rouge") || fullText.includes("540")) {
      return makeImg("fragrance-mfk-baccarat-rouge-540.webp", "MFK Baccarat Rouge 540 Eau de Parfum crystal flacon", "Maison Francis Kurkdjian");
    }
    return makeImg("fragrance-mfk-baccarat-rouge-540.webp", `${product.name} luxury flacon`, "Maison Francis Kurkdjian");
  }

  // ==========================================
  // 6. KILIAN PARIS
  // ==========================================
  if (brandLower.includes("kilian") || fullText.includes("kilian")) {
    if (fullText.includes("straight to heaven")) {
      return makeImg("fragrance-kilian-straight-to-heaven.webp", "Kilian Straight to Heaven White Cristal carafe flacon", "Kilian Paris");
    }
    if (fullText.includes("vodka on the rocks")) {
      return makeImg("fragrance-kilian-vodka-on-the-rocks.webp", "Kilian Vodka on the Rocks iced glass flacon", "Kilian Paris");
    }
    if (fullText.includes("moonlight in heaven")) {
      return makeImg("fragrance-kilian-moonlight-in-heaven.webp", "Kilian Moonlight in Heaven cobalt blue flacon", "Kilian Paris");
    }
    if (fullText.includes("intoxicated")) {
      return makeImg("fragrance-kilian-intoxicated.webp", "Kilian Intoxicated Turkish coffee black flacon", "Kilian Paris");
    }
    if (fullText.includes("rolling in love")) {
      return makeImg("fragrance-kilian-rolling-in-love.webp", "Kilian Rolling in Love crimson red flacon", "Kilian Paris");
    }
    if (fullText.includes("apple brandy")) {
      return makeImg("fragrance-kilian-apple-brandy.webp", "Kilian Apple Brandy on the Rocks crystal tumbler flacon", "Kilian Paris");
    }
    if (fullText.includes("smoking hot")) {
      return makeImg("fragrance-kilian-smoking-hot.webp", "Kilian Smoking Hot hookah smoke flacon", "Kilian Paris");
    }
    if (fullText.includes("angels' share") || fullText.includes("angels share")) {
      return makeImg("fragrance-kilian-angels-share.webp", "Kilian Angels' Share cognac crystal flacon", "Kilian Paris");
    }
    if (fullText.includes("love, don't be shy") || fullText.includes("love don't be shy") || fullText.includes("love dont be shy")) {
      return makeImg("fragrance-kilian-love-dont-be-shy.webp", "Kilian Love Don't Be Shy marshmallow white gold engraved flacon", "Kilian Paris");
    }
    if (fullText.includes("black phantom")) {
      return makeImg("fragrance-kilian-black-phantom.webp", "Kilian Black Phantom Memento Mori lacquer flacon", "Kilian Paris");
    }
    return makeImg("fragrance-kilian-angels-share.webp", `${product.name} luxury flacon`, "Kilian Paris");
  }

  // ==========================================
  // 7. PARFUMS DE MARLY
  // ==========================================
  if (brandLower.includes("marly") || fullText.includes("parfums de marly") || fullText.includes("layton")) {
    if (fullText.includes("layton")) {
      return makeImg("fragrance-pdm-layton.webp", "Parfums de Marly Layton royal navy blue flacon", "Parfums de Marly");
    }
    if (fullText.includes("herod")) {
      return makeImg("fragrance-pdm-herod.webp", "Parfums de Marly Herod smoked grey metallic equestrian flacon", "Parfums de Marly");
    }
    if (fullText.includes("pegasus")) {
      return makeImg("fragrance-pdm-pegasus.webp", "Parfums de Marly Pegasus brilliant mirror silver flacon", "Parfums de Marly");
    }
    if (fullText.includes("delina")) {
      return makeImg("fragrance-pdm-delina.webp", "Parfums de Marly Delina powdered pink tasseled flacon", "Parfums de Marly");
    }
    if (fullText.includes("carlisle")) {
      return makeImg("fragrance-pdm-carlisle.webp", "Parfums de Marly Carlisle matte black flacon", "Parfums de Marly");
    }
    if (fullText.includes("greenley")) {
      return makeImg("fragrance-pdm-greenley.webp", "Parfums de Marly Greenley vibrant green forest flacon", "Parfums de Marly");
    }
    if (fullText.includes("sedley")) {
      return makeImg("fragrance-pdm-sedley.webp", "Parfums de Marly Sedley azure transparent aquatic flacon", "Parfums de Marly");
    }
    if (fullText.includes("haltane")) {
      return makeImg("fragrance-pdm-haltane.webp", "Parfums de Marly Haltane emerald green gold flacon", "Parfums de Marly");
    }
    if (fullText.includes("althaïr") || fullText.includes("althair")) {
      return makeImg("fragrance-pdm-althair.webp", "Parfums de Marly Althaïr warm bourbon brown flacon", "Parfums de Marly");
    }
    if (fullText.includes("valaya")) {
      return makeImg("fragrance-pdm-valaya.webp", "Parfums de Marly Valaya frosted white chiffon flacon", "Parfums de Marly");
    }
    if (fullText.includes("oriana")) {
      return makeImg("fragrance-pdm-oriana.webp", "Parfums de Marly Oriana bright candy pink tasseled flacon", "Parfums de Marly");
    }
    if (fullText.includes("palatine")) {
      return makeImg("fragrance-pdm-palatine.webp", "Parfums de Marly Palatine regal violet purple flacon", "Parfums de Marly");
    }
    if (fullText.includes("percival")) {
      return makeImg("fragrance-pdm-percival.webp", "Parfums de Marly Percival royal blue aquatic flacon", "Parfums de Marly");
    }
    return makeImg("fragrance-pdm-layton.webp", `${product.name} luxury flacon`, "Parfums de Marly");
  }

  // ==========================================
  // 8. HERMÈS
  // ==========================================
  if (brandLower.includes("hermès") || brandLower.includes("hermes") || fullText.includes("hermes") || fullText.includes("hermès")) {
    if (fullText.includes("eau givrée") || fullText.includes("eau givree")) {
      return makeImg("fragrance-hermes-terre-eau-givree.webp", "Hermès Terre d'Hermès Eau Givrée frosted flacon", "Hermès");
    }
    if (fullText.includes("citron noir")) {
      return makeImg("fragrance-hermes-citron-noir.webp", "Hermès Eau de Citron Noir deep blue flacon", "Hermès");
    }
    if (fullText.includes("ambre narguilé") || fullText.includes("ambre narguile")) {
      return makeImg("fragrance-hermes-ambre-narguile.webp", "Hermès Ambre Narguilé Hermessence leather cap flacon", "Hermès");
    }
    if (fullText.includes("poivre samarcande")) {
      return makeImg("fragrance-hermes-poivre-samarcande.webp", "Hermès Poivre Samarcande Hermessence flacon", "Hermès");
    }
    if (fullText.includes("osmanthe yunnan")) {
      return makeImg("fragrance-hermes-osmanthe-yunnan.webp", "Hermès Osmanthe Yunnan Hermessence flacon", "Hermès");
    }
    if (fullText.includes("voyage")) {
      return makeImg("fragrance-hermes-voyage.webp", "Hermès Voyage d'Hermès stirrup swivel flacon", "Hermès");
    }
    if (fullText.includes("terre d'hermès") || fullText.includes("terre d'hermes") || fullText.includes("terre")) {
      return makeImg("fragrance-hermes-terre.webp", "Terre d'Hermès Parfum iconic H-base mineral flacon", "Hermès");
    }
    if (fullText.includes("jardin sur le nil") || fullText.includes("jardin")) {
      return makeImg("fragrance-hermes-un-jardin-sur-le-nil.webp", "Hermès Un Jardin sur le Nil green ombre flacon", "Hermès");
    }
    if (fullText.includes("twilly")) {
      return makeImg("fragrance-hermes-twilly.webp", "Hermès Twilly d'Hermès bowler hat silk ribbon flacon", "Hermès");
    }
    if (fullText.includes("h24")) {
      return makeImg("fragrance-hermes-h24.webp", "Hermès H24 aerodynamic refillable glass flacon", "Hermès");
    }
    return makeImg("fragrance-hermes-terre.webp", `${product.name} luxury flacon`, "Hermès");
  }

  // ==========================================
  // 9. YVES SAINT LAURENT (YSL)
  // ==========================================
  if (brandLower.includes("yves saint laurent") || brandLower.includes("ysl") || fullText.includes("ysl") || fullText.includes("yves saint laurent")) {
    if (fullText.includes("y elixir")) {
      return makeImg("fragrance-ysl-y-elixir.webp", "YSL Y Elixir deep blue metallic flacon", "Yves Saint Laurent");
    }
    if (fullText.includes("myslf")) {
      return makeImg("fragrance-ysl-myslf.webp", "YSL MYSLF Eau de Parfum monolith black glass flacon", "Yves Saint Laurent");
    }
    if (fullText.includes("babycat")) {
      return makeImg("fragrance-ysl-babycat.webp", "YSL Babycat Le Vestiaire des Parfums luxury flacon", "Yves Saint Laurent");
    }
    if (fullText.includes("la nuit de l'homme") || fullText.includes("la nuit")) {
      return makeImg("fragrance-ysl-la-nuit-de-lhomme.webp", "YSL La Nuit de L'Homme hexagonal black bolt cap flacon", "Yves Saint Laurent");
    }
    if (fullText.includes("l'homme") || fullText.includes("lhomme")) {
      return makeImg("fragrance-ysl-lhomme.webp", "YSL L'Homme Eau de Toilette hex cap architectural flacon", "Yves Saint Laurent");
    }
    if (fullText.includes("libre le parfum")) {
      return makeImg("fragrance-ysl-libre-le-parfum.webp", "YSL Libre Le Parfum fiery amber couture flacon", "Yves Saint Laurent");
    }
    if (fullText.includes("libre")) {
      return makeImg("fragrance-ysl-libre.webp", "YSL Libre Eau de Parfum couture asymmetric cap gold logo flacon", "Yves Saint Laurent");
    }
    if (fullText.includes("black opium")) {
      return makeImg("fragrance-ysl-black-opium.webp", "YSL Black Opium glitter textured porthole flacon", "Yves Saint Laurent");
    }
    if (fullText.includes("tuxedo")) {
      return makeImg("fragrance-ysl-tuxedo.webp", "YSL Tuxedo Le Vestiaire des Parfums architectural flacon", "Yves Saint Laurent");
    }
    if (fullText.includes("y eau de parfum") || fullText.includes("ysl y") || fullText.includes("y edp") || fullText.includes("y ")) {
      return makeImg("fragrance-ysl-y.webp", "YSL Y Eau de Parfum iconic metal Y crest flacon", "Yves Saint Laurent");
    }
    return makeImg("fragrance-ysl-y.webp", `${product.name} luxury flacon`, "Yves Saint Laurent");
  }

  // ==========================================
  // 10. GIORGIO ARMANI
  // ==========================================
  if (brandLower.includes("armani") || fullText.includes("armani")) {
    if (fullText.includes("profondo")) {
      return makeImg("fragrance-armani-acqua-profondo.webp", "Giorgio Armani Acqua di Giò Profondo navy marine flacon", "Giorgio Armani");
    }
    if (fullText.includes("rose d'arabie") || fullText.includes("rose darabie")) {
      return makeImg("fragrance-armani-prive-rose-darabie.webp", "Armani Privé Rose d'Arabie gold plaque black flacon", "Giorgio Armani");
    }
    if (fullText.includes("rouge malachite")) {
      return makeImg("fragrance-armani-prive-rouge-malachite.webp", "Armani Privé Rouge Malachite mineral resin flacon", "Giorgio Armani");
    }
    if (fullText.includes("thé yulong") || fullText.includes("the yulong")) {
      return makeImg("fragrance-armani-prive-the-yulong.webp", "Armani Privé Thé Yulong green tea crystal flacon", "Giorgio Armani");
    }
    if (fullText.includes("acqua di giò") || fullText.includes("acqua di gio") || fullText.includes("acqua")) {
      return makeImg("fragrance-armani-acqua.webp", "Giorgio Armani Acqua di Giò frosted marine flacon", "Giorgio Armani");
    }
    if (fullText.includes("code")) {
      return makeImg("fragrance-armani-code.webp", "Armani Code Parfum magnetic tuxedo capsule flacon", "Giorgio Armani");
    }
    if (fullText.includes("sì") || fullText.includes("si eau de parfum") || fullText.includes("si intense")) {
      return makeImg("fragrance-armani-si.webp", "Armani Sì Eau de Parfum teardrop black stone cap flacon", "Giorgio Armani");
    }
    if (fullText.includes("stronger with you")) {
      return makeImg("fragrance-armani-stronger-with-you.webp", "Emporio Armani Stronger With You double ring cap flacon", "Giorgio Armani");
    }
    if (fullText.includes("my way")) {
      return makeImg("fragrance-armani-my-way.webp", "Armani My Way talisman blue stone golden band flacon", "Giorgio Armani");
    }
    return makeImg("fragrance-armani-acqua.webp", `${product.name} luxury flacon`, "Giorgio Armani");
  }

  // ==========================================
  // 11. JEAN PAUL GAULTIER (JPG)
  // ==========================================
  if (brandLower.includes("gaultier") || brandLower.includes("jpg") || fullText.includes("gaultier") || fullText.includes("le male")) {
    if (fullText.includes("classique")) {
      return makeImg("fragrance-jpg-classique.webp", "Jean Paul Gaultier Classique iconic corset flacon", "Jean Paul Gaultier");
    }
    if (fullText.includes("divine")) {
      return makeImg("fragrance-jpg-divine.webp", "Jean Paul Gaultier Gaultier Divine golden corset flacon", "Jean Paul Gaultier");
    }
    if (fullText.includes("la belle")) {
      return makeImg("fragrance-jpg-la-belle.webp", "Jean Paul Gaultier La Belle Le Parfum faceted torso flacon", "Jean Paul Gaultier");
    }
    if (fullText.includes("elixir") && fullText.includes("male")) {
      return makeImg("fragrance-jpg-lemale-elixir.webp", "Jean Paul Gaultier Le Male Elixir golden striped torso flacon", "Jean Paul Gaultier");
    }
    if (fullText.includes("le parfum") && fullText.includes("male")) {
      return makeImg("fragrance-jpg-lemale-le-parfum.webp", "Jean Paul Gaultier Le Male Le Parfum black gold officer torso flacon", "Jean Paul Gaultier");
    }
    if (fullText.includes("scandal pour homme")) {
      return makeImg("fragrance-jpg-scandal-pour-homme.webp", "Jean Paul Gaultier Scandal Pour Homme crowned trophy flacon", "Jean Paul Gaultier");
    }
    if (fullText.includes("scandal")) {
      return makeImg("fragrance-jpg-scandal.webp", "Jean Paul Gaultier Scandal cabaret legs flacon", "Jean Paul Gaultier");
    }
    if (fullText.includes("ultra male")) {
      return makeImg("fragrance-jpg-ultra-male.webp", "Jean Paul Gaultier Ultra Male dark navy sailor torso flacon", "Jean Paul Gaultier");
    }
    if (fullText.includes("le beau")) {
      return makeImg("fragrance-jpg-le-beau.webp", "Jean Paul Gaultier Le Beau faceted torso vine leaf flacon", "Jean Paul Gaultier");
    }
    if (fullText.includes("le male")) {
      return makeImg("fragrance-jpg-lemale.webp", "Jean Paul Gaultier Le Male iconic turquoise sailor torso flacon", "Jean Paul Gaultier");
    }
    return makeImg("fragrance-jpg-lemale.webp", `${product.name} luxury flacon`, "Jean Paul Gaultier");
  }

  // ==========================================
  // 12. INITIO PARFUMS PRIVÉS
  // ==========================================
  if (brandLower.includes("initio") || fullText.includes("initio")) {
    if (fullText.includes("side effect")) {
      return makeImg("fragrance-initio-side-effect.webp", "Initio Side Effect deep purple gold talisman flacon", "Initio");
    }
    if (fullText.includes("rehab")) {
      return makeImg("fragrance-initio-rehab.webp", "Initio Rehab pristine white gold Hedonist flacon", "Initio");
    }
    if (fullText.includes("atomic rose")) {
      return makeImg("fragrance-initio-atomic-rose.webp", "Initio Atomic Rose hypnotic purple rose flacon", "Initio");
    }
    if (fullText.includes("musk therapy")) {
      return makeImg("fragrance-initio-musk-therapy.webp", "Initio Musk Therapy pure white velvet flacon", "Initio");
    }
    if (fullText.includes("psychedelic love")) {
      return makeImg("fragrance-initio-psychedelic-love.webp", "Initio Psychedelic Love narcotic gold lattice flacon", "Initio");
    }
    if (fullText.includes("paragon")) {
      return makeImg("fragrance-initio-paragon.webp", "Initio Paragon botanical white sacred palo santo flacon", "Initio");
    }
    if (fullText.includes("narcotic delight")) {
      return makeImg("fragrance-initio-narcotic-delight.webp", "Initio Narcotic Delight cherry cognac luxury flacon", "Initio");
    }
    if (fullText.includes("blessed baraka")) {
      return makeImg("fragrance-initio-blessed-baraka.webp", "Initio Blessed Baraka sacred solar amber flacon", "Initio");
    }
    if (fullText.includes("high frequency")) {
      return makeImg("fragrance-initio-high-frequency.webp", "Initio High Frequency white gold almond flacon", "Initio");
    }
    if (fullText.includes("addictive vibration")) {
      return makeImg("fragrance-initio-addictive-vibration.webp", "Initio Addictive Vibration apple blossom honey flacon", "Initio");
    }
    if (fullText.includes("mystic experience")) {
      return makeImg("fragrance-initio-mystic-experience.webp", "Initio Mystic Experience sandalwood amber flacon", "Initio");
    }
    if (fullText.includes("oud for happiness")) {
      return makeImg("fragrance-initio-oud-for-happiness.webp", "Initio Oud for Happiness green gold sacred geometry flacon", "Initio");
    }
    if (fullText.includes("oud for greatness")) {
      return makeImg("fragrance-initio-oud.webp", "Initio Oud for Greatness Tree of Life matte black flacon", "Initio");
    }
    return makeImg("fragrance-initio-oud.webp", `${product.name} luxury flacon`, "Initio");
  }

  // ==========================================
  // 13. GUERLAIN
  // ==========================================
  if (brandLower.includes("guerlain") || fullText.includes("guerlain")) {
    if (fullText.includes("vétiver") || fullText.includes("vetiver")) {
      return makeImg("fragrance-guerlain-vetiver.webp", "Guerlain Vétiver Eau de Toilette heritage flacon", "Guerlain");
    }
    if (fullText.includes("tobacco honey")) {
      return makeImg("fragrance-guerlain-tobacco-honey.webp", "Guerlain Tobacco Honey L'Art & La Matière octagonal flacon", "Guerlain");
    }
    if (fullText.includes("double vanille") || fullText.includes("spiritueuse")) {
      return makeImg("fragrance-guerlain-double-vanille.webp", "Guerlain Spiritueuse Double Vanille golden cord flacon", "Guerlain");
    }
    if (fullText.includes("néroli outrenoir") || fullText.includes("neroli outrenoir")) {
      return makeImg("fragrance-guerlain-neroli-outrenoir.webp", "Guerlain Néroli Outrenoir dark smoky crystal flacon", "Guerlain");
    }
    if (fullText.includes("mitsouko")) {
      return makeImg("fragrance-guerlain-mitsouko.webp", "Guerlain Mitsouko heart stopper heritage flacon", "Guerlain");
    }
    if (fullText.includes("aqua allegoria") || fullText.includes("mandarine basilic")) {
      return makeImg("fragrance-guerlain-aqua-allegoria.webp", "Guerlain Aqua Allegoria honeycomb golden dome flacon", "Guerlain");
    }
    if (fullText.includes("shalimar")) {
      return makeImg("fragrance-guerlain-shalimar.webp", "Guerlain Shalimar fan-stopper crystal heritage flacon", "Guerlain");
    }
    if (fullText.includes("l'homme idéal") || fullText.includes("l'homme ideal") || fullText.includes("ideal")) {
      return makeImg("fragrance-guerlain-lhomme-ideal.webp", "Guerlain L'Homme Idéal guilloche cap masculine square flacon", "Guerlain");
    }
    if (fullText.includes("mon guerlain")) {
      return makeImg("fragrance-guerlain-mon-guerlain.webp", "Guerlain Mon Guerlain quadrilobe crystal ribbon flacon", "Guerlain");
    }
    if (fullText.includes("habit rouge")) {
      return makeImg("fragrance-guerlain-habit-rouge.webp", "Guerlain Habit Rouge equestrian red leather flacon", "Guerlain");
    }
    return makeImg("fragrance-guerlain-shalimar.webp", `${product.name} luxury flacon`, "Guerlain");
  }

  // ==========================================
  // 14. VALENTINO
  // ==========================================
  if (brandLower.includes("valentino") || fullText.includes("valentino")) {
    if (fullText.includes("coral fantasy")) {
      return makeImg("fragrance-valentino-coral-fantasy.webp", "Valentino Born in Roma Coral Fantasy rockstud flacon", "Valentino");
    }
    if (fullText.includes("voce viva intensa")) {
      return makeImg("fragrance-valentino-voce-viva-intensa.webp", "Valentino Voce Viva Intensa golden rockstud flacon", "Valentino");
    }
    if (fullText.includes("voce viva")) {
      return makeImg("fragrance-valentino-voce-viva.webp", "Valentino Voce Viva Eau de Parfum square rockstud flacon", "Valentino");
    }
    if (fullText.includes("green stravaganza")) {
      return makeImg("fragrance-valentino-green-stravaganza.webp", "Valentino Born in Roma Green Stravaganza rockstud flacon", "Valentino");
    }
    if (fullText.includes("donna") && fullText.includes("intense")) {
      return makeImg("fragrance-valentino-donna-intense.webp", "Valentino Born in Roma Donna Intense rockstud flacon", "Valentino");
    }
    if (fullText.includes("donna born in roma") || (fullText.includes("born in roma") && fullText.includes("donna"))) {
      return makeImg("fragrance-valentino-donna-born-in-roma.webp", "Valentino Born in Roma Donna pink rockstud glass flacon", "Valentino");
    }
    if (fullText.includes("uomo intense") || fullText.includes("valentino uomo")) {
      return makeImg("fragrance-valentino-uomo-intense.webp", "Valentino Uomo Intense black rockstud glass flacon", "Valentino");
    }
    if (fullText.includes("born in roma")) {
      return makeImg("fragrance-valentino-born-in-roma.webp", "Valentino Born in Roma Uomo Roman rockstud flacon", "Valentino");
    }
    return makeImg("fragrance-valentino-born-in-roma.webp", `${product.name} luxury flacon`, "Valentino");
  }

  // ==========================================
  // 15. VERSACE
  // ==========================================
  if (brandLower.includes("versace") || fullText.includes("versace")) {
    if (fullText.includes("eros flame")) {
      return makeImg("fragrance-versace-eros-flame.webp", "Versace Eros Flame flame red Medusa flacon", "Versace");
    }
    if (fullText.includes("eros pour femme")) {
      return makeImg("fragrance-versace-eros-pour-femme.webp", "Versace Eros Pour Femme gold medallion Medusa flacon", "Versace");
    }
    if (fullText.includes("eau fraîche") || fullText.includes("eau fraiche") || fullText.includes("fraiche")) {
      return makeImg("fragrance-versace-man-eau-fraiche.webp", "Versace Man Eau Fraîche crystalline turquoise flacon", "Versace");
    }
    if (fullText.includes("crystal noir")) {
      return makeImg("fragrance-versace-crystal-noir.webp", "Versace Crystal Noir deep garnet faceted jewel flacon", "Versace");
    }
    if (fullText.includes("dylan purple")) {
      return makeImg("fragrance-versace-dylan-purple.webp", "Versace Dylan Purple purple gold amphora flacon", "Versace");
    }
    if (fullText.includes("dylan blue")) {
      return makeImg("fragrance-versace-dylan-blue.webp", "Versace Dylan Blue geometric Mediterranean gold Medusa flacon", "Versace");
    }
    if (fullText.includes("pour homme")) {
      return makeImg("fragrance-versace-pour-homme.webp", "Versace Pour Homme luminous crystal blue Medusa flacon", "Versace");
    }
    if (fullText.includes("bright crystal")) {
      return makeImg("fragrance-versace-bright-crystal.webp", "Versace Bright Crystal radiant jewel crystal faceted flacon", "Versace");
    }
    if (fullText.includes("eros eau de parfum") || fullText.includes("eros edp")) {
      return makeImg("fragrance-versace-eros-edp.webp", "Versace Eros Eau de Parfum intense turquoise Medusa flacon", "Versace");
    }
    if (fullText.includes("eros")) {
      return makeImg("fragrance-versace-eros.webp", "Versace Eros turquoise Greek fretwork Medusa flacon", "Versace");
    }
    return makeImg("fragrance-versace-eros.webp", `${product.name} luxury flacon`, "Versace");
  }

  // ==========================================
  // 16. PACO RABANNE
  // ==========================================
  if (brandLower.includes("rabanne") || fullText.includes("rabanne")) {
    if (fullText.includes("1 million elixir") || fullText.includes("million elixir")) {
      return makeImg("fragrance-rabanne-1-million-elixir.webp", "Paco Rabanne 1 Million Elixir intense gold ingot flacon", "Paco Rabanne");
    }
    if (fullText.includes("1 million royal") || fullText.includes("million royal")) {
      return makeImg("fragrance-rabanne-1-million-royal.webp", "Paco Rabanne 1 Million Royal ruby gem gold bar flacon", "Paco Rabanne");
    }
    if (fullText.includes("olympéa") || fullText.includes("olympea")) {
      return makeImg("fragrance-rabanne-olympea.webp", "Paco Rabanne Olympéa laurel wing triumph flacon", "Paco Rabanne");
    }
    if (fullText.includes("pure xs")) {
      return makeImg("fragrance-rabanne-pure-xs.webp", "Paco Rabanne Pure XS gradient blue lighter flacon", "Paco Rabanne");
    }
    if (fullText.includes("invictus victory")) {
      return makeImg("fragrance-rabanne-invictus-victory.webp", "Paco Rabanne Invictus Victory black trophy cup flacon", "Paco Rabanne");
    }
    if (fullText.includes("phantom parfum")) {
      return makeImg("fragrance-rabanne-phantom-parfum.webp", "Paco Rabanne Phantom Parfum matte black robot flacon", "Paco Rabanne");
    }
    if (fullText.includes("1 million") || fullText.includes("million")) {
      return makeImg("fragrance-rabanne-1-million.webp", "Paco Rabanne 1 Million gold ingot luxury flacon", "Paco Rabanne");
    }
    if (fullText.includes("invictus")) {
      return makeImg("fragrance-rabanne-invictus.webp", "Paco Rabanne Invictus champion trophy cup flacon", "Paco Rabanne");
    }
    if (fullText.includes("phantom")) {
      return makeImg("fragrance-rabanne-phantom.webp", "Paco Rabanne Phantom connected silver robot flacon", "Paco Rabanne");
    }
    if (fullText.includes("fame")) {
      return makeImg("fragrance-rabanne-fame.webp", "Paco Rabanne Fame chainmail couture dress robot flacon", "Paco Rabanne");
    }
    return makeImg("fragrance-rabanne-1-million.webp", `${product.name} luxury flacon`, "Paco Rabanne");
  }

  // ==========================================
  // 17. PRADA
  // ==========================================
  if (brandLower.includes("prada") || fullText.includes("prada")) {
    if (fullText.includes("amber pour homme") || fullText.includes("prada amber")) {
      return makeImg("fragrance-prada-amber-pour-homme.webp", "Prada Amber Pour Homme metal plaque flacon", "Prada");
    }
    if (fullText.includes("candy")) {
      return makeImg("fragrance-prada-candy.webp", "Prada Candy Eau de Parfum shock pink pump flacon", "Prada");
    }
    if (fullText.includes("luna rossa black")) {
      return makeImg("fragrance-prada-luna-rossa-black.webp", "Prada Luna Rossa Black matte obsidian flacon", "Prada");
    }
    if (fullText.includes("luna rossa carbon")) {
      return makeImg("fragrance-prada-luna-rossa-carbon.webp", "Prada Luna Rossa Carbon slate coal flacon", "Prada");
    }
    if (fullText.includes("luna rossa ocean")) {
      return makeImg("fragrance-prada-luna-rossa-ocean.webp", "Prada Luna Rossa Ocean deep ocean blue flacon", "Prada");
    }
    if ((fullText.includes("l'homme") || fullText.includes("lhomme")) && fullText.includes("intense")) {
      return makeImg("fragrance-prada-lhomme-intense.webp", "Prada L'Homme Intense black Saffiano clad flacon", "Prada");
    }
    if (fullText.includes("paradoxe intense")) {
      return makeImg("fragrance-prada-paradoxe-intense.webp", "Prada Paradoxe Intense black triangle flacon", "Prada");
    }
    if (fullText.includes("paradoxe")) {
      return makeImg("fragrance-prada-paradoxe.webp", "Prada Paradoxe triangular refillable logo flacon", "Prada");
    }
    if (fullText.includes("infusion d'iris") || fullText.includes("infusion")) {
      return makeImg("fragrance-prada-infusion-diris.webp", "Les Infusions de Prada vintage crest apothecary flacon", "Prada");
    }
    if (fullText.includes("l'homme prada") || fullText.includes("l'homme")) {
      return makeImg("fragrance-prada-lhomme.webp", "Prada L'Homme Saffiano leather clad architectural flacon", "Prada");
    }
    if (fullText.includes("luna rossa")) {
      return makeImg("fragrance-prada-luna-rossa.webp", "Prada Luna Rossa silver metallic racing red stripe flacon", "Prada");
    }
    return makeImg("fragrance-prada-luna-rossa.webp", `${product.name} luxury flacon`, "Prada");
  }

  // ==========================================
  // 18. SERGE LUTENS
  // ==========================================
  if (brandLower.includes("lutens") || fullText.includes("serge lutens")) {
    if (fullText.includes("la fille de berlin") || fullText.includes("fille de berlin")) {
      return makeImg("fragrance-serge-lutens-la-fille-de-berlin.webp", "Serge Lutens La Fille de Berlin metallic rose flacon", "Serge Lutens");
    }
    if (fullText.includes("santal majuscule")) {
      return makeImg("fragrance-serge-lutens-santal-majuscule.webp", "Serge Lutens Santal Majuscule sandalwood cocoa flacon", "Serge Lutens");
    }
    if (fullText.includes("fleurs d'oranger") || fullText.includes("fleurs doranger")) {
      return makeImg("fragrance-serge-lutens-fleurs-doranger.webp", "Serge Lutens Fleurs d'Oranger orange blossom flacon", "Serge Lutens");
    }
    if (fullText.includes("l'orpheline") || fullText.includes("lorpheline")) {
      return makeImg("fragrance-serge-lutens-lorpheline.webp", "Serge Lutens L'Orpheline ethereal incense flacon", "Serge Lutens");
    }
    if (fullText.includes("cuir mauresque")) {
      return makeImg("fragrance-serge-lutens-cuir-mauresque.webp", "Serge Lutens Cuir Mauresque Moorish leather flacon", "Serge Lutens");
    }
    if (fullText.includes("un bois vanille") || fullText.includes("bois vanille")) {
      return makeImg("fragrance-serge-lutens-un-bois-vanille.webp", "Serge Lutens Un Bois Vanille black vanilla flacon", "Serge Lutens");
    }
    if (fullText.includes("five o'clock") || fullText.includes("five oclock") || fullText.includes("gingembre")) {
      return makeImg("fragrance-serge-lutens-five-oclock.webp", "Serge Lutens Five O'Clock Au Gingembre candied ginger flacon", "Serge Lutens");
    }
    if (fullText.includes("ambre sultan")) {
      return makeImg("fragrance-serge-lutens-ambre-sultan.webp", "Serge Lutens Ambre Sultan amber Palais Royal flacon", "Serge Lutens");
    }
    if (fullText.includes("féminité du bois") || fullText.includes("feminite du bois")) {
      return makeImg("fragrance-serge-lutens-feminite-du-bois.webp", "Serge Lutens Féminité du Bois cedarwood plum flacon", "Serge Lutens");
    }
    if (fullText.includes("chergui")) {
      return makeImg("fragrance-serge-lutens-chergui.webp", "Serge Lutens Chergui desert wind tobacco amber flacon", "Serge Lutens");
    }
    return makeImg("fragrance-serge-lutens-chergui.webp", `${product.name} luxury flacon`, "Serge Lutens");
  }

  // ==========================================
  // 19. AMOUAGE
  // ==========================================
  if (brandLower.includes("amouage") || fullText.includes("amouage")) {
    if (fullText.includes("purpose")) {
      return makeImg("fragrance-amouage-purpose.webp", "Amouage Purpose earthy mineral frankincense flacon", "Amouage");
    }
    if (fullText.includes("lineage")) {
      return makeImg("fragrance-amouage-lineage.webp", "Amouage Lineage sea salt mineral coast flacon", "Amouage");
    }
    if (fullText.includes("reflection man") || fullText.includes("reflection")) {
      return makeImg("fragrance-amouage-reflection-man.webp", "Amouage Reflection Man polished silver royal dagger flacon", "Amouage");
    }
    if (fullText.includes("jubilation")) {
      return makeImg("fragrance-amouage-jubilation-xxv.webp", "Amouage Jubilation XXV royal Sultanate celebratory flacon", "Amouage");
    }
    if (fullText.includes("guidance")) {
      return makeImg("fragrance-amouage-guidance.webp", "Amouage Guidance blush pink Quentin Bisch masterpiece flacon", "Amouage");
    }
    if (fullText.includes("epic")) {
      return makeImg("fragrance-amouage-epic-man.webp", "Amouage Epic Man deep jade green imperial Silk Road flacon", "Amouage");
    }
    if (fullText.includes("honour")) {
      return makeImg("fragrance-amouage-honour-man.webp", "Amouage Honour Man pristine white Madame Butterfly flacon", "Amouage");
    }
    if (fullText.includes("dia")) {
      return makeImg("fragrance-amouage-dia-man.webp", "Amouage Dia Man smoky bronze Day of Oman flacon", "Amouage");
    }
    if (fullText.includes("gold")) {
      return makeImg("fragrance-amouage-gold-man.webp", "Amouage Gold Man opulent 24k gold Guy Robert classic flacon", "Amouage");
    }
    if (fullText.includes("enclave")) {
      return makeImg("fragrance-amouage-enclave.webp", "Amouage Enclave Musandam blue-green fjords flacon", "Amouage");
    }
    if (fullText.includes("royal tobacco")) {
      return makeImg("fragrance-amouage-royal-tobacco.webp", "Amouage Opus XIV Royal Tobacco Library Collection flacon", "Amouage");
    }
    if (fullText.includes("interlude")) {
      return makeImg("fragrance-amouage-interlude.webp", "Amouage Interlude Man royal blue sapphire crystal flacon", "Amouage");
    }
    return makeImg("fragrance-amouage-interlude.webp", `${product.name} luxury flacon`, "Amouage");
  }

  // ==========================================
  // 20. DOLCE & GABBANA
  // ==========================================
  if (
    brandLower.includes("dolce") ||
    brandLower.includes("gabbana") ||
    fullText.includes("dolce & gabbana") ||
    fullText.includes("dolce and gabbana")
  ) {
    if (fullText.includes("devotion")) {
      return makeImg("fragrance-dolce-gabbana-devotion.webp", "Dolce & Gabbana Devotion sacred heart golden flacon", "Dolce & Gabbana");
    }
    if (fullText.includes("q by") || fullText.includes("q eau de parfum") || fullText.includes("q ")) {
      return makeImg("fragrance-dolce-gabbana-q.webp", "Dolce & Gabbana Q royal crown cap cherry flacon", "Dolce & Gabbana");
    }
    if (fullText.includes("velvet desert oud")) {
      return makeImg("fragrance-dolce-gabbana-velvet-desert-oud.webp", "Dolce & Gabbana Velvet Desert Oud velvet plaque gold flacon", "Dolce & Gabbana");
    }
    if (fullText.includes("luminous night")) {
      return makeImg("fragrance-dolce-gabbana-luminous-night.webp", "Dolce & Gabbana The One Luminous Night deep cobalt flacon", "Dolce & Gabbana");
    }
    if (fullText.includes("the one for men") || (fullText.includes("the one") && fullText.includes("men"))) {
      return makeImg("fragrance-dolce-gabbana-the-one-men.webp", "Dolce & Gabbana The One for Men amber brown geometric flacon", "Dolce & Gabbana");
    }
    if (fullText.includes("the one")) {
      return makeImg("fragrance-dolce-gabbana-the-one.webp", "Dolce & Gabbana The One geometric warm amber brown flacon", "Dolce & Gabbana");
    }
    if (fullText.includes("k by") || fullText.includes(" k ")) {
      return makeImg("fragrance-dolce-gabbana-k.webp", "K by Dolce & Gabbana crowned royal blue flacon", "Dolce & Gabbana");
    }
    if (fullText.includes("light blue eau intense") || fullText.includes("light blue intense")) {
      return makeImg("fragrance-dolce-gabbana-light-blue-intense.webp", "Dolce & Gabbana Light Blue Eau Intense frosted Mediterranean flacon", "Dolce & Gabbana");
    }
    if (fullText.includes("light blue pour homme")) {
      return makeImg("fragrance-dolce-gabbana-light-blue-pour-homme.webp", "Dolce & Gabbana Light Blue Pour Homme azure frosted flacon", "Dolce & Gabbana");
    }
    if (fullText.includes("light blue")) {
      return makeImg("fragrance-dolce-gabbana-light-blue.webp", "Dolce & Gabbana Light Blue Capri frosted Mediterranean flacon", "Dolce & Gabbana");
    }
    return makeImg("fragrance-dolce-gabbana-light-blue.webp", `${product.name} luxury flacon`, "Dolce & Gabbana");
  }

  // ==========================================
  // 21. BVLGARI
  // ==========================================
  if (brandLower.includes("bvlgari") || brandLower.includes("bulgari") || fullText.includes("bvlgari") || fullText.includes("bulgari")) {
    if (fullText.includes("aqva amara") || fullText.includes("amara")) {
      return makeImg("fragrance-bvlgari-aqva-amara.webp", "Bvlgari Aqva Amara copper bronze metallic pebble flacon", "Bvlgari");
    }
    if (fullText.includes("aqva") || fullText.includes("aqua")) {
      return makeImg("fragrance-bvlgari-aqva-pour-homme.webp", "Bvlgari Aqva Pour Homme smooth oceanic pebble flacon", "Bvlgari");
    }
    if (fullText.includes("omnia")) {
      return makeImg("fragrance-bvlgari-omnia.webp", "Bvlgari Omnia Crystalline infinity loop jewel flacon", "Bvlgari");
    }
    if (fullText.includes("gyan")) {
      return makeImg("fragrance-bvlgari-le-gemme-gyan.webp", "Bvlgari Le Gemme Gyan dark obelisk sapphire flacon", "Bvlgari");
    }
    if (fullText.includes("tygar")) {
      return makeImg("fragrance-bvlgari-le-gemme-tygar.webp", "Bvlgari Le Gemme Tygar dark obelisk tiger-eye flacon", "Bvlgari");
    }
    if (fullText.includes("rain essence") || fullText.includes("rain")) {
      return makeImg("fragrance-bvlgari-man-rain-essence.webp", "Bvlgari Man Rain Essence silver crystalline flacon", "Bvlgari");
    }
    if (fullText.includes("wood essence") || fullText.includes("wood")) {
      return makeImg("fragrance-bvlgari-man-wood-essence.webp", "Bvlgari Man Wood Essence forest green brass flacon", "Bvlgari");
    }
    if (fullText.includes("pour homme")) {
      return makeImg("fragrance-bvlgari-pour-homme.webp", "Bvlgari Pour Homme classic architectural clear glass flacon", "Bvlgari");
    }
    if (fullText.includes("goldea")) {
      return makeImg("fragrance-bvlgari-goldea.webp", "Bvlgari Goldea The Roman Night midnight jewel flacon", "Bvlgari");
    }
    if (fullText.includes("man in black")) {
      return makeImg("fragrance-bvlgari-man-in-black.webp", "Bvlgari Man in Black volcanic matte black rose gold flacon", "Bvlgari");
    }
    return makeImg("fragrance-bvlgari-man-in-black.webp", "Bvlgari Man in Black volcanic matte black rose gold flacon", "Bvlgari");
  }

  // ==========================================
  // 22. MAISON MARGIELA (REPLICA)
  // ==========================================
  if (brandLower.includes("margiela") || fullText.includes("margiela") || fullText.includes("replica")) {
    if (fullText.includes("sailing day")) {
      return makeImg("fragrance-margiela-sailing-day.webp", "Maison Margiela Replica Sailing Day aquatic blue apothecary flacon", "Maison Margiela");
    }
    if (fullText.includes("lazy sunday morning")) {
      return makeImg("fragrance-margiela-lazy-sunday-morning.webp", "Maison Margiela Replica Lazy Sunday Morning white linen apothecary flacon", "Maison Margiela");
    }
    if (fullText.includes("coffee break")) {
      return makeImg("fragrance-margiela-coffee-break.webp", "Maison Margiela Replica Coffee Break warm roast apothecary flacon", "Maison Margiela");
    }
    if (fullText.includes("whispers in the library") || fullText.includes("whispers")) {
      return makeImg("fragrance-margiela-whispers-in-the-library.webp", "Maison Margiela Replica Whispers in the Library amber apothecary flacon", "Maison Margiela");
    }
    if (fullText.includes("under the lemon trees") || fullText.includes("lemon trees")) {
      return makeImg("fragrance-margiela-under-the-lemon-trees.webp", "Maison Margiela Replica Under the Lemon Trees citrus apothecary flacon", "Maison Margiela");
    }
    if (fullText.includes("autumn vibes")) {
      return makeImg("fragrance-margiela-autumn-vibes.webp", "Maison Margiela Replica Autumn Vibes cedar leaf apothecary flacon", "Maison Margiela");
    }
    if (fullText.includes("when the rain stops") || fullText.includes("rain stops")) {
      return makeImg("fragrance-margiela-when-the-rain-stops.webp", "Maison Margiela Replica When the Rain Stops luminous apothecary flacon", "Maison Margiela");
    }
    if (fullText.includes("by the fireplace") || fullText.includes("fireplace")) {
      return makeImg("fragrance-margiela-by-the-fireplace.webp", "Maison Margiela Replica By the Fireplace cotton label apothecary flacon", "Maison Margiela");
    }
    if (fullText.includes("beach walk")) {
      return makeImg("fragrance-margiela-beach-walk.webp", "Maison Margiela Replica Beach Walk luminous sand apothecary flacon", "Maison Margiela");
    }
    if (fullText.includes("jazz club")) {
      return makeImg("fragrance-margiela-jazz-club.webp", "Maison Margiela Replica Jazz Club Brooklyn cocktail amber flacon", "Maison Margiela");
    }
    return makeImg("fragrance-margiela-jazz-club.webp", `${product.name} luxury flacon`, "Maison Margiela");
  }

  return null;
}
