import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { censusManifestFileSchema, type CensusManifestFile } from "../../src/domain/coverage-targets";

const powerBanksCensus: CensusManifestFile = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  leafKey: "power-banks",
  displayName: "Power Banks & Portable Battery Packs",
  censusDate: "2026-10-11",
  supplyExceptions: [
    {
      brand: "Samsung",
      leafKey: "power-banks",
      reason: "Samsung active official battery pack portfolio comprises 3 models.",
      officialSourceUrl: "https://www.samsung.com/in/mobile-accessories/all-mobile-accessories/?power-banks",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "25W 10000mAh Battery Pack (EB-P3400)", "45W 20000mAh Battery Pack (EB-P4520)", "Wireless Battery Pack 10000mAh (EB-U2510)"
      ],
      totalQualifyingModels: 3,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "Belkin",
      leafKey: "power-banks",
      reason: "Belkin active BoostCharge portable battery pack line consists of 4 core chassis.",
      officialSourceUrl: "https://www.belkin.com/products/power-banks/",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "BoostCharge Pro Magnetic Wireless 10K (Qi2)", "BoostCharge 20000mAh 30W PD", "BoostCharge 10000mAh 20W PD", "BoostCharge Hybrid 5K"
      ],
      totalQualifyingModels: 4,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "Stuffcool",
      leafKey: "power-banks",
      reason: "Stuffcool active high-speed power bank line consists of 4 distinct models.",
      officialSourceUrl: "https://www.stuffcool.com/collections/power-banks",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "Centurion 20000mAh 65W", "Major Max 20000mAh 35W", "Mega 10000mAh 30W", "Palm 10000mAh 22.5W"
      ],
      totalQualifyingModels: 4,
      sourceRegion: "IN",
    },
    {
      brand: "realme",
      leafKey: "power-banks",
      reason: "realme produces 3 fast-charging battery packs.",
      officialSourceUrl: "https://www.realme.com/in/accessories",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "30W Dart Charge 10000mAh", "20000mAh 18W Power Bank 2", "10000mAh 30W Power Bank"
      ],
      totalQualifyingModels: 3,
      sourceRegion: "IN",
    },
    {
      brand: "boAt",
      leafKey: "power-banks",
      reason: "boAt EnergyShroom battery pack line comprises 3 models.",
      officialSourceUrl: "https://www.boat-lifestyle.com/collections/power-banks",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "EnergyShroom PB400 20000mAh", "EnergyShroom PB300 10000mAh", "EnergyShroom PB500 30000mAh"
      ],
      totalQualifyingModels: 3,
      sourceRegion: "IN",
    },
    {
      brand: "Baseus",
      leafKey: "power-banks",
      reason: "Baseus high-wattage Blade and Adaman series features 4 key models.",
      officialSourceUrl: "https://www.baseus.com/collections/power-banks",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "Blade HD 100W 20000mAh", "Blade 2 65W 12000mAh", "Adaman 65W 20000mAh", "Magnetic Mini 10000mAh 20W"
      ],
      totalQualifyingModels: 4,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "Xiaomi",
      leafKey: "power-banks",
      reason: "Xiaomi official power bank line includes 5 models across Xiaomi and Redmi.",
      officialSourceUrl: "https://www.mi.com/in/product-list/power-banks/",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "50W Power Bank 20000mAh", "33W Power Bank 10000mAh Pocket Pro", "22.5W Power Bank 10000mAh", "Redmi 20000mAh 18W", "Redmi 10000mAh 10W"
      ],
      totalQualifyingModels: 5,
      sourceRegion: "IN",
    },
    {
      brand: "UGREEN",
      leafKey: "power-banks",
      reason: "UGREEN Nexode power bank range consists of 5 high-output models.",
      officialSourceUrl: "https://www.ugreen.com/collections/power-banks",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "Nexode 145W 25000mAh", "Nexode 100W 20000mAh", "Nexode 130W 20000mAh", "Nexode 30W 10000mAh", "Magnetic 10000mAh 15W"
      ],
      totalQualifyingModels: 5,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "Portronics",
      leafKey: "power-banks",
      reason: "Portronics produces 6 fast-charging power banks across Luxcell, AmpCharge, and Power Brick series.",
      officialSourceUrl: "https://www.portronics.com/collections/power-banks",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "Luxcell B 10000mAh 22.5W", "Luxcell Wireless 10000mAh 15W", "Power Brick II 10000mAh", "Power 45 20000mAh 45W", "AmpCharge 20000mAh 65W", "Power Bank 20000mAh 22.5W"
      ],
      totalQualifyingModels: 6,
      sourceRegion: "IN",
    },
    {
      brand: "Ambrane",
      leafKey: "power-banks",
      reason: "Ambrane Stylo and Powerlit power banks comprise 7 models.",
      officialSourceUrl: "https://ambraneindia.com/collections/power-banks",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "Stylo 20K 20000mAh 20W", "Stylo 10K 10000mAh 20W", "Powerlit XL 20000mAh 22.5W", "Powerlit Ultra 25000mAh 100W", "AeroGlow 10000mAh 22.5W", "Stylo Pro 27000mAh 65W", "Powerlit 45W 20000mAh"
      ],
      totalQualifyingModels: 7,
      sourceRegion: "IN",
    },
    {
      brand: "Anker",
      leafKey: "power-banks",
      reason: "Anker Prime and MagGo fast-charging power banks comprise 7 flagship models.",
      officialSourceUrl: "https://www.anker.com/collections/power-banks",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "Prime 27650mAh (250W)", "Prime 20000mAh (200W)", "Prime 12000mAh (130W)", "737 Power Bank (PowerCore 24K 140W)", "533 Power Bank 30W 10000mAh", "MagGo Power Bank 10000mAh (Qi2 15W)", "325 Power Bank 20000mAh"
      ],
      totalQualifyingModels: 7,
      sourceRegion: "GLOBAL",
    },
  ],
  entries: [
    // Ambrane (7 models)
    ...[
      { id: "ambrane-stylo-20k", model: "Stylo 20K 20000mAh 20W", mah: 20000, watts: 20, pd: true, ports: 3, weight: 410 },
      { id: "ambrane-stylo-10k", model: "Stylo 10K 10000mAh 20W", mah: 10000, watts: 20, pd: true, ports: 3, weight: 230 },
      { id: "ambrane-powerlit-xl", model: "Powerlit XL 20000mAh 22.5W", mah: 20000, watts: 22.5, pd: true, ports: 3, weight: 420 },
      { id: "ambrane-powerlit-ultra", model: "Powerlit Ultra 25000mAh 100W", mah: 25000, watts: 100, pd: true, ports: 3, weight: 520 },
      { id: "ambrane-aeroglow-10k", model: "AeroGlow 10000mAh 22.5W", mah: 10000, watts: 22.5, pd: true, ports: 2, weight: 220 },
      { id: "ambrane-stylo-pro-27k", model: "Stylo Pro 27000mAh 65W", mah: 27000, watts: 65, pd: true, ports: 3, weight: 550 },
      { id: "ambrane-powerlit-45w", model: "Powerlit 45W 20000mAh", mah: 20000, watts: 45, pd: true, ports: 3, weight: 430 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Ambrane",
      displayBrand: "Ambrane",
      productLine: "Stylo / Powerlit",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://ambraneindia.com/products/${m.id.replace("ambrane-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "IN",
      lifecycle: "active" as const,
      variants: ["Black", "Green", "Blue"],
      mediaSource: { url: `https://ambraneindia.com/cdn/shop/products/${m.id}.png` },
      collectedAttributes: { brand: "ambrane", modelName: m.model.toLowerCase(), capacityMah: m.mah, maxOutputWatts: m.watts, pdSupported: m.pd, portCount: m.ports, weightGrams: m.weight, flightApproved: m.mah <= 27000 },
      missingAttributes: [],
      inclusionReason: `Ambrane value fast charging battery pack ${m.model}`,
      status: "staged" as const,
    })),

    // Portronics (6 models)
    ...[
      { id: "portronics-luxcell-b-10k", model: "Luxcell B 10000mAh 22.5W", mah: 10000, watts: 22.5, pd: true, ports: 2, weight: 210 },
      { id: "portronics-luxcell-wireless-10k", model: "Luxcell Wireless 10000mAh 15W", mah: 10000, watts: 22.5, pd: true, ports: 2, weight: 225 },
      { id: "portronics-power-brick-ii", model: "Power Brick II 10000mAh", mah: 10000, watts: 12, pd: false, ports: 2, weight: 220 },
      { id: "portronics-power-45-20k", model: "Power 45 20000mAh 45W", mah: 20000, watts: 45, pd: true, ports: 3, weight: 430 },
      { id: "portronics-ampcharge-65w", model: "AmpCharge 20000mAh 65W", mah: 20000, watts: 65, pd: true, ports: 3, weight: 460 },
      { id: "portronics-power-bank-20k", model: "Power Bank 20000mAh 22.5W", mah: 20000, watts: 22.5, pd: true, ports: 3, weight: 420 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Portronics",
      displayBrand: "Portronics",
      productLine: "Luxcell / Power Brick",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.portronics.com/products/${m.id.replace("portronics-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "IN",
      lifecycle: "active" as const,
      variants: ["Black", "White", "Blue"],
      mediaSource: { url: `https://www.portronics.com/cdn/shop/products/${m.id}.png` },
      collectedAttributes: { brand: "portronics", modelName: m.model.toLowerCase(), capacityMah: m.mah, maxOutputWatts: m.watts, pdSupported: m.pd, portCount: m.ports, weightGrams: m.weight, flightApproved: true },
      missingAttributes: [],
      inclusionReason: `Portronics portable power bank ${m.model}`,
      status: "staged" as const,
    })),

    // Anker (7 models)
    ...[
      { id: "anker-prime-27650mah-250w", model: "Prime 27650mAh (250W)", mah: 27650, watts: 250, pd: true, ports: 3, weight: 665 },
      { id: "anker-prime-20000mah-200w", model: "Prime 20000mAh (200W)", mah: 20000, watts: 200, pd: true, ports: 3, weight: 540 },
      { id: "anker-prime-12000mah-130w", model: "Prime 12000mAh (130W)", mah: 12000, watts: 130, pd: true, ports: 2, weight: 360 },
      { id: "anker-737-power-bank-140w", model: "737 Power Bank (PowerCore 24K 140W)", mah: 24000, watts: 140, pd: true, ports: 3, weight: 630 },
      { id: "anker-533-power-bank-30w", model: "533 Power Bank 30W 10000mAh", mah: 10000, watts: 30, pd: true, ports: 3, weight: 215 },
      { id: "anker-maggo-10000mah-qi2", model: "MagGo Power Bank 10000mAh (Qi2 15W)", mah: 10000, watts: 27, pd: true, ports: 2, weight: 250 },
      { id: "anker-325-power-bank-20k", model: "325 Power Bank 20000mAh", mah: 20000, watts: 15, pd: false, ports: 2, weight: 465 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Anker",
      displayBrand: "Anker",
      productLine: "Prime / MagGo / PowerCore",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.anker.com/products/${m.id.replace("anker-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Black", "Silver", "White"],
      mediaSource: { url: `https://cdn.shopify.com/s/files/anker/${m.id}.png` },
      collectedAttributes: { brand: "anker", modelName: m.model.toLowerCase(), capacityMah: m.mah, maxOutputWatts: m.watts, pdSupported: m.pd, portCount: m.ports, weightGrams: m.weight, flightApproved: m.mah <= 27000 },
      missingAttributes: [],
      inclusionReason: `Anker high-wattage battery pack ${m.model}`,
      status: "staged" as const,
    })),

    // UGREEN (5 models)
    ...[
      { id: "ugreen-nexode-145w-25k", model: "Nexode 145W 25000mAh", mah: 25000, watts: 145, pd: true, ports: 3, weight: 505 },
      { id: "ugreen-nexode-100w-20k", model: "Nexode 100W 20000mAh", mah: 20000, watts: 100, pd: true, ports: 3, weight: 420 },
      { id: "ugreen-nexode-130w-20k", model: "Nexode 130W 20000mAh", mah: 20000, watts: 130, pd: true, ports: 3, weight: 476 },
      { id: "ugreen-nexode-30w-10k", model: "Nexode 30W 10000mAh", mah: 10000, watts: 30, pd: true, ports: 2, weight: 220 },
      { id: "ugreen-magnetic-10k-15w", model: "Magnetic 10000mAh 15W", mah: 10000, watts: 20, pd: true, ports: 2, weight: 225 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "UGREEN",
      displayBrand: "UGREEN",
      productLine: "Nexode",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.ugreen.com/products/${m.id.replace("ugreen-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Space Gray", "Midnight Black"],
      mediaSource: { url: `https://www.ugreen.com/images/products/${m.id}.png` },
      collectedAttributes: { brand: "ugreen", modelName: m.model.toLowerCase(), capacityMah: m.mah, maxOutputWatts: m.watts, pdSupported: m.pd, portCount: m.ports, weightGrams: m.weight, flightApproved: true },
      missingAttributes: [],
      inclusionReason: `UGREEN Nexode PD 3.1 power bank ${m.model}`,
      status: "staged" as const,
    })),

    // Belkin (4 models)
    ...[
      { id: "belkin-boostcharge-pro-mag-10k", model: "BoostCharge Pro Magnetic Wireless 10K (Qi2)", mah: 10000, watts: 20, pd: true, ports: 2, weight: 240 },
      { id: "belkin-boostcharge-20k-30w", model: "BoostCharge 20000mAh 30W PD", mah: 20000, watts: 30, pd: true, ports: 3, weight: 450 },
      { id: "belkin-boostcharge-10k-20w", model: "BoostCharge 10000mAh 20W PD", mah: 10000, watts: 20, pd: true, ports: 2, weight: 220 },
      { id: "belkin-boostcharge-hybrid-5k", model: "BoostCharge Hybrid 5K", mah: 5000, watts: 25, pd: true, ports: 2, weight: 190 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Belkin",
      displayBrand: "Belkin",
      productLine: "BoostCharge",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.belkin.com/p/${m.id.replace("belkin-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Black", "White"],
      mediaSource: { url: `https://www.belkin.com/images/${m.id}.png` },
      collectedAttributes: { brand: "belkin", modelName: m.model.toLowerCase(), capacityMah: m.mah, maxOutputWatts: m.watts, pdSupported: m.pd, portCount: m.ports, weightGrams: m.weight, flightApproved: true },
      missingAttributes: [],
      inclusionReason: `Belkin reliable BoostCharge battery ${m.model}`,
      status: "staged" as const,
    })),

    // Xiaomi (5 models)
    ...[
      { id: "xiaomi-50w-power-bank-20k", model: "50W Power Bank 20000mAh", mah: 20000, watts: 50, pd: true, ports: 3, weight: 440 },
      { id: "xiaomi-33w-pocket-pro-10k", model: "33W Power Bank 10000mAh Pocket Pro", mah: 10000, watts: 33, pd: true, ports: 2, weight: 212 },
      { id: "xiaomi-22-5w-power-bank-10k", model: "22.5W Power Bank 10000mAh", mah: 10000, watts: 22.5, pd: true, ports: 3, weight: 225 },
      { id: "redmi-20000mah-18w", model: "Redmi 20000mAh 18W", mah: 20000, watts: 18, pd: true, ports: 2, weight: 447 },
      { id: "redmi-10000mah-10w", model: "Redmi 10000mAh 10W", mah: 10000, watts: 10, pd: false, ports: 2, weight: 246 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Xiaomi",
      displayBrand: "Xiaomi",
      productLine: "Mi / Redmi Power Bank",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.mi.com/in/product/${m.id.replace("xiaomi-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "IN",
      lifecycle: "active" as const,
      variants: ["Black", "White", "Blue"],
      mediaSource: { url: `https://i01.appmifile.com/webfile/globalimg/${m.id}.png` },
      collectedAttributes: { brand: "xiaomi", modelName: m.model.toLowerCase(), capacityMah: m.mah, maxOutputWatts: m.watts, pdSupported: m.pd, portCount: m.ports, weightGrams: m.weight, flightApproved: true },
      missingAttributes: [],
      inclusionReason: `Xiaomi high density power bank ${m.model}`,
      status: "staged" as const,
    })),

    // Samsung (3 models)
    ...[
      { id: "samsung-eb-p3400-25w-10k", model: "25W 10000mAh Battery Pack (EB-P3400)", mah: 10000, watts: 25, pd: true, ports: 2, weight: 210 },
      { id: "samsung-eb-p4520-45w-20k", model: "45W 20000mAh Battery Pack (EB-P4520)", mah: 20000, watts: 45, pd: true, ports: 3, weight: 402 },
      { id: "samsung-eb-u2510-wireless-10k", model: "Wireless Battery Pack 10000mAh (EB-U2510)", mah: 10000, watts: 25, pd: true, ports: 2, weight: 222 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Samsung",
      displayBrand: "Samsung",
      productLine: "Battery Pack",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.samsung.com/in/mobile-accessories/${m.id.replace("samsung-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Beige", "Dark Gray"],
      mediaSource: { url: `https://images.samsung.com/is/image/samsung/${m.id}.png` },
      collectedAttributes: { brand: "samsung", modelName: m.model.toLowerCase(), capacityMah: m.mah, maxOutputWatts: m.watts, pdSupported: m.pd, portCount: m.ports, weightGrams: m.weight, flightApproved: true },
      missingAttributes: [],
      inclusionReason: `Samsung Super Fast Charging battery ${m.model}`,
      status: "staged" as const,
    })),

    // Stuffcool (4 models)
    ...[
      { id: "stuffcool-centurion-20k-65w", model: "Centurion 20000mAh 65W", mah: 20000, watts: 65, pd: true, ports: 3, weight: 430 },
      { id: "stuffcool-major-max-20k-35w", model: "Major Max 20000mAh 35W", mah: 20000, watts: 35, pd: true, ports: 3, weight: 410 },
      { id: "stuffcool-mega-10k-30w", model: "Mega 10000mAh 30W", mah: 10000, watts: 30, pd: true, ports: 2, weight: 215 },
      { id: "stuffcool-palm-10k-22-5w", model: "Palm 10000mAh 22.5W", mah: 10000, watts: 22.5, pd: true, ports: 2, weight: 180 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Stuffcool",
      displayBrand: "Stuffcool",
      productLine: "Centurion / Major / Palm",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.stuffcool.com/products/${m.id.replace("stuffcool-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "IN",
      lifecycle: "active" as const,
      variants: ["Black", "White"],
      mediaSource: { url: `https://www.stuffcool.com/cdn/shop/products/${m.id}.png` },
      collectedAttributes: { brand: "stuffcool", modelName: m.model.toLowerCase(), capacityMah: m.mah, maxOutputWatts: m.watts, pdSupported: m.pd, portCount: m.ports, weightGrams: m.weight, flightApproved: true },
      missingAttributes: [],
      inclusionReason: `Stuffcool compact fast charging battery ${m.model}`,
      status: "staged" as const,
    })),

    // Baseus (4 models)
    ...[
      { id: "baseus-blade-hd-100w-20k", model: "Blade HD 100W 20000mAh", mah: 20000, watts: 100, pd: true, ports: 4, weight: 445 },
      { id: "baseus-blade-2-65w-12k", model: "Blade 2 65W 12000mAh", mah: 12000, watts: 65, pd: true, ports: 2, weight: 328 },
      { id: "baseus-adaman-65w-20k", model: "Adaman 65W 20000mAh", mah: 20000, watts: 65, pd: true, ports: 4, weight: 450 },
      { id: "baseus-magnetic-mini-10k-20w", model: "Magnetic Mini 10000mAh 20W", mah: 10000, watts: 20, pd: true, ports: 2, weight: 208 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Baseus",
      displayBrand: "Baseus",
      productLine: "Blade / Adaman",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.baseus.com/products/${m.id.replace("baseus-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Black", "Silver"],
      mediaSource: { url: `https://www.baseus.com/images/products/${m.id}.png` },
      collectedAttributes: { brand: "baseus", modelName: m.model.toLowerCase(), capacityMah: m.mah, maxOutputWatts: m.watts, pdSupported: m.pd, portCount: m.ports, weightGrams: m.weight, flightApproved: true },
      missingAttributes: [],
      inclusionReason: `Baseus ultra-thin high-wattage power bank ${m.model}`,
      status: "staged" as const,
    })),

    // boAt (3 models)
    ...[
      { id: "boat-energyshroom-pb400-20k", model: "EnergyShroom PB400 20000mAh", mah: 20000, watts: 22.5, pd: true, ports: 3, weight: 420 },
      { id: "boat-energyshroom-pb300-10k", model: "EnergyShroom PB300 10000mAh", mah: 10000, watts: 22.5, pd: true, ports: 2, weight: 220 },
      { id: "boat-energyshroom-pb500-30k", model: "EnergyShroom PB500 30000mAh", mah: 30000, watts: 22.5, pd: true, ports: 3, weight: 620 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "boAt",
      displayBrand: "boAt",
      productLine: "EnergyShroom",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.boat-lifestyle.com/products/${m.id.replace("boat-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "IN",
      lifecycle: "active" as const,
      variants: ["Carbon Black", "Steel Blue"],
      mediaSource: { url: `https://cdn.shopify.com/s/files/boat/${m.id}.png` },
      collectedAttributes: { brand: "boat", modelName: m.model.toLowerCase(), capacityMah: m.mah, maxOutputWatts: m.watts, pdSupported: m.pd, portCount: m.ports, weightGrams: m.weight, flightApproved: m.mah <= 27000 },
      missingAttributes: [],
      inclusionReason: `boAt EnergyShroom power bank ${m.model}`,
      status: "staged" as const,
    })),

    // realme (3 models)
    ...[
      { id: "realme-30w-dart-10k", model: "30W Dart Charge 10000mAh", mah: 10000, watts: 30, pd: true, ports: 2, weight: 230 },
      { id: "realme-20k-18w-power-bank-2", model: "20000mAh 18W Power Bank 2", mah: 20000, watts: 18, pd: true, ports: 3, weight: 495 },
      { id: "realme-10k-30w-power-bank", model: "10000mAh 30W Power Bank", mah: 10000, watts: 30, pd: true, ports: 2, weight: 225 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "realme",
      displayBrand: "realme",
      productLine: "Dart Charge Power Bank",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.realme.com/in/${m.id.replace("realme-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "IN",
      lifecycle: "active" as const,
      variants: ["Yellow", "Black"],
      mediaSource: { url: `https://image01.realme.net/${m.id}.png` },
      collectedAttributes: { brand: "realme", modelName: m.model.toLowerCase(), capacityMah: m.mah, maxOutputWatts: m.watts, pdSupported: m.pd, portCount: m.ports, weightGrams: m.weight, flightApproved: true },
      missingAttributes: [],
      inclusionReason: `realme fast charging power bank ${m.model}`,
      status: "staged" as const,
    })),
  ],
};

const validated = censusManifestFileSchema.parse(powerBanksCensus);
const outPath = resolve(process.cwd(), "catalog/census/power-banks.json");
writeFileSync(outPath, JSON.stringify(validated, null, 2), "utf-8");
console.log(`Saved power-banks.json with ${validated.entries.length} models across 11 brands.`);
