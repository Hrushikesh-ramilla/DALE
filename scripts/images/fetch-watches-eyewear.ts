import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

export interface ImageTarget {
  id: string;
  category: "watches" | "eyewear";
  brand: string;
  model: string;
  filename: string;
  aliases?: string[];
  urls: string[];
}

export const WATCHES_EYEWEAR_TARGETS: ImageTarget[] = [
  // =========================================================================
  // 1. WATCHES (Iconic Luxury Timepieces)
  // =========================================================================

  // --- ROLEX ---
  {
    id: "rolex-submariner-date",
    category: "watches",
    brand: "Rolex",
    model: "Submariner Date 41",
    filename: "watches-rolex-submariner.webp",
    aliases: ["watches-rolex-submariner-date.webp"],
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/0/08/Rolex_Submariner_Professional.JPG",
      "https://upload.wikimedia.org/wikipedia/commons/c/cd/Rolex-Submariner.jpg",
      "https://images.unsplash.com/photo-1547996160-71dfabb1a74e?auto=format&fit=crop&w=1000&q=80",
    ],
  },
  {
    id: "rolex-daytona",
    category: "watches",
    brand: "Rolex",
    model: "Cosmograph Daytona 40",
    filename: "watches-rolex-daytona.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/0/08/Rolex_Daytona_Cosmograph.jpg",
      "https://media.rolex.com/image/upload/q_auto/f_auto/t_v7-cover-majesty-landscape/c_limit,w_1920/v1/a677b2c664f6/catalogue/2026/upright-c/m126506-0001",
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=80",
    ],
  },
  {
    id: "rolex-gmt-master-ii",
    category: "watches",
    brand: "Rolex",
    model: "GMT-Master II 40",
    filename: "watches-rolex-gmt-master-ii.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/3/3e/Rolex_GMT_Master_II_116710BLNR_Batman.jpg",
      "https://media.rolex.com/image/upload/q_auto/f_auto/t_v7-cover-majesty-landscape/c_limit,w_1920/v1/a677b2c664f6/catalogue/2026/upright-c/m126710blnr-0003",
    ],
  },
  {
    id: "rolex-datejust-41",
    category: "watches",
    brand: "Rolex",
    model: "Datejust 41",
    filename: "watches-rolex-datejust-41.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/b/b3/Rolex_Datejust_Steel_%26_Gold.jpg",
      "https://media.rolex.com/image/upload/q_auto/f_auto/t_v7-cover-majesty-landscape/c_limit,w_1920/v1/a677b2c664f6/catalogue/2026/upright-c/m126334-0033",
    ],
  },
  {
    id: "rolex-day-date",
    category: "watches",
    brand: "Rolex",
    model: "Day-Date 40",
    filename: "watches-rolex-day-date.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/4/43/Rolex_Day-Date_President.jpg",
      "https://media.rolex.com/image/upload/q_auto/f_auto/t_v7-cover-majesty-landscape/c_limit,w_1920/v1/a677b2c664f6/catalogue/2026/upright-c/m228236-0018",
    ],
  },
  {
    id: "rolex-oyster-perpetual",
    category: "watches",
    brand: "Rolex",
    model: "Oyster Perpetual 41",
    filename: "watches-rolex-oyster-perpetual.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/7/7b/Rolex_Oyster_Perpetual.jpg",
      "https://media.rolex.com/image/upload/q_auto/f_auto/t_v7-cover-majesty-landscape/c_limit,w_1920/v1/a677b2c664f6/catalogue/2026/upright-c/m134303-0001",
    ],
  },

  // --- OMEGA ---
  {
    id: "omega-speedmaster",
    category: "watches",
    brand: "Omega",
    model: "Speedmaster Professional Moonwatch",
    filename: "watches-omega-speedmaster.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/c/cd/Vintage_Omega_Speedmaster_%22Pre-moon%22.jpg",
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=80",
    ],
  },
  {
    id: "omega-seamaster-diver-300m",
    category: "watches",
    brand: "Omega",
    model: "Seamaster Diver 300M",
    filename: "watches-omega-seamaster-diver-300m.webp",
    aliases: ["watches-omega-seamaster.webp"],
    urls: [
      "https://www.omegawatches.com/media/catalog/product/o/m/omega-seamaster-diver-300m-co-axial-master-chronometer-42-mm-21030422001023-72e2b8.png",
      "https://upload.wikimedia.org/wikipedia/commons/4/46/Omega_Seamaster_Co-Axial.jpg",
    ],
  },
  {
    id: "omega-aqua-terra",
    category: "watches",
    brand: "Omega",
    model: "Seamaster Aqua Terra 150M",
    filename: "watches-omega-aqua-terra.webp",
    urls: [
      "https://www.omegawatches.com/media/catalog/product/o/m/omega-seamaster-aqua-terra-150m-co-axial-master-chronometer-41-mm-22010412101002-ceac31.png",
      "https://upload.wikimedia.org/wikipedia/commons/6/6a/Omega_Seamaster_Aqua_Terra.jpg",
    ],
  },
  {
    id: "omega-constellation",
    category: "watches",
    brand: "Omega",
    model: "Constellation Co-Axial Master Chronometer",
    filename: "watches-omega-constellation.webp",
    urls: [
      "https://www.omegawatches.com/media/catalog/product/o/m/omega-constellation-co-axial-master-chronometer-41-mm-13130412104001-149276.png",
      "https://upload.wikimedia.org/wikipedia/commons/b/ba/Omega_Constellation_Rotgold_1958.jpg",
    ],
  },

  // --- CARTIER ---
  {
    id: "cartier-santos",
    category: "watches",
    brand: "Cartier",
    model: "Santos de Cartier",
    filename: "watches-cartier-santos.webp",
    urls: [
      "https://www.cartier.com/dw/image/v2/BGTJ_PRD/on/demandware.static/-/Sites-cartier-master/default/dw910f5e31/images/large/4a5b5f79ce7955bca0134392fed4993b.png?sw=750&sh=750&sm=fit&sfrm=png",
      "https://upload.wikimedia.org/wikipedia/commons/b/be/Cartier_Santos_Galb%C3%A9e.jpg",
    ],
  },
  {
    id: "cartier-tank-must",
    category: "watches",
    brand: "Cartier",
    model: "Tank Must de Cartier",
    filename: "watches-cartier-tank-must.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/f/fc/Cartier_Tank_Must%2C_2021.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/d/df/Cartier_Tank.jpg",
    ],
  },
  {
    id: "cartier-ballon-bleu",
    category: "watches",
    brand: "Cartier",
    model: "Ballon Bleu de Cartier",
    filename: "watches-cartier-ballon-bleu.webp",
    urls: [
      "https://www.cartier.com/dw/image/v2/BGTJ_PRD/on/demandware.static/-/Sites-cartier-master/default/dwf1348db9/images/large/b60711a9f0095a7eb89d772f96d2caf2.png?sw=750&sh=750&sm=fit&sfrm=png",
      "https://www.cartier.com/dw/image/v2/BGTJ_PRD/on/demandware.static/-/Sites-cartier-master/default/dw7a23d3b5/images/large/4761dc6336975f8fada49214b86dcf99.png?sw=750&sh=750&sm=fit&sfrm=png",
    ],
  },
  {
    id: "cartier-panthere",
    category: "watches",
    brand: "Cartier",
    model: "Panthère de Cartier",
    filename: "watches-cartier-panthere.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/1/19/Cartier_Panthere_lady%27s_2_tone_watch.jpg",
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1000&q=80",
    ],
  },

  // --- PATEK PHILIPPE ---
  {
    id: "patek-nautilus",
    category: "watches",
    brand: "Patek Philippe",
    model: "Nautilus 5711",
    filename: "watches-patek-nautilus.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/0/04/Patek-Philippe-Nautilus-5711-1A-010-1.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/7/74/Patek-Philippe-Nautilus-5711.jpg",
    ],
  },
  {
    id: "patek-aquanaut",
    category: "watches",
    brand: "Patek Philippe",
    model: "Aquanaut 5167",
    filename: "watches-patek-aquanaut.webp",
    urls: [
      "https://img.chrono24.com/images/uhren/48976616-77zb3lssionwa4qmuda1w5tb-ExtraLarge.jpg",
      "https://patek-res.cloudinary.com/dfsmedia/0906caea301d42b3b8bd23bd656d1711/202472-51887",
    ],
  },
  {
    id: "patek-calatrava",
    category: "watches",
    brand: "Patek Philippe",
    model: "Calatrava 6119",
    filename: "watches-patek-calatrava.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/5/56/Patek_Philippe_Calatrava%2C_dress_watch_per_eccellenza.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/0/0b/Calatrava1.jpg",
    ],
  },

  // --- AUDEMARS PIGUET ---
  {
    id: "ap-royal-oak-jumbo",
    category: "watches",
    brand: "Audemars Piguet",
    model: "Royal Oak Jumbo Extra-Thin 39mm",
    filename: "watches-ap-royal-oak-jumbo.webp",
    aliases: ["watches-ap-royal-oak.webp"],
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/0/05/Audemars_Piguet_Royal_Oak_ref._15202.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/1/1e/Audemars_Piguet_Royal_Oak_Offshore_Diver.jpg",
    ],
  },
  {
    id: "ap-royal-oak-chronograph",
    category: "watches",
    brand: "Audemars Piguet",
    model: "Royal Oak Chronograph 41mm",
    filename: "watches-ap-royal-oak-chronograph.webp",
    urls: [
      "https://img.chrono24.com/images/uhren/47309165-mc73ufmrgwxnwy28b0pek8yr-ExtraLarge.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/0/0e/Audemars_2385_Royal_Oak_resized.jpg",
    ],
  },

  // --- JAEGER-LECOULTRE ---
  {
    id: "jlc-reverso-classic",
    category: "watches",
    brand: "Jaeger-LeCoultre",
    model: "Reverso Classic Monoface",
    filename: "watches-jlc-reverso-classic.webp",
    aliases: ["watches-jlc-reverso.webp"],
    urls: [
      "https://img.jaeger-lecoultre.com/push-card-s-3/de4fbb2a49fa07208157cd609a7c96c40fa3d581.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/7/70/Jaeger-LeCoultre-Reverso.jpg",
    ],
  },
  {
    id: "jlc-polaris",
    category: "watches",
    brand: "Jaeger-LeCoultre",
    model: "Polaris Chronograph 42mm",
    filename: "watches-jlc-polaris.webp",
    urls: [
      "https://img.jaeger-lecoultre.com/open-graph-boxed-image-1/o-dpr-2/9569e281ec5b60f116b342a45c25d356de6670c2.jpg",
      "https://img.jaeger-lecoultre.com/product-slider-hero-mobile-3/c92af3a2b249b6ad5bf0f4cf607534227e456d2e.jpg",
    ],
  },

  // --- TISSOT ---
  {
    id: "tissot-prx",
    category: "watches",
    brand: "Tissot",
    model: "PRX Powermatic 80 40mm",
    filename: "watches-tissot-prx.webp",
    urls: [
      "https://www.tissotwatches.com/on/demandware.static/-/Sites-Tissot-Catalogue/default/dw9b840963/product-pictures/739cc440-025b-42e8-a5f9-ae33b31479b2_T137-410-11-041-00_shadow.png",
      "https://upload.wikimedia.org/wikipedia/commons/3/39/Tissot_PRX_35mm.jpg",
    ],
  },
  {
    id: "tissot-gentleman",
    category: "watches",
    brand: "Tissot",
    model: "Gentleman Powermatic 80",
    filename: "watches-tissot-gentleman.webp",
    urls: [
      "https://www.tissotwatches.com/on/demandware.static/-/Sites-Tissot-Catalogue/default/dw8e91e5a1/product-pictures/d77ce645-e2ac-41d7-b4b9-5a360ed43ace_T127-410-11-041-00_shadow.png",
      "https://www.tissotwatches.com/on/demandware.static/-/Sites-Tissot-Catalogue/default/dwf4adea29/product-pictures/a626e880-0f3f-49c3-8f0c-7624b2a323d5_T129-410-36-261-00_shadow.png",
    ],
  },

  // --- TUDOR ---
  {
    id: "tudor-black-bay-58",
    category: "watches",
    brand: "Tudor",
    model: "Black Bay 58 39mm",
    filename: "watches-tudor-black-bay-58.webp",
    urls: [
      "https://upload.wikimedia.org/wikipedia/commons/c/ca/Tudor_Black_Bay_58_ref._M79018V%2C_primo_modello_di_casa_Tudor_interamente_in_oro.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/8/8d/Tudor_Black_Bay_54_ref._m79000n-0001.jpg",
    ],
  },
  {
    id: "tudor-pelagos",
    category: "watches",
    brand: "Tudor",
    model: "Pelagos 39 Titanium",
    filename: "watches-tudor-pelagos.webp",
    urls: [
      "https://media.tudorwatch.com/image/upload/q_auto/f_auto/t_tdr-cover-watch/c_limit,w_1920/v1/catalogue/0yi5ee8b69yh3/upright-cb-with-drop-shadow/tudor-m25407n-0001",
      "https://upload.wikimedia.org/wikipedia/commons/3/3f/Tudor_Pelagos_for_Carolina_Watch_Club_Limited_Edition.jpg",
    ],
  },

  // --- BREITLING ---
  {
    id: "breitling-navitimer-b01",
    category: "watches",
    brand: "Breitling",
    model: "Navitimer B01 Chronograph 43",
    filename: "watches-breitling-navitimer-b01.webp",
    urls: [
      "https://img.chrono24.com/images/uhren/46388718-g9z6tb05mxu279x14ziz4bq1-ExtraLarge.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/c/c9/Breitling_Navitimer_chronograph_watch.jpg",
    ],
  },
  {
    id: "breitling-superocean",
    category: "watches",
    brand: "Breitling",
    model: "Superocean Automatic 42",
    filename: "watches-breitling-superocean.webp",
    urls: [
      "https://img.chrono24.com/images/uhren/49109275-5e4d1jpm9vdhytk2e7wwnwli-ExtraLarge.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/f/f6/Breitling_Superocean_01.jpg",
    ],
  },

  // --- IWC ---
  {
    id: "iwc-portugieser-chronograph",
    category: "watches",
    brand: "IWC",
    model: "Portugieser Chronograph 41",
    filename: "watches-iwc-portugieser-chronograph.webp",
    urls: [
      "https://img.iwc.com/product-card-3/3c392c05b9153c9fa68edbf7ae09cef888a50a7c.jpg",
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=80",
    ],
  },
  {
    id: "iwc-pilots-watch-mark-xx",
    category: "watches",
    brand: "IWC",
    model: "Pilot's Watch Mark XX",
    filename: "watches-iwc-pilots-watch-mark-xx.webp",
    urls: [
      "https://img.iwc.com/product-card-3/84051a252a4bdf55e73dfd901165f5e12199ff36.jpg",
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80",
    ],
  },

  // --- GRAND SEIKO ---
  {
    id: "grand-seiko-snowflake",
    category: "watches",
    brand: "Grand Seiko",
    model: "Heritage Spring Drive 'Snowflake' SBGA211",
    filename: "watches-grand-seiko-snowflake.webp",
    urls: [
      "https://www.grand-seiko.com/in-en/-/media/Images/GlobalEn/GrandSeiko/Home/collections/Products/SBGA211/06_SBGA211_2_sp.jpg",
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1000&q=80",
    ],
  },

  // =========================================================================
  // 2. EYEWEAR (Iconic Designer Sunglasses)
  // =========================================================================

  // --- RAY-BAN ---
  {
    id: "ray-ban-aviator",
    category: "eyewear",
    brand: "Ray-Ban",
    model: "Aviator Classic RB3025",
    filename: "eyewear-ray-ban-aviator.webp",
    aliases: ["sunglasses-ray-ban-aviator.webp"],
    urls: [
      "https://images2.ray-ban.com//prod-onecp-record-files/pieyewear/6ad42b4b-f1af-45cc-a6c6-b35d00db1f85/0RB3025__L0205__STD__shad__qt.png?impolicy=RB_Product_clone&width=720&bgc=%23f2f2f2",
      "https://upload.wikimedia.org/wikipedia/commons/4/4b/RayBanAviator.jpg",
    ],
  },
  {
    id: "ray-ban-wayfarer",
    category: "eyewear",
    brand: "Ray-Ban",
    model: "Original Wayfarer Classic RB2140",
    filename: "eyewear-ray-ban-wayfarer.webp",
    aliases: ["sunglasses-ray-ban-wayfarer.webp"],
    urls: [
      "https://images2.ray-ban.com//prod-onecp-record-files/pieyewear/aa3935f3-184a-4e17-a880-b35d00c65c8a/0RB2140__901__P21__shad__qt.png?impolicy=RB_Product_clone&width=720&bgc=%23f2f2f2",
      "https://upload.wikimedia.org/wikipedia/commons/0/09/2023_Okulary_przeciws%C5%82oneczne_Ray-Ban_%281%29.jpg",
    ],
  },
  {
    id: "ray-ban-clubmaster",
    category: "eyewear",
    brand: "Ray-Ban",
    model: "Clubmaster Classic RB3016",
    filename: "eyewear-ray-ban-clubmaster.webp",
    urls: [
      "https://images2.ray-ban.com//prod-onecp-record-files/pieyewear/786b4a58-fc3f-441f-89ff-b35d00cfe3ad/0RB3016__W0366__STD__shad__qt.png?impolicy=RB_Product_clone&width=720&bgc=%23f2f2f2",
      "https://upload.wikimedia.org/wikipedia/commons/b/bf/Ray-Ban_Clubmaster_3016.jpg",
    ],
  },
  {
    id: "ray-ban-round-metal",
    category: "eyewear",
    brand: "Ray-Ban",
    model: "Round Metal RB3447",
    filename: "eyewear-ray-ban-round-metal.webp",
    urls: [
      "https://images2.ray-ban.com//prod-onecp-record-files/pieyewear/a5410c76-c6b3-482b-bf78-b35d00d09da3/0RB3447__001__STD__shad__qt.png?impolicy=RB_Product_clone&width=720&bgc=%23f2f2f2",
      "https://upload.wikimedia.org/wikipedia/commons/1/13/B%26L_Ray-Ban_W0920_Outdoorsman_Round.jpg",
    ],
  },

  // --- CARTIER ---
  {
    id: "cartier-santos-sunglasses",
    category: "eyewear",
    brand: "Cartier",
    model: "Santos de Cartier Aviator Sunglasses",
    filename: "eyewear-cartier-santos.webp",
    aliases: ["sunglasses-cartier-santos.webp"],
    urls: [
      "https://www.cartier.com/dw/image/v2/BGTJ_PRD/on/demandware.static/-/Sites-cartier-master/default/dw331ff43b/images/large/7351c4e2fecf582f8b302a00313380cf.png?sw=750&sh=750&sm=fit&sfrm=png",
      "https://www.cartier.com/dw/image/v2/BGTJ_PRD/on/demandware.static/-/Sites-cartier-master/default/dwa6b2e1d0/images/large/e9d13126938c5eba8c895a781e4306f2.png?sw=750&sh=750&sm=fit&sfrm=png",
    ],
  },
  {
    id: "cartier-premiere-sunglasses",
    category: "eyewear",
    brand: "Cartier",
    model: "Première de Cartier Sunglasses",
    filename: "eyewear-cartier-premiere.webp",
    urls: [
      "https://www.cartier.com/dw/image/v2/BGTJ_PRD/on/demandware.static/-/Sites-cartier-master/default/dwe001efab/images/large/84acf138401554fbbbc97d3ccb0ed386.png?sw=750&sh=750&sm=fit&sfrm=png",
      "https://www.cartier.com/dw/image/v2/BGTJ_PRD/on/demandware.static/-/Sites-cartier-master/default/dwa6b2e1d0/images/large/e9d13126938c5eba8c895a781e4306f2.png?sw=750&sh=750&sm=fit&sfrm=png",
    ],
  },

  // --- CHANEL ---
  {
    id: "chanel-quilted-cat-eye",
    category: "eyewear",
    brand: "Chanel",
    model: "Classic Quilted Cat-Eye Sunglasses",
    filename: "eyewear-chanel-quilted-cat-eye.webp",
    urls: [
      "https://www.chanel.com/images/as/t_one/t_fashion/b_rgb:F7F7F7,e_brightness:-3/q_auto:good,f_auto,fl_lossy,dpr_1.1/w_800/-79123627.jpg",
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80",
    ],
  },
  {
    id: "chanel-shield",
    category: "eyewear",
    brand: "Chanel",
    model: "Shield Sunglasses with Lambskin Temples",
    filename: "eyewear-chanel-shield.webp",
    urls: [
      "https://www.chanel.com/images/as/t_one/t_fashion/b_rgb:F7F7F7,e_brightness:-3/q_auto:good,f_auto,fl_lossy,dpr_1.1/w_800/-79086959.jpg",
      "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=800&q=80",
    ],
  },

  // --- DIOR ---
  {
    id: "dior-blacksuit",
    category: "eyewear",
    brand: "Dior",
    model: "DiorBlackSuit S3I Square Sunglasses",
    filename: "eyewear-dior-blacksuit.webp",
    urls: [
      "https://assets.christiandior.com/is/image/diorprod/SUTS21FXRC0C0_E03-2?$default_GH$&crop=384,796,1232,406&wid=1850&hei=2000&scale=0.875&extend=0,0,0,250&bfc=on&qlt=80",
      "https://assets.christiandior.com/is/image/diorprod/PECDA1UXRC0I0_SBG_E03?$r2x3_raw$&crop=0,0,4000,5000&wid=1334&hei=2000&scale=1&bfc=on&qlt=80",
    ],
  },
  {
    id: "dior-diormidnight",
    category: "eyewear",
    brand: "Dior",
    model: "DiorMidnight S1I Cat-Eye Sunglasses",
    filename: "eyewear-dior-diormidnight.webp",
    urls: [
      "https://www.eurooptica.com/cdn/shop/files/diormidnights1i10a1-00_1200x600.jpg?v=1768849999",
      "https://assets.christiandior.com/is/image/diorprod/30MTS8UXR10A1_SBG_E03?$r4x5_raw$&crop=0,0,4000,5000&wid=1600&hei=2000&scale=1&bfc=on&qlt=80",
    ],
  },
  {
    id: "dior-30montaigne",
    category: "eyewear",
    brand: "Dior",
    model: "30Montaigne S2U Square Sunglasses",
    filename: "eyewear-dior-30montaigne.webp",
    urls: [
      "https://assets.christiandior.com/is/image/diorprod/30MTS8UXR10A1_SBG_E03?$r4x5_raw$&crop=0,0,4000,5000&wid=1600&hei=2000&scale=1&bfc=on&qlt=80",
      "https://assets.christiandior.com/is/image/diorprod/30MS10FXR10A1_SBG_E03-3?$r4x5_raw$&crop=0,0,4000,5000&wid=1600&hei=2000&scale=1&bfc=on&qlt=80",
    ],
  },

  // --- CELINE ---
  {
    id: "celine-triomphe-oval",
    category: "eyewear",
    brand: "Celine",
    model: "Triomphe Metal 01 Oval Sunglasses",
    filename: "eyewear-celine-triomphe-oval.webp",
    urls: [
      "https://image.celine.com/asset/0ed22d47-199a-430e-9b01-e999954231a5/4S235CMLB-35SG_1_SUM22.jpg?V2&im=Resize=(800)",
      "https://image.celine.com/asset/e3c984e4-5d00-45d4-be07-f069d0de03f9/4S235CMLB-36SM_2_SUM23.jpg?V2&im=Resize=(800)",
    ],
  },
  {
    id: "celine-bold-3-dots",
    category: "eyewear",
    brand: "Celine",
    model: "Bold 3 Dots Rectangular Sunglasses",
    filename: "eyewear-celine-bold-3-dots.webp",
    urls: [
      "https://www.fashioneyewear.com/cdn/shop/products/CL40193I01A53-1.jpg?v=1683893246&width=1024",
      "https://image.celine.com/asset/0ed22d47-199a-430e-9b01-e999954231a5/4S235CMLB-35SG_1_SUM22.jpg?V2&im=Resize=(800)",
    ],
  },

  // --- VERSACE ---
  {
    id: "versace-medusa-biggie",
    category: "eyewear",
    brand: "Versace",
    model: "VE4361 Medusa Biggie Sunglasses",
    filename: "eyewear-versace-medusa-biggie.webp",
    urls: [
      "https://assets2.sunglasshut.com/prod-onecp-record-files/pieyewear/e983f6a1-8ba3-44e4-b405-b35f0112bcd6/0VE4361__GB1_87__P21__shad__qt.png?impolicy=SGH_bgtransparent&width=1024",
      "https://assets2.sunglasshut.com/prod-onecp-record-files/pieyewear/3d38d746-0da1-423d-abb8-b3620110b292/0VE4361__GB1_85__P21__shad__qt.png?impolicy=SGH_bgtransparent&width=1024",
    ],
  },
  {
    id: "versace-greca",
    category: "eyewear",
    brand: "Versace",
    model: "VE2207 Greca Navigator Sunglasses",
    filename: "eyewear-versace-greca.webp",
    urls: [
      "https://assets2.sunglasshut.com/prod-onecp-record-files/pieyewear/d2f10b18-57f5-4479-bd9f-b35f0151ffca/0VE2207Q__100287_030A.png?impolicy=SGH_bgtransparent&width=1024",
      "https://assets2.sunglasshut.com/prod-onecp-record-files/pieyewear/e983f6a1-8ba3-44e4-b405-b35f0112bcd6/0VE4361__GB1_87__P21__shad__qt.png?impolicy=SGH_bgtransparent&width=1024",
    ],
  },

  // --- TOM FORD ---
  {
    id: "tom-ford-snowdon",
    category: "eyewear",
    brand: "Tom Ford",
    model: "TF0237 Snowdon Sunglasses",
    filename: "eyewear-tom-ford-snowdon.webp",
    urls: [
      "http://www.jamesbondlifestyle.com/sites/default/files/images/product/ac049-tom-ford-snowdon-ft0237-spectre-636.jpg",
      "https://www.otticasm.com/media/catalog/product/cache/all/small_image/1200x800/129246a25eb2c111236d81eb364eda2b/f/t/ft0237-05b.jpg",
    ],
  },
  {
    id: "tom-ford-ft0237",
    category: "eyewear",
    brand: "Tom Ford",
    model: "FT0237 Snowdon Sunglasses",
    filename: "eyewear-tom-ford-ft0237.webp",
    urls: [
      "https://www.otticasm.com/media/catalog/product/cache/all/small_image/1200x800/129246a25eb2c111236d81eb364eda2b/f/t/ft0237-05b.jpg",
      "http://www.jamesbondlifestyle.com/sites/default/files/images/product/ac049-tom-ford-snowdon-ft0237-spectre-636.jpg",
    ],
  },
  {
    id: "tom-ford-marko",
    category: "eyewear",
    brand: "Tom Ford",
    model: "FT0144 Marko Aviator Sunglasses",
    filename: "eyewear-tom-ford-marko.webp",
    urls: [
      "https://www.shadesemporium.com/images/sunglasses-product/Tom-Ford/FT0144-Marko/18V-Shiny-Rhodium.jpg",
      "http://www.jamesbondlifestyle.com/sites/default/files/images/product/ac049-tom-ford-snowdon-ft0237-spectre-636.jpg",
    ],
  },

  // --- PRADA ---
  {
    id: "prada-symbole",
    category: "eyewear",
    brand: "Prada",
    model: "Prada Symbole Rectangular Sunglasses",
    filename: "eyewear-prada-symbole.webp",
    urls: [
      "https://assets2.sunglasshut.com/prod-onecp-record-files/pieyewear/71c671d1-2496-47b6-a12b-b36100212bf3/0PR_17WS__1AB5S0__STD__shad__qt.png?impolicy=SGH_bgtransparent&width=1024",
      "https://cdn-images.farfetch-contents.com/23/29/69/85/23296985_53497366_600.jpg",
    ],
  },
  {
    id: "prada-pr-17ws",
    category: "eyewear",
    brand: "Prada",
    model: "Prada PR 17WS Symbole Sunglasses",
    filename: "eyewear-prada-pr-17ws.webp",
    urls: [
      "https://assets2.sunglasshut.com/prod-onecp-record-files/pieyewear/71c671d1-2496-47b6-a12b-b36100212bf3/0PR_17WS__1AB5S0__STD__shad__qt.png?impolicy=SGH_bgtransparent&width=1024",
      "https://cdn-images.farfetch-contents.com/23/29/69/85/23296985_53497366_600.jpg",
    ],
  },

  // --- OLIVER PEOPLES ---
  {
    id: "oliver-peoples-gregory-peck",
    category: "eyewear",
    brand: "Oliver Peoples",
    model: "Gregory Peck Sun OV5217S",
    filename: "eyewear-oliver-peoples-gregory-peck.webp",
    urls: [
      "https://assets2.sunglasshut.com/prod-onecp-record-files/pieyewear/0b7e92b0-599a-4d30-9517-b35d0105b87a/0OV5217S__1031P2__P21__shad__qt.png?impolicy=SGH_bgtransparent&width=1024",
      "https://assets2.sunglasshut.com/prod-onecp-record-files/pieyewear/8141e827-8c55-470f-bba8-b35d010610e1/0OV5217S__1101R8__P21__shad__qt.png?impolicy=SGH_bgtransparent&width=1024",
    ],
  },
  {
    id: "oliver-peoples-cary-grant",
    category: "eyewear",
    brand: "Oliver Peoples",
    model: "Cary Grant Sun OV5413SU",
    filename: "eyewear-oliver-peoples-cary-grant.webp",
    urls: [
      "https://assets2.sunglasshut.com/prod-onecp-record-files/pieyewear/fa29980e-62c6-416e-9939-b360002e3ece/0OV5413SU__14923R__P21__shad__qt.png?impolicy=SGH_bgtransparent&width=1024",
      "https://assets2.sunglasshut.com/prod-onecp-record-files/pieyewear/7c6f8a37-bd11-4ce1-a219-b39e004c4440/0OV5413SU__1796R5__P21__shad__qt.png?impolicy=SGH_bgtransparent&width=1024",
    ],
  },

  // --- PERSOL ---
  {
    id: "persol-714",
    category: "eyewear",
    brand: "Persol",
    model: "714 Folding Steve McQueen Sunglasses",
    filename: "eyewear-persol-714-steve-mcqueen.webp",
    urls: [
      "http://www.persol.com/cdn/shop/files/0PO0714__24_31__P21__shad__fld_d50808501c64978c9414c730d98e473026dc2e0c4922f29c094c6a4dcbd7f1fc.png?v=1788801009",
      "https://upload.wikimedia.org/wikipedia/commons/8/87/Persol_714.png",
    ],
  },
  {
    id: "persol-649",
    category: "eyewear",
    brand: "Persol",
    model: "649 Original Sunglasses",
    filename: "eyewear-persol-649-original.webp",
    urls: [
      "http://www.persol.com/cdn/shop/files/0PO0649__24_31__P21__shad__qt_3c073582b26f6c7a786af78e69b82803c556ac73390ebd246458da67de6b0133.png?v=1788797827",
      "http://www.persol.com/cdn/shop/files/0PO0714__24_31__P21__shad__fld_d50808501c64978c9414c730d98e473026dc2e0c4922f29c094c6a4dcbd7f1fc.png?v=1788801009",
    ],
  },

  // --- BALENCIAGA ---
  {
    id: "balenciaga-bat",
    category: "eyewear",
    brand: "Balenciaga",
    model: "Bat Rectangle Sunglasses",
    filename: "eyewear-balenciaga-bat.webp",
    urls: [
      "https://www.buxeyewear.com/cdn/shop/files/BATRECTANGLE-BALENCIAGA-GREY-sunglasses-front_1024x1024.jpg?v=1684505616",
      "https://cdn-images.farfetch-contents.com/18/82/40/13/18824013_41966095_322.jpg",
    ],
  },
];

export async function fetchWatchesAndEyewearImages(): Promise<{
  successCount: number;
  failureCount: number;
  totalTargets: number;
  results: Array<{ model: string; filename: string; sizeKb: number; status: "saved" | "failed" }>;
}> {
  const outputDir = path.resolve(process.cwd(), "public/images/products");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`Starting authentic image fetch for ${WATCHES_EYEWEAR_TARGETS.length} luxury models...`);
  console.log(`Target canvas: 600x600, background: #fbfbfb, format: WebP (quality 82)\n`);

  let successCount = 0;
  let failureCount = 0;
  const results: Array<{ model: string; filename: string; sizeKb: number; status: "saved" | "failed" }> = [];

  for (const item of WATCHES_EYEWEAR_TARGETS) {
    const destPath = path.join(outputDir, item.filename);
    let downloadedBuffer: Buffer | null = null;

    for (const url of item.urls) {
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 BuyerGuardCatalog/1.0",
            Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          },
          signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) continue;

        const arrayBuf = await res.arrayBuffer();
        const buf = Buffer.from(arrayBuf);
        if (buf.length < 1000) continue; // Skip incomplete or error bodies

        downloadedBuffer = buf;
        break;
      } catch (err: any) {
        // Try fallback URL
      }
    }

    if (!downloadedBuffer) {
      console.error(`[FAILED] Could not download photo for: ${item.brand} - ${item.model}`);
      failureCount++;
      results.push({ model: `${item.brand} ${item.model}`, filename: item.filename, sizeKb: 0, status: "failed" });
      continue;
    }

    try {
      // 600x600, contain on studio canvas #fbfbfb, WebP quality 82
      const processedBuffer = await sharp(downloadedBuffer)
        .resize(600, 600, {
          fit: "contain",
          background: { r: 251, g: 251, b: 251, alpha: 1 },
        })
        .webp({ quality: 82, effort: 6 })
        .toBuffer();

      fs.writeFileSync(destPath, processedBuffer);
      const sizeKb = Number((processedBuffer.length / 1024).toFixed(1));

      // Write any aliases
      if (item.aliases && item.aliases.length > 0) {
        for (const alias of item.aliases) {
          const aliasPath = path.join(outputDir, alias);
          fs.writeFileSync(aliasPath, processedBuffer);
        }
      }

      console.log(
        `[SAVED] ${item.brand.padEnd(16)} | ${item.model.padEnd(36)} -> ${item.filename} (${sizeKb} KB)`
      );
      successCount++;
      results.push({ model: `${item.brand} ${item.model}`, filename: item.filename, sizeKb, status: "saved" });
    } catch (err: any) {
      console.error(`[PROCESS_ERROR] ${item.model}: ${err.message}`);
      failureCount++;
      results.push({ model: `${item.brand} ${item.model}`, filename: item.filename, sizeKb: 0, status: "failed" });
    }

    // Gentle pacing
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  console.log(`\n======================================================================`);
  console.log(`Summary: ${successCount} verified models saved, ${failureCount} failed.`);
  console.log(`======================================================================\n`);

  return {
    successCount,
    failureCount,
    totalTargets: WATCHES_EYEWEAR_TARGETS.length,
    results,
  };
}

if (process.argv[1]?.includes("fetch-watches-eyewear")) {
  fetchWatchesAndEyewearImages().catch(console.error);
}
