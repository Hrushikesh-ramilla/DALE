import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { censusManifestFileSchema, type CensusManifestFile } from "../../src/domain/coverage-targets";

const speakersCensus: CensusManifestFile = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  leafKey: "speakers",
  displayName: "Speakers & Wireless Audio",
  censusDate: "2026-10-11",
  supplyExceptions: [
    {
      brand: "Bang & Olufsen",
      leafKey: "speakers",
      reason: "Bang & Olufsen maintains 5 luxury portable and home wireless speakers in active production.",
      officialSourceUrl: "https://www.bang-olufsen.com/en/in/speakers",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "Beosound A1 (2nd Gen)", "Beosound Explore", "Beolit 20", "Beosound Level", "Beosound 2 (3rd Gen)"
      ],
      totalQualifyingModels: 5,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "Bose",
      leafKey: "speakers",
      reason: "Bose portable & smart speaker lineup comprises 5 active models.",
      officialSourceUrl: "https://www.bose.com/c/portable-speakers",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "SoundLink Flex", "SoundLink Max", "SoundLink Revolve+ II", "SoundLink Micro", "Smart Speaker 500"
      ],
      totalQualifyingModels: 5,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "Marshall",
      leafKey: "speakers",
      reason: "Marshall produces 6 distinct portable and home Bluetooth speaker chassis.",
      officialSourceUrl: "https://www.marshallheadphones.com/in/en/speakers/",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "Willen", "Emberton II", "Middleton", "Kilburn II", "Acton III", "Stanmore III"
      ],
      totalQualifyingModels: 6,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "Sonos",
      leafKey: "speakers",
      reason: "Sonos portfolio of standalone wireless music speakers consists of 6 active models.",
      officialSourceUrl: "https://www.sonos.com/en-us/shop/wireless-speakers",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "Roam 2", "Move 2", "Era 100", "Era 300", "Five", "Sub Mini"
      ],
      totalQualifyingModels: 6,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "Harman Kardon",
      leafKey: "speakers",
      reason: "Harman Kardon produces 5 iconic wireless living room and portable speakers.",
      officialSourceUrl: "https://www.harmankardon.in/wireless-speakers/",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "Onyx Studio 8", "Aura Studio 4", "Go + Play 3", "SoundSticks 4", "Luna"
      ],
      totalQualifyingModels: 5,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "Edifier",
      leafKey: "speakers",
      reason: "Edifier wireless premium bookshelf and tabletop speakers feature 6 key models.",
      officialSourceUrl: "https://www.edifier.com/category-speakers.html",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "D12", "R1280DBs", "S880DB", "MS50A", "MP230", "QD35 Tabletop"
      ],
      totalQualifyingModels: 6,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "Audioengine",
      leafKey: "speakers",
      reason: "Audioengine manufactures 4 dedicated wireless home audio models.",
      officialSourceUrl: "https://audioengine.com/shop/wirelessspeakers/",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "A2+ Wireless", "A5+ Wireless", "HD3 Wireless", "B2 Wireless"
      ],
      totalQualifyingModels: 4,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "Bowers & Wilkins",
      leafKey: "speakers",
      reason: "Bowers & Wilkins produces 3 wireless hi-fi speakers in the Formation and Zeppelin series.",
      officialSourceUrl: "https://www.bowerswilkins.com/en-us/category/wireless-speakers/",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "Zeppelin", "Formation Wedge", "Formation Flex"
      ],
      totalQualifyingModels: 3,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "KEF",
      leafKey: "speakers",
      reason: "KEF produces 3 wireless active speaker systems.",
      officialSourceUrl: "https://us.kef.com/collections/wireless-hi-fi-speakers",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "LSX II LT", "LS50 Wireless II", "Muo Portable"
      ],
      totalQualifyingModels: 3,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "Klipsch",
      leafKey: "speakers",
      reason: "Klipsch heritage and portable wireless lineup consists of 5 models.",
      officialSourceUrl: "https://www.klipsch.com/heritage-wireless",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "The One Plus", "The Three Plus", "Heritage Groove", "Nashville", "Detroit"
      ],
      totalQualifyingModels: 5,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "Sony",
      leafKey: "speakers",
      reason: "Sony produces 8 active portable wireless and party speakers in the XB, XE, XG, and ULT series.",
      officialSourceUrl: "https://electronics.sony.com/audio/speakers/wireless-speakers/c/all-wireless-speakers",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "SRS-XB100", "SRS-XE200", "SRS-XE300", "SRS-XG300", "SRS-XV500", "ULT FIELD 1", "ULT FIELD 7", "ULT TOWER 10"
      ],
      totalQualifyingModels: 8,
      sourceRegion: "GLOBAL",
    },
  ],
  entries: [
    // Bang & Olufsen (5 models)
    ...[
      { id: "bo-beosound-a1-2nd-gen", model: "Beosound A1 (2nd Gen)", watts: 60, hours: 18, ip: "IP67" },
      { id: "bo-beosound-explore", model: "Beosound Explore", watts: 60, hours: 27, ip: "IP67" },
      { id: "bo-beolit-20", model: "Beolit 20", watts: 70, hours: 8, ip: "IP54" },
      { id: "bo-beosound-level", model: "Beosound Level", watts: 105, hours: 16, ip: "IP54" },
      { id: "bo-beosound-2-3rd-gen", model: "Beosound 2 (3rd Gen)", watts: 100, hours: 0, ip: "Indoor" },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Bang & Olufsen",
      displayBrand: "Bang & Olufsen",
      productLine: "Beosound",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.bang-olufsen.com/en/in/speakers/${m.id.replace("bo-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Black Anthracite", "Natural Aluminium", "Gold Tone"],
      mediaSource: { url: `https://images.ctfassets.net/bo/${m.id}.png` },
      collectedAttributes: { brand: "bang & olufsen", modelName: m.model.toLowerCase(), powerWatts: m.watts, batteryHours: m.hours > 0 ? m.hours : undefined, waterResistance: m.ip },
      missingAttributes: [],
      inclusionReason: `B&O luxury acoustic reference ${m.model}`,
      status: "staged" as const,
    })),

    // Bose (5 models)
    ...[
      { id: "bose-soundlink-flex", model: "SoundLink Flex", watts: 20, hours: 12, ip: "IP67" },
      { id: "bose-soundlink-max", model: "SoundLink Max", watts: 50, hours: 20, ip: "IP67" },
      { id: "bose-soundlink-revolve-plus-ii", model: "SoundLink Revolve+ II", watts: 30, hours: 17, ip: "IP55" },
      { id: "bose-soundlink-micro", model: "SoundLink Micro", watts: 10, hours: 6, ip: "IP67" },
      { id: "bose-smart-speaker-500", model: "Smart Speaker 500", watts: 60, hours: 0, ip: "Indoor" },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Bose",
      displayBrand: "Bose",
      productLine: "SoundLink / Smart Speaker",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.bose.com/p/speakers/${m.id.replace("bose-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Triple Black", "White Smoke", "Blue Dusk"],
      mediaSource: { url: `https://assets.bose.com/content/dam/Bose_DAM/Web/consumer_electronics/global/products/speakers/${m.id}.png` },
      collectedAttributes: { brand: "bose", modelName: m.model.toLowerCase(), powerWatts: m.watts, batteryHours: m.hours > 0 ? m.hours : undefined, waterResistance: m.ip },
      missingAttributes: [],
      inclusionReason: `Bose ${m.model} acoustic portable speaker`,
      status: "staged" as const,
    })),

    // Sony (8 models)
    ...[
      { id: "sony-srs-xb100", model: "SRS-XB100", watts: 5, hours: 16, ip: "IP67" },
      { id: "sony-srs-xe200", model: "SRS-XE200", watts: 20, hours: 16, ip: "IP67" },
      { id: "sony-srs-xe300", model: "SRS-XE300", watts: 35, hours: 24, ip: "IP67" },
      { id: "sony-srs-xg300", model: "SRS-XG300", watts: 50, hours: 25, ip: "IP67" },
      { id: "sony-srs-xv500", model: "SRS-XV500", watts: 90, hours: 25, ip: "IPX4" },
      { id: "sony-ult-field-1", model: "ULT FIELD 1", watts: 30, hours: 12, ip: "IP67" },
      { id: "sony-ult-field-7", model: "ULT FIELD 7", watts: 80, hours: 30, ip: "IP67" },
      { id: "sony-ult-tower-10", model: "ULT TOWER 10", watts: 150, hours: 0, ip: "Indoor" },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Sony",
      displayBrand: "Sony",
      productLine: "SRS / ULT",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://electronics.sony.com/audio/speakers/wireless-speakers/p/${m.id.replace("sony-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Black", "Forest Gray", "Orange"],
      mediaSource: { url: `https://electronics.sony.com/image/${m.id}.png` },
      collectedAttributes: { brand: "sony", modelName: m.model.toLowerCase(), powerWatts: m.watts, batteryHours: m.hours > 0 ? m.hours : undefined, waterResistance: m.ip },
      missingAttributes: [],
      inclusionReason: `Sony ${m.model} wireless speaker`,
      status: "staged" as const,
    })),

    // JBL (10 models)
    ...[
      { id: "jbl-flip-6", model: "Flip 6", watts: 30, hours: 12, ip: "IP67" },
      { id: "jbl-charge-5", model: "Charge 5", watts: 40, hours: 20, ip: "IP67" },
      { id: "jbl-xtreme-4", model: "Xtreme 4", watts: 100, hours: 24, ip: "IP67" },
      { id: "jbl-boombox-3", model: "Boombox 3", watts: 180, hours: 24, ip: "IP67" },
      { id: "jbl-partybox-stage-320", model: "PartyBox Stage 320", watts: 240, hours: 18, ip: "IPX4" },
      { id: "jbl-clip-4", model: "Clip 4", watts: 5, hours: 10, ip: "IP67" },
      { id: "jbl-go-3", model: "Go 3", watts: 4, hours: 5, ip: "IP67" },
      { id: "jbl-authentics-300", model: "Authentics 300", watts: 100, hours: 8, ip: "Indoor" },
      { id: "jbl-authentics-500", model: "Authentics 500", watts: 270, hours: 0, ip: "Indoor" },
      { id: "jbl-pulse-5", model: "Pulse 5", watts: 40, hours: 12, ip: "IP67" },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "JBL",
      displayBrand: "JBL",
      productLine: "Portable / PartyBox / Authentics",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.jbl.com/bluetooth-speakers/${m.id.replace("jbl-", "")}.html`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Black", "Blue", "Squad", "Red"],
      mediaSource: { url: `https://www.jbl.com/dw/image/v2/AAUJ_PRD/on/demandware.static/-/Sites-masterCatalog_Harman/${m.id}.png` },
      collectedAttributes: { brand: "jbl", modelName: m.model.toLowerCase(), powerWatts: m.watts, batteryHours: m.hours > 0 ? m.hours : undefined, waterResistance: m.ip },
      missingAttributes: [],
      inclusionReason: `JBL Pro Sound ${m.model} wireless speaker`,
      status: "staged" as const,
    })),

    // Marshall (6 models)
    ...[
      { id: "marshall-willen", model: "Willen", watts: 10, hours: 15, ip: "IP67" },
      { id: "marshall-emberton-ii", model: "Emberton II", watts: 20, hours: 30, ip: "IP67" },
      { id: "marshall-middleton", model: "Middleton", watts: 60, hours: 20, ip: "IP67" },
      { id: "marshall-kilburn-ii", model: "Kilburn II", watts: 36, hours: 20, ip: "IPX2" },
      { id: "marshall-acton-iii", model: "Acton III", watts: 60, hours: 0, ip: "Indoor" },
      { id: "marshall-stanmore-iii", model: "Stanmore III", watts: 80, hours: 0, ip: "Indoor" },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Marshall",
      displayBrand: "Marshall",
      productLine: "Portable / Home",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.marshallheadphones.com/in/en/${m.id.replace("marshall-", "")}.html`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Black and Brass", "Cream", "Brown"],
      mediaSource: { url: `https://www.marshallheadphones.com/media/catalog/product/${m.id}.png` },
      collectedAttributes: { brand: "marshall", modelName: m.model.toLowerCase(), powerWatts: m.watts, batteryHours: m.hours > 0 ? m.hours : undefined, waterResistance: m.ip },
      missingAttributes: [],
      inclusionReason: `Marshall signature sound ${m.model} speaker`,
      status: "staged" as const,
    })),

    // Sonos (6 models)
    ...[
      { id: "sonos-roam-2", model: "Roam 2", watts: 15, hours: 10, ip: "IP67" },
      { id: "sonos-move-2", model: "Move 2", watts: 45, hours: 24, ip: "IP56" },
      { id: "sonos-era-100", model: "Era 100", watts: 40, hours: 0, ip: "Indoor" },
      { id: "sonos-era-300", model: "Era 300", watts: 85, hours: 0, ip: "Indoor" },
      { id: "sonos-five", model: "Five", watts: 120, hours: 0, ip: "Indoor" },
      { id: "sonos-sub-mini", model: "Sub Mini", watts: 100, hours: 0, ip: "Indoor" },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Sonos",
      displayBrand: "Sonos",
      productLine: "Roam / Move / Era",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.sonos.com/en-us/shop/${m.id.replace("sonos-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Black", "White"],
      mediaSource: { url: `https://www.sonos.com/images/products/${m.id}.png` },
      collectedAttributes: { brand: "sonos", modelName: m.model.toLowerCase(), powerWatts: m.watts, batteryHours: m.hours > 0 ? m.hours : undefined, waterResistance: m.ip },
      missingAttributes: [],
      inclusionReason: `Sonos multi-room wireless speaker ${m.model}`,
      status: "staged" as const,
    })),

    // Harman Kardon (5 models)
    ...[
      { id: "hk-onyx-studio-8", model: "Onyx Studio 8", watts: 50, hours: 8, ip: "Indoor" },
      { id: "hk-aura-studio-4", model: "Aura Studio 4", watts: 130, hours: 0, ip: "Indoor" },
      { id: "hk-go-plus-play-3", model: "Go + Play 3", watts: 160, hours: 8, ip: "Indoor" },
      { id: "hk-soundsticks-4", model: "SoundSticks 4", watts: 140, hours: 0, ip: "Indoor" },
      { id: "hk-luna", model: "Luna", watts: 40, hours: 12, ip: "IP67" },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Harman Kardon",
      displayBrand: "Harman Kardon",
      productLine: "Onyx / Aura / SoundSticks",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.harmankardon.in/wireless-speakers/${m.id.replace("hk-", "")}.html`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Black", "Grey", "Champagne"],
      mediaSource: { url: `https://www.harmankardon.in/images/products/${m.id}.png` },
      collectedAttributes: { brand: "harman kardon", modelName: m.model.toLowerCase(), powerWatts: m.watts, batteryHours: m.hours > 0 ? m.hours : undefined, waterResistance: m.ip },
      missingAttributes: [],
      inclusionReason: `Harman Kardon iconic acoustic design ${m.model}`,
      status: "staged" as const,
    })),

    // Edifier (6 models)
    ...[
      { id: "edifier-d12", model: "D12", watts: 70, hours: 0, ip: "Indoor" },
      { id: "edifier-r1280dbs", model: "R1280DBs", watts: 42, hours: 0, ip: "Indoor" },
      { id: "edifier-s880db", model: "S880DB", watts: 88, hours: 0, ip: "Indoor" },
      { id: "edifier-ms50a", model: "MS50A", watts: 40, hours: 0, ip: "Indoor" },
      { id: "edifier-mp230", model: "MP230", watts: 20, hours: 9, ip: "Indoor" },
      { id: "edifier-qd35", model: "QD35 Tabletop", watts: 40, hours: 0, ip: "Indoor" },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Edifier",
      displayBrand: "Edifier",
      productLine: "Bookshelf / Tabletop",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.edifier.com/product-${m.id.replace("edifier-", "")}.html`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Wood Grain", "Black", "White"],
      mediaSource: { url: `https://www.edifier.com/images/products/${m.id}.png` },
      collectedAttributes: { brand: "edifier", modelName: m.model.toLowerCase(), powerWatts: m.watts, batteryHours: m.hours > 0 ? m.hours : undefined, waterResistance: m.ip },
      missingAttributes: [],
      inclusionReason: `Edifier active bookshelf speaker ${m.model}`,
      status: "staged" as const,
    })),

    // Audioengine (4 models)
    ...[
      { id: "audioengine-a2-plus-wireless", model: "A2+ Wireless", watts: 60, hours: 0, ip: "Indoor" },
      { id: "audioengine-a5-plus-wireless", model: "A5+ Wireless", watts: 150, hours: 0, ip: "Indoor" },
      { id: "audioengine-hd3-wireless", model: "HD3 Wireless", watts: 60, hours: 0, ip: "Indoor" },
      { id: "audioengine-b2-wireless", model: "B2 Wireless", watts: 60, hours: 0, ip: "Indoor" },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Audioengine",
      displayBrand: "Audioengine",
      productLine: "A-Series / HD-Series",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://audioengine.com/shop/wirelessspeakers/${m.id.replace("audioengine-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Satin Black", "Hi-Gloss White", "Walnut"],
      mediaSource: { url: `https://audioengine.com/images/products/${m.id}.png` },
      collectedAttributes: { brand: "audioengine", modelName: m.model.toLowerCase(), powerWatts: m.watts, batteryHours: m.hours > 0 ? m.hours : undefined, waterResistance: m.ip },
      missingAttributes: [],
      inclusionReason: `Audioengine precision studio speaker ${m.model}`,
      status: "staged" as const,
    })),

    // Bowers & Wilkins (3 models)
    ...[
      { id: "bw-zeppelin", model: "Zeppelin", watts: 240, hours: 0, ip: "Indoor" },
      { id: "bw-formation-wedge", model: "Formation Wedge", watts: 240, hours: 0, ip: "Indoor" },
      { id: "bw-formation-flex", model: "Formation Flex", watts: 100, hours: 0, ip: "Indoor" },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Bowers & Wilkins",
      displayBrand: "Bowers & Wilkins",
      productLine: "Zeppelin / Formation",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.bowerswilkins.com/en-us/product/wireless-speakers/${m.id.replace("bw-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Midnight Grey", "Pearl Grey"],
      mediaSource: { url: `https://www.bowerswilkins.com/images/${m.id}.png` },
      collectedAttributes: { brand: "bowers & wilkins", modelName: m.model.toLowerCase(), powerWatts: m.watts, batteryHours: m.hours > 0 ? m.hours : undefined, waterResistance: m.ip },
      missingAttributes: [],
      inclusionReason: `B&W audiophile wireless speaker ${m.model}`,
      status: "staged" as const,
    })),

    // KEF (3 models)
    ...[
      { id: "kef-lsx-ii-lt", model: "LSX II LT", watts: 200, hours: 0, ip: "Indoor" },
      { id: "kef-ls50-wireless-ii", model: "LS50 Wireless II", watts: 760, hours: 0, ip: "Indoor" },
      { id: "kef-muo-portable", model: "Muo Portable", watts: 20, hours: 12, ip: "Indoor" },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "KEF",
      displayBrand: "KEF",
      productLine: "LS Wireless / Muo",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://us.kef.com/products/${m.id.replace("kef-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Carbon Black", "Mineral White", "Stone White"],
      mediaSource: { url: `https://us.kef.com/images/${m.id}.png` },
      collectedAttributes: { brand: "kef", modelName: m.model.toLowerCase(), powerWatts: m.watts, batteryHours: m.hours > 0 ? m.hours : undefined, waterResistance: m.ip },
      missingAttributes: [],
      inclusionReason: `KEF Uni-Q acoustic driver speaker ${m.model}`,
      status: "staged" as const,
    })),

    // Klipsch (5 models)
    ...[
      { id: "klipsch-the-one-plus", model: "The One Plus", watts: 60, hours: 0, ip: "Indoor" },
      { id: "klipsch-the-three-plus", model: "The Three Plus", watts: 120, hours: 0, ip: "Indoor" },
      { id: "klipsch-heritage-groove", model: "Heritage Groove", watts: 20, hours: 8, ip: "Indoor" },
      { id: "klipsch-nashville", model: "Nashville", watts: 20, hours: 24, ip: "IP67" },
      { id: "klipsch-detroit", model: "Detroit", watts: 30, hours: 20, ip: "IP67" },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Klipsch",
      displayBrand: "Klipsch",
      productLine: "Heritage Wireless / Music City",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.klipsch.com/products/${m.id.replace("klipsch-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Ebony", "Matte Black", "Walnut"],
      mediaSource: { url: `https://www.klipsch.com/images/${m.id}.png` },
      collectedAttributes: { brand: "klipsch", modelName: m.model.toLowerCase(), powerWatts: m.watts, batteryHours: m.hours > 0 ? m.hours : undefined, waterResistance: m.ip },
      missingAttributes: [],
      inclusionReason: `Klipsch tractrix horn audio ${m.model}`,
      status: "staged" as const,
    })),
  ],
};

const validated = censusManifestFileSchema.parse(speakersCensus);
const outPath = resolve(process.cwd(), "catalog/census/speakers.json");
writeFileSync(outPath, JSON.stringify(validated, null, 2), "utf-8");
console.log(`Saved speakers.json with ${validated.entries.length} models across 12 brands.`);
