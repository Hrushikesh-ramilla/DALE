import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { censusManifestFileSchema, type CensusManifestFile } from "../../src/domain/coverage-targets";

const miceCensus: CensusManifestFile = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  leafKey: "mice",
  displayName: "Mice & Pointing Devices",
  censusDate: "2026-10-11",
  supplyExceptions: [
    {
      brand: "Logitech",
      leafKey: "mice",
      reason: "Logitech MX productivity and G PRO esports wireless mouse line comprises 5 flagship chassis.",
      officialSourceUrl: "https://www.logitech.com/en-us/mice",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "MX Master 3S", "MX Anywhere 3S", "G PRO X SUPERLIGHT 2", "G502 X PLUS LIGHTSPEED", "Lift Vertical Ergonomic"
      ],
      totalQualifyingModels: 5,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "Razer",
      leafKey: "mice",
      reason: "Razer wireless esports and ergonomic flagship mouse lineup comprises 5 models.",
      officialSourceUrl: "https://www.razer.com/pc/gaming-mice",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "DeathAdder V3 Pro", "Viper V3 Pro", "Basilisk V3 Pro", "Cobra Pro", "Naga V2 Pro"
      ],
      totalQualifyingModels: 5,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "SteelSeries",
      leafKey: "mice",
      reason: "SteelSeries Aerox, Rival, and Prime mouse lineup consists of 4 models.",
      officialSourceUrl: "https://steelseries.com/gaming-mice",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "Aerox 3 Wireless", "Aerox 5 Wireless", "Rival 5", "Prime Wireless"
      ],
      totalQualifyingModels: 4,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "Corsair",
      leafKey: "mice",
      reason: "Corsair high-performance wireless and MMO gaming mice comprise 4 models.",
      officialSourceUrl: "https://www.corsair.com/us/en/c/gaming-gear/gaming-mice",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "DARK CORE RGB PRO SE", "SCIMITAR RGB ELITE", "M65 RGB ULTRA", "KATAR PRO XT"
      ],
      totalQualifyingModels: 4,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "ASUS",
      leafKey: "mice",
      reason: "ASUS ROG esports mouse lineup consists of 4 models.",
      officialSourceUrl: "https://rog.asus.com/mice-mouse-pads/mice-group/",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "ROG Harpe Ace Aim Lab", "ROG Spatha X", "ROG Chakram X", "ROG Gladius III Wireless"
      ],
      totalQualifyingModels: 4,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "HyperX",
      leafKey: "mice",
      reason: "HyperX Pulsefire lightweight gaming mouse series comprises 3 models.",
      officialSourceUrl: "https://hyperx.com/collections/gaming-mice",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "Pulsefire Haste 2 Wireless", "Pulsefire Dart", "Pulsefire Raid"
      ],
      totalQualifyingModels: 3,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "BenQ ZOWIE",
      leafKey: "mice",
      reason: "BenQ ZOWIE professional esports tournament mice line features 4 models.",
      officialSourceUrl: "https://zowie.benq.com/en-us/mouse.html",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "EC2-CW Wireless", "EC1-CW Wireless", "FK2-B", "S2-C"
      ],
      totalQualifyingModels: 4,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "Glorious",
      leafKey: "mice",
      reason: "Glorious Model O, D, and I lightweight wireless mice comprise 3 models.",
      officialSourceUrl: "https://www.gloriousgaming.com/collections/mice",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "Model O 2 Wireless", "Model D 2 Wireless", "Model I 2 Wireless"
      ],
      totalQualifyingModels: 3,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "Pulsar",
      leafKey: "mice",
      reason: "Pulsar lightweight competitive gaming mice lineup consists of 3 models.",
      officialSourceUrl: "https://www.pulsar.gg/collections/mice",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "X2 V2 Wireless", "X2H Wireless", "Xlite V3 Wireless"
      ],
      totalQualifyingModels: 3,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "Finalmouse",
      leafKey: "mice",
      reason: "Finalmouse composite tournament mice line consists of 2 models.",
      officialSourceUrl: "https://finalmouse.com/",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "UltralightX", "Starlight-12"
      ],
      totalQualifyingModels: 2,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "Endgame Gear",
      leafKey: "mice",
      reason: "Endgame Gear claw-grip competitive wireless lineup consists of 2 models.",
      officialSourceUrl: "https://www.endgamegear.com/en-us/mice",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "OP1we Wireless", "XM2we Wireless"
      ],
      totalQualifyingModels: 2,
      sourceRegion: "GLOBAL",
    },
  ],
  entries: [
    // Logitech (5 models)
    ...[
      { id: "logitech-mx-master-3s", model: "MX Master 3S", dpi: 8000, conn: "Bluetooth / Bolt", weight: 141, buttons: 7, silent: true, battery: 1680 },
      { id: "logitech-mx-anywhere-3s", model: "MX Anywhere 3S", dpi: 8000, conn: "Bluetooth / Bolt", weight: 99, buttons: 6, silent: true, battery: 1680 },
      { id: "logitech-g-pro-x-superlight-2", model: "G PRO X SUPERLIGHT 2", dpi: 32000, conn: "LIGHTSPEED Wireless", weight: 60, buttons: 5, silent: false, battery: 95 },
      { id: "logitech-g502-x-plus", model: "G502 X PLUS LIGHTSPEED", dpi: 25600, conn: "LIGHTSPEED Wireless", weight: 106, buttons: 13, silent: false, battery: 120 },
      { id: "logitech-lift-vertical", model: "Lift Vertical Ergonomic", dpi: 4000, conn: "Bluetooth / Bolt", weight: 125, buttons: 6, silent: true, battery: 4320 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Logitech",
      displayBrand: "Logitech",
      productLine: "MX / G PRO",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.logitech.com/products/mice/${m.id.replace("logitech-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Graphite", "Pale Grey", "Rose"],
      mediaSource: { url: `https://resource.logitech.com/image/${m.id}.png` },
      collectedAttributes: { brand: "logitech", modelName: m.model.toLowerCase(), sensorDpi: m.dpi, connectivity: m.conn, weightGrams: m.weight, buttonCount: m.buttons, silentClicks: m.silent, batteryHours: m.battery },
      missingAttributes: [],
      inclusionReason: `Logitech precision mouse ${m.model}`,
      status: "staged" as const,
    })),

    // Razer (5 models)
    ...[
      { id: "razer-deathadder-v3-pro", model: "DeathAdder V3 Pro", dpi: 30000, conn: "HyperSpeed Wireless", weight: 63, buttons: 5, silent: false, battery: 90 },
      { id: "razer-viper-v3-pro", model: "Viper V3 Pro", dpi: 35000, conn: "HyperSpeed Wireless", weight: 54, buttons: 6, silent: false, battery: 95 },
      { id: "razer-basilisk-v3-pro", model: "Basilisk V3 Pro", dpi: 30000, conn: "HyperSpeed Wireless", weight: 112, buttons: 11, silent: false, battery: 90 },
      { id: "razer-cobra-pro", model: "Cobra Pro", dpi: 30000, conn: "HyperSpeed Wireless", weight: 77, buttons: 10, silent: false, battery: 100 },
      { id: "razer-naga-v2-pro", model: "Naga V2 Pro", dpi: 30000, conn: "HyperSpeed Wireless", weight: 134, buttons: 22, silent: false, battery: 150 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Razer",
      displayBrand: "Razer",
      productLine: "DeathAdder / Viper / Basilisk",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.razer.com/gaming-mice/${m.id.replace("razer-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Black", "White"],
      mediaSource: { url: `https://assets3.razerzone.com/images/${m.id}.png` },
      collectedAttributes: { brand: "razer", modelName: m.model.toLowerCase(), sensorDpi: m.dpi, connectivity: m.conn, weightGrams: m.weight, buttonCount: m.buttons, silentClicks: m.silent, batteryHours: m.battery },
      missingAttributes: [],
      inclusionReason: `Razer esports wireless mouse ${m.model}`,
      status: "staged" as const,
    })),

    // SteelSeries (4 models)
    ...[
      { id: "steelseries-aerox-3-wireless", model: "Aerox 3 Wireless", dpi: 18000, conn: "Quantum 2.0 Wireless", weight: 68, buttons: 6, silent: false, battery: 200 },
      { id: "steelseries-aerox-5-wireless", model: "Aerox 5 Wireless", dpi: 18000, conn: "Quantum 2.0 Wireless", weight: 74, buttons: 9, silent: false, battery: 180 },
      { id: "steelseries-rival-5", model: "Rival 5", dpi: 18000, conn: "USB Wired", weight: 85, buttons: 9, silent: false, battery: 0 },
      { id: "steelseries-prime-wireless", model: "Prime Wireless", dpi: 18000, conn: "Quantum 2.0 Wireless", weight: 80, buttons: 6, silent: false, battery: 100 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "SteelSeries",
      displayBrand: "SteelSeries",
      productLine: "Aerox / Rival / Prime",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://steelseries.com/gaming-mice/${m.id.replace("steelseries-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Matte Black", "Snow"],
      mediaSource: { url: `https://media.steelseries.com/thumbs/${m.id}.png` },
      collectedAttributes: { brand: "steelseries", modelName: m.model.toLowerCase(), sensorDpi: m.dpi, connectivity: m.conn, weightGrams: m.weight, buttonCount: m.buttons, silentClicks: m.silent, batteryHours: m.battery > 0 ? m.battery : undefined },
      missingAttributes: [],
      inclusionReason: `SteelSeries tournament mouse ${m.model}`,
      status: "staged" as const,
    })),

    // Corsair (4 models)
    ...[
      { id: "corsair-dark-core-rgb-pro-se", model: "DARK CORE RGB PRO SE", dpi: 18000, conn: "SLIPSTREAM Wireless / Qi", weight: 142, buttons: 8, silent: false, battery: 50 },
      { id: "corsair-scimitar-rgb-elite", model: "SCIMITAR RGB ELITE", dpi: 18000, conn: "USB Wired", weight: 122, buttons: 17, silent: false, battery: 0 },
      { id: "corsair-m65-rgb-ultra", model: "M65 RGB ULTRA", dpi: 26000, conn: "USB Wired", weight: 97, buttons: 8, silent: false, battery: 0 },
      { id: "corsair-katar-pro-xt", model: "KATAR PRO XT", dpi: 18000, conn: "USB Wired", weight: 73, buttons: 6, silent: false, battery: 0 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Corsair",
      displayBrand: "Corsair",
      productLine: "DARK CORE / SCIMITAR / M65",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.corsair.com/p/${m.id.replace("corsair-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Black"],
      mediaSource: { url: `https://assets.corsair.com/image/upload/${m.id}.png` },
      collectedAttributes: { brand: "corsair", modelName: m.model.toLowerCase(), sensorDpi: m.dpi, connectivity: m.conn, weightGrams: m.weight, buttonCount: m.buttons, silentClicks: m.silent, batteryHours: m.battery > 0 ? m.battery : undefined },
      missingAttributes: [],
      inclusionReason: `Corsair high-polling mouse ${m.model}`,
      status: "staged" as const,
    })),

    // ASUS (4 models)
    ...[
      { id: "asus-rog-harpe-ace", model: "ROG Harpe Ace Aim Lab", dpi: 36000, conn: "SpeedNova Wireless / BT", weight: 54, buttons: 5, silent: false, battery: 90 },
      { id: "asus-rog-spatha-x", model: "ROG Spatha X", dpi: 19000, conn: "RF 2.4GHz / Wired", weight: 168, buttons: 12, silent: false, battery: 67 },
      { id: "asus-rog-chakram-x", model: "ROG Chakram X", dpi: 36000, conn: "RF 2.4GHz / BT / Wired", weight: 127, buttons: 11, silent: false, battery: 114 },
      { id: "asus-rog-gladius-iii-wireless", model: "ROG Gladius III Wireless", dpi: 26000, conn: "RF 2.4GHz / BT / Wired", weight: 89, buttons: 6, silent: false, battery: 85 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "ASUS",
      displayBrand: "ASUS ROG",
      productLine: "ROG Harpe / Spatha / Chakram",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://rog.asus.com/mice-mouse-pads/mice-group/${m.id.replace("asus-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Black", "Moonlight White"],
      mediaSource: { url: `https://dlcdnwebimgs.asus.com/gain/${m.id}.png` },
      collectedAttributes: { brand: "asus", modelName: m.model.toLowerCase(), sensorDpi: m.dpi, connectivity: m.conn, weightGrams: m.weight, buttonCount: m.buttons, silentClicks: m.silent, batteryHours: m.battery },
      missingAttributes: [],
      inclusionReason: `ASUS ROG lightweight esports mouse ${m.model}`,
      status: "staged" as const,
    })),

    // HyperX (3 models)
    ...[
      { id: "hyperx-pulsefire-haste-2-wireless", model: "Pulsefire Haste 2 Wireless", dpi: 26000, conn: "2.4GHz Wireless / BT", weight: 61, buttons: 6, silent: false, battery: 100 },
      { id: "hyperx-pulsefire-dart", model: "Pulsefire Dart", dpi: 16000, conn: "2.4GHz Wireless / Qi", weight: 110, buttons: 6, silent: false, battery: 50 },
      { id: "hyperx-pulsefire-raid", model: "Pulsefire Raid", dpi: 16000, conn: "USB Wired", weight: 95, buttons: 11, silent: false, battery: 0 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "HyperX",
      displayBrand: "HyperX",
      productLine: "Pulsefire",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://hyperx.com/products/${m.id.replace("hyperx-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Black", "White"],
      mediaSource: { url: `https://row.hyperx.com/cdn/shop/products/${m.id}.png` },
      collectedAttributes: { brand: "hyperx", modelName: m.model.toLowerCase(), sensorDpi: m.dpi, connectivity: m.conn, weightGrams: m.weight, buttonCount: m.buttons, silentClicks: m.silent, batteryHours: m.battery > 0 ? m.battery : undefined },
      missingAttributes: [],
      inclusionReason: `HyperX ultra-light mouse ${m.model}`,
      status: "staged" as const,
    })),

    // BenQ ZOWIE (4 models)
    ...[
      { id: "zowie-ec2-cw-wireless", model: "EC2-CW Wireless", dpi: 3200, conn: "2.4GHz Enhanced Wireless", weight: 77, buttons: 5, silent: false, battery: 70 },
      { id: "zowie-ec1-cw-wireless", model: "EC1-CW Wireless", dpi: 3200, conn: "2.4GHz Enhanced Wireless", weight: 79, buttons: 5, silent: false, battery: 70 },
      { id: "zowie-fk2-b", model: "FK2-B", dpi: 3200, conn: "USB Wired", weight: 80, buttons: 5, silent: false, battery: 0 },
      { id: "zowie-s2-c", model: "S2-C", dpi: 3200, conn: "USB Wired", weight: 69, buttons: 5, silent: false, battery: 0 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "BenQ ZOWIE",
      displayBrand: "BenQ ZOWIE",
      productLine: "EC / FK / S Series",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://zowie.benq.com/en-us/mouse/${m.id.replace("zowie-", "")}.html`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Matte Black"],
      mediaSource: { url: `https://zowie.benq.com/images/${m.id}.png` },
      collectedAttributes: { brand: "benq zowie", modelName: m.model.toLowerCase(), sensorDpi: m.dpi, connectivity: m.conn, weightGrams: m.weight, buttonCount: m.buttons, silentClicks: m.silent, batteryHours: m.battery > 0 ? m.battery : undefined },
      missingAttributes: [],
      inclusionReason: `ZOWIE tournament esports standard ${m.model}`,
      status: "staged" as const,
    })),

    // Glorious (3 models)
    ...[
      { id: "glorious-model-o-2-wireless", model: "Model O 2 Wireless", dpi: 26000, conn: "2.4GHz / Bluetooth", weight: 68, buttons: 6, silent: false, battery: 210 },
      { id: "glorious-model-d-2-wireless", model: "Model D 2 Wireless", dpi: 26000, conn: "2.4GHz / Bluetooth", weight: 66, buttons: 6, silent: false, battery: 210 },
      { id: "glorious-model-i-2-wireless", model: "Model I 2 Wireless", dpi: 26000, conn: "2.4GHz / Bluetooth", weight: 75, buttons: 9, silent: false, battery: 210 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Glorious",
      displayBrand: "Glorious",
      productLine: "Model O / D / I",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.gloriousgaming.com/products/${m.id.replace("glorious-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Matte Black", "Matte White"],
      mediaSource: { url: `https://www.gloriousgaming.com/cdn/shop/products/${m.id}.png` },
      collectedAttributes: { brand: "glorious", modelName: m.model.toLowerCase(), sensorDpi: m.dpi, connectivity: m.conn, weightGrams: m.weight, buttonCount: m.buttons, silentClicks: m.silent, batteryHours: m.battery },
      missingAttributes: [],
      inclusionReason: `Glorious ultralight gaming mouse ${m.model}`,
      status: "staged" as const,
    })),

    // Pulsar (3 models)
    ...[
      { id: "pulsar-x2-v2-wireless", model: "X2 V2 Wireless", dpi: 26000, conn: "2.4GHz Wireless", weight: 53, buttons: 5, silent: false, battery: 100 },
      { id: "pulsar-x2h-wireless", model: "X2H Wireless", dpi: 26000, conn: "2.4GHz Wireless", weight: 54, buttons: 5, silent: false, battery: 100 },
      { id: "pulsar-xlite-v3-wireless", model: "Xlite V3 Wireless", dpi: 26000, conn: "2.4GHz Wireless", weight: 55, buttons: 5, silent: false, battery: 100 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Pulsar",
      displayBrand: "Pulsar",
      productLine: "X2 / X2H / Xlite",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.pulsar.gg/products/${m.id.replace("pulsar-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Black", "White"],
      mediaSource: { url: `https://www.pulsar.gg/cdn/shop/products/${m.id}.png` },
      collectedAttributes: { brand: "pulsar", modelName: m.model.toLowerCase(), sensorDpi: m.dpi, connectivity: m.conn, weightGrams: m.weight, buttonCount: m.buttons, silentClicks: m.silent, batteryHours: m.battery },
      missingAttributes: [],
      inclusionReason: `Pulsar optical microswitch mouse ${m.model}`,
      status: "staged" as const,
    })),

    // Finalmouse (2 models)
    ...[
      { id: "finalmouse-ultralightx", model: "UltralightX", dpi: 26000, conn: "Wireless 4000Hz", weight: 29, buttons: 5, silent: false, battery: 80 },
      { id: "finalmouse-starlight-12", model: "Starlight-12", dpi: 20000, conn: "Wireless 1000Hz", weight: 42, buttons: 5, silent: false, battery: 160 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Finalmouse",
      displayBrand: "Finalmouse",
      productLine: "Ultralight / Starlight",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://finalmouse.com/products/${m.id.replace("finalmouse-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Phantom", "Lion", "Pegasus"],
      mediaSource: { url: `https://finalmouse.com/images/${m.id}.png` },
      collectedAttributes: { brand: "finalmouse", modelName: m.model.toLowerCase(), sensorDpi: m.dpi, connectivity: m.conn, weightGrams: m.weight, buttonCount: m.buttons, silentClicks: m.silent, batteryHours: m.battery },
      missingAttributes: [],
      inclusionReason: `Finalmouse carbon composite lightweight mouse ${m.model}`,
      status: "staged" as const,
    })),

    // Endgame Gear (2 models)
    ...[
      { id: "endgame-gear-op1we", model: "OP1we Wireless", dpi: 19000, conn: "2.4GHz Wireless", weight: 58.5, buttons: 5, silent: false, battery: 70 },
      { id: "endgame-gear-xm2we", model: "XM2we Wireless", dpi: 19000, conn: "2.4GHz Wireless", weight: 63, buttons: 5, silent: false, battery: 70 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Endgame Gear",
      displayBrand: "Endgame Gear",
      productLine: "OP1 / XM2",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.endgamegear.com/en-us/mice/${m.id.replace("endgame-gear-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Black", "White"],
      mediaSource: { url: `https://www.endgamegear.com/images/${m.id}.png` },
      collectedAttributes: { brand: "endgame gear", modelName: m.model.toLowerCase(), sensorDpi: m.dpi, connectivity: m.conn, weightGrams: m.weight, buttonCount: m.buttons, silentClicks: m.silent, batteryHours: m.battery },
      missingAttributes: [],
      inclusionReason: `Endgame Gear Kailh GO claw mouse ${m.model}`,
      status: "staged" as const,
    })),
  ],
};

const validated = censusManifestFileSchema.parse(miceCensus);
const outPath = resolve(process.cwd(), "catalog/census/mice.json");
writeFileSync(outPath, JSON.stringify(validated, null, 2), "utf-8");
console.log(`Saved mice.json with ${validated.entries.length} models across 11 brands.`);
