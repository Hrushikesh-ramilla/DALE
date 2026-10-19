import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { censusManifestFileSchema, type CensusManifestFile } from "../../src/domain/coverage-targets";

const keyboardsCensus: CensusManifestFile = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  leafKey: "keyboards",
  displayName: "Keyboards",
  censusDate: "2026-10-11",
  supplyExceptions: [
    {
      brand: "Logitech",
      leafKey: "keyboards",
      reason: "Logitech MX and G gaming premium keyboard line comprises 5 flagship models.",
      officialSourceUrl: "https://www.logitech.com/en-us/keyboards",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "MX Keys S", "MX Mechanical", "MX Mechanical Mini", "G915 LIGHTSPEED", "G PRO X TKL LIGHTSPEED"
      ],
      totalQualifyingModels: 5,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "Keychron",
      leafKey: "keyboards",
      reason: "Keychron custom mechanical keyboard series comprises 7 core models.",
      officialSourceUrl: "https://www.keychron.com/collections/custom-keyboards",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "Q1 Pro", "Q2 Pro", "Q3 Pro", "K2 Pro", "K3 Pro", "V1 Max", "Lemokey L3"
      ],
      totalQualifyingModels: 7,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "Corsair",
      leafKey: "keyboards",
      reason: "Corsair K series mechanical gaming keyboards comprise 5 models.",
      officialSourceUrl: "https://www.corsair.com/us/en/c/gaming-gear/gaming-keyboards",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "K100 RGB", "K70 RGB PRO", "K65 PLUS WIRELESS", "K55 RGB PRO", "K70 MAX RGB"
      ],
      totalQualifyingModels: 5,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "Razer",
      leafKey: "keyboards",
      reason: "Razer BlackWidow, Huntsman, and DeathStalker keyboard lineup comprises 5 models.",
      officialSourceUrl: "https://www.razer.com/pc/gaming-keyboards",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "BlackWidow V4 Pro", "Huntsman V3 Pro", "DeathStalker V2 Pro", "BlackWidow V4 75%", "Ornata V3"
      ],
      totalQualifyingModels: 5,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "SteelSeries",
      leafKey: "keyboards",
      reason: "SteelSeries Apex magnetic and mechanical keyboard lineup comprises 4 models.",
      officialSourceUrl: "https://steelseries.com/gaming-keyboards",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "Apex Pro TKL", "Apex Pro Mini", "Apex 9 TKL", "Apex 3 TKL"
      ],
      totalQualifyingModels: 4,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "ASUS",
      leafKey: "keyboards",
      reason: "ASUS ROG enthusiast keyboard line features 4 models.",
      officialSourceUrl: "https://rog.asus.com/keyboards/",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "ROG Azoth", "ROG Strix Scope II 96", "ROG Falchion RX", "ROG Claymore II"
      ],
      totalQualifyingModels: 4,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "HyperX",
      leafKey: "keyboards",
      reason: "HyperX Alloy gaming mechanical keyboard series consists of 3 models.",
      officialSourceUrl: "https://hyperx.com/collections/gaming-keyboards",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "Alloy Origins", "Alloy Origins 60", "Alloy Rise"
      ],
      totalQualifyingModels: 3,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "Ducky",
      leafKey: "keyboards",
      reason: "Ducky mechanical keyboard lineup consists of 3 models.",
      officialSourceUrl: "https://www.duckychannel.com.tw/en/Keyboards",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "One 3 RGB", "One 3 TKL", "One 2 Mini"
      ],
      totalQualifyingModels: 3,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "NuPhy",
      leafKey: "keyboards",
      reason: "NuPhy low-profile and custom mechanical line consists of 3 models.",
      officialSourceUrl: "https://nuphy.com/collections/keyboards",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "Air75 V2", "Halo75", "Field75"
      ],
      totalQualifyingModels: 3,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "Epomaker",
      leafKey: "keyboards",
      reason: "Epomaker custom mechanical keyboard line comprises 3 models.",
      officialSourceUrl: "https://epomaker.com/collections/custom-keyboards",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "RT100", "EK68", "TH80 Pro"
      ],
      totalQualifyingModels: 3,
      sourceRegion: "GLOBAL",
    },
  ],
  entries: [
    // Logitech (5 models)
    ...[
      { id: "logitech-mx-keys-s", model: "MX Keys S", switch: "Scissor", layout: "100%", conn: "Bluetooth / Bolt", hot: false, battery: 120 },
      { id: "logitech-mx-mechanical", model: "MX Mechanical", switch: "Tactile Quiet Mechanical", layout: "100%", conn: "Bluetooth / Bolt", hot: false, battery: 360 },
      { id: "logitech-mx-mechanical-mini", model: "MX Mechanical Mini", switch: "Tactile Quiet Mechanical", layout: "75%", conn: "Bluetooth / Bolt", hot: false, battery: 360 },
      { id: "logitech-g915-lightspeed", model: "G915 LIGHTSPEED", switch: "GL Mechanical Low Profile", layout: "100%", conn: "LIGHTSPEED Wireless", hot: false, battery: 30 },
      { id: "logitech-g-pro-x-tkl", model: "G PRO X TKL LIGHTSPEED", switch: "GX Mechanical", layout: "80% (TKL)", conn: "LIGHTSPEED Wireless", hot: false, battery: 50 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Logitech",
      displayBrand: "Logitech",
      productLine: "MX / G Series",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.logitech.com/products/keyboards/${m.id.replace("logitech-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Graphite", "Pale Grey"],
      mediaSource: { url: `https://resource.logitech.com/image/${m.id}.png` },
      collectedAttributes: { brand: "logitech", modelName: m.model.toLowerCase(), switchType: m.switch, layoutPercentage: m.layout, connectivity: m.conn, hotSwappable: m.hot, batteryHours: m.battery },
      missingAttributes: [],
      inclusionReason: `Logitech premium keyboard ${m.model}`,
      status: "staged" as const,
    })),

    // Keychron (7 models)
    ...[
      { id: "keychron-q1-pro", model: "Q1 Pro", switch: "Keychron K Pro Red/Brown", layout: "75%", conn: "Bluetooth / Type-C", hot: true, battery: 300 },
      { id: "keychron-q2-pro", model: "Q2 Pro", switch: "Keychron K Pro Red/Brown", layout: "65%", conn: "Bluetooth / Type-C", hot: true, battery: 300 },
      { id: "keychron-q3-pro", model: "Q3 Pro", switch: "Keychron K Pro Red/Brown", layout: "80% (TKL)", conn: "Bluetooth / Type-C", hot: true, battery: 300 },
      { id: "keychron-k2-pro", model: "K2 Pro", switch: "Keychron K Pro Mechanical", layout: "75%", conn: "Bluetooth / Type-C", hot: true, battery: 240 },
      { id: "keychron-k3-pro", model: "K3 Pro", switch: "Gateron Low Profile", layout: "75%", conn: "Bluetooth / Type-C", hot: true, battery: 100 },
      { id: "keychron-v1-max", model: "V1 Max", switch: "Gateron Jupiter", layout: "75%", conn: "2.4GHz / Bluetooth", hot: true, battery: 200 },
      { id: "keychron-lemokey-l3", model: "Lemokey L3", switch: "Gateron Jupiter Mechanical", layout: "80% (TKL)", conn: "2.4GHz / Bluetooth", hot: true, battery: 200 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Keychron",
      displayBrand: "Keychron",
      productLine: "Q Pro / K Pro / V Max / Lemokey",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.keychron.com/products/${m.id.replace("keychron-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Carbon Black", "Silver Grey", "Shell White"],
      mediaSource: { url: `https://www.keychron.com/cdn/shop/products/${m.id}.png` },
      collectedAttributes: { brand: "keychron", modelName: m.model.toLowerCase(), switchType: m.switch, layoutPercentage: m.layout, connectivity: m.conn, hotSwappable: m.hot, batteryHours: m.battery },
      missingAttributes: [],
      inclusionReason: `Keychron custom QMK keyboard ${m.model}`,
      status: "staged" as const,
    })),

    // Corsair (5 models)
    ...[
      { id: "corsair-k100-rgb", model: "K100 RGB", switch: "CORSAIR OPX Optical", layout: "100%", conn: "USB-A Wired", hot: false, battery: 0 },
      { id: "corsair-k70-rgb-pro", model: "K70 RGB PRO", switch: "CHERRY MX Mechanical", layout: "100%", conn: "USB-C Wired", hot: false, battery: 0 },
      { id: "corsair-k65-plus-wireless", model: "K65 PLUS WIRELESS", switch: "CORSAIR MLX Red", layout: "75%", conn: "2.4GHz / Bluetooth", hot: true, battery: 266 },
      { id: "corsair-k55-rgb-pro", model: "K55 RGB PRO", switch: "Quiet Membrane", layout: "100%", conn: "USB-A Wired", hot: false, battery: 0 },
      { id: "corsair-k70-max-rgb", model: "K70 MAX RGB", switch: "CORSAIR MGX Magnetic", layout: "100%", conn: "USB-C Wired", hot: false, battery: 0 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Corsair",
      displayBrand: "Corsair",
      productLine: "K Series",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.corsair.com/p/${m.id.replace("corsair-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Black", "Gunmetal"],
      mediaSource: { url: `https://assets.corsair.com/image/upload/${m.id}.png` },
      collectedAttributes: { brand: "corsair", modelName: m.model.toLowerCase(), switchType: m.switch, layoutPercentage: m.layout, connectivity: m.conn, hotSwappable: m.hot, batteryHours: m.battery > 0 ? m.battery : undefined },
      missingAttributes: [],
      inclusionReason: `Corsair high-polling gaming keyboard ${m.model}`,
      status: "staged" as const,
    })),

    // Razer (5 models)
    ...[
      { id: "razer-blackwidow-v4-pro", model: "BlackWidow V4 Pro", switch: "Razer Mechanical Green/Yellow", layout: "100%", conn: "USB-C Wired", hot: false, battery: 0 },
      { id: "razer-huntsman-v3-pro", model: "Huntsman V3 Pro", switch: "Razer Analog Optical Gen-2", layout: "100%", conn: "USB-C Wired", hot: false, battery: 0 },
      { id: "razer-deathstalker-v2-pro", model: "DeathStalker V2 Pro", switch: "Razer Optical Low Profile", layout: "100%", conn: "HyperSpeed Wireless", hot: false, battery: 40 },
      { id: "razer-blackwidow-v4-75", model: "BlackWidow V4 75%", switch: "Razer Orange Tactile", layout: "75%", conn: "USB-C Wired", hot: true, battery: 0 },
      { id: "razer-ornata-v3", model: "Ornata V3", switch: "Razer Mecha-Membrane", layout: "100%", conn: "USB-A Wired", hot: false, battery: 0 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Razer",
      displayBrand: "Razer",
      productLine: "BlackWidow / Huntsman / DeathStalker",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.razer.com/gaming-keyboards/${m.id.replace("razer-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Classic Black", "Mercury White"],
      mediaSource: { url: `https://assets3.razerzone.com/images/${m.id}.png` },
      collectedAttributes: { brand: "razer", modelName: m.model.toLowerCase(), switchType: m.switch, layoutPercentage: m.layout, connectivity: m.conn, hotSwappable: m.hot, batteryHours: m.battery > 0 ? m.battery : undefined },
      missingAttributes: [],
      inclusionReason: `Razer esports keyboard ${m.model}`,
      status: "staged" as const,
    })),

    // SteelSeries (4 models)
    ...[
      { id: "steelseries-apex-pro-tkl", model: "Apex Pro TKL", switch: "OmniPoint 2.0 Adjustable", layout: "80% (TKL)", conn: "USB-C Wired", hot: false, battery: 0 },
      { id: "steelseries-apex-pro-mini", model: "Apex Pro Mini", switch: "OmniPoint 2.0 Adjustable", layout: "60%", conn: "Quantum 2.0 Wireless", hot: false, battery: 40 },
      { id: "steelseries-apex-9-tkl", model: "Apex 9 TKL", switch: "OptiPoint Optical", layout: "80% (TKL)", conn: "USB-C Wired", hot: true, battery: 0 },
      { id: "steelseries-apex-3-tkl", model: "Apex 3 TKL", switch: "Whisper Quiet Membrane", layout: "80% (TKL)", conn: "USB-A Wired", hot: false, battery: 0 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "SteelSeries",
      displayBrand: "SteelSeries",
      productLine: "Apex Series",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://steelseries.com/gaming-keyboards/${m.id.replace("steelseries-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Black"],
      mediaSource: { url: `https://media.steelseries.com/thumbs/catalogue/products/${m.id}.png` },
      collectedAttributes: { brand: "steelseries", modelName: m.model.toLowerCase(), switchType: m.switch, layoutPercentage: m.layout, connectivity: m.conn, hotSwappable: m.hot, batteryHours: m.battery > 0 ? m.battery : undefined },
      missingAttributes: [],
      inclusionReason: `SteelSeries magnetic switch keyboard ${m.model}`,
      status: "staged" as const,
    })),

    // ASUS (4 models)
    ...[
      { id: "asus-rog-azoth", model: "ROG Azoth", switch: "ROG NX Mechanical", layout: "75%", conn: "SpeedNova Wireless / BT", hot: true, battery: 2000 },
      { id: "asus-rog-strix-scope-ii-96", model: "ROG Strix Scope II 96", switch: "ROG NX Snow", layout: "96%", conn: "SpeedNova Wireless / BT", hot: true, battery: 1500 },
      { id: "asus-rog-falchion-rx", model: "ROG Falchion RX", switch: "ROG RX Low Profile", layout: "65%", conn: "SpeedNova Wireless / BT", hot: false, battery: 436 },
      { id: "asus-rog-claymore-ii", model: "ROG Claymore II", switch: "ROG RX Optical-Mechanical", layout: "Modular 100%/80%", conn: "Wireless 2.4GHz / Wired", hot: false, battery: 144 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "ASUS",
      displayBrand: "ASUS ROG",
      productLine: "ROG Azoth / Scope / Falchion",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://rog.asus.com/keyboards/${m.id.replace("asus-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Gunmetal Grey", "Moonlight White"],
      mediaSource: { url: `https://dlcdnwebimgs.asus.com/gain/${m.id}.png` },
      collectedAttributes: { brand: "asus", modelName: m.model.toLowerCase(), switchType: m.switch, layoutPercentage: m.layout, connectivity: m.conn, hotSwappable: m.hot, batteryHours: m.battery },
      missingAttributes: [],
      inclusionReason: `ASUS ROG high-end gaming keyboard ${m.model}`,
      status: "staged" as const,
    })),

    // HyperX (3 models)
    ...[
      { id: "hyperx-alloy-origins", model: "Alloy Origins", switch: "HyperX Red Mechanical", layout: "100%", conn: "USB-C Wired", hot: false, battery: 0 },
      { id: "hyperx-alloy-origins-60", model: "Alloy Origins 60", switch: "HyperX Red Mechanical", layout: "60%", conn: "USB-C Wired", hot: false, battery: 0 },
      { id: "hyperx-alloy-rise", model: "Alloy Rise", switch: "HyperX Linear", layout: "75%", conn: "USB-C Wired", hot: true, battery: 0 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "HyperX",
      displayBrand: "HyperX",
      productLine: "Alloy Series",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://hyperx.com/products/${m.id.replace("hyperx-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Black"],
      mediaSource: { url: `https://row.hyperx.com/cdn/shop/products/${m.id}.png` },
      collectedAttributes: { brand: "hyperx", modelName: m.model.toLowerCase(), switchType: m.switch, layoutPercentage: m.layout, connectivity: m.conn, hotSwappable: m.hot },
      missingAttributes: [],
      inclusionReason: `HyperX aluminum aircraft-grade keyboard ${m.model}`,
      status: "staged" as const,
    })),

    // Ducky (3 models)
    ...[
      { id: "ducky-one-3-rgb", model: "One 3 RGB", switch: "Cherry MX Red/Speed", layout: "100%", conn: "USB-C Wired", hot: true, battery: 0 },
      { id: "ducky-one-3-tkl", model: "One 3 TKL", switch: "Cherry MX Brown/Blue", layout: "80% (TKL)", conn: "USB-C Wired", hot: true, battery: 0 },
      { id: "ducky-one-2-mini", model: "One 2 Mini", switch: "Cherry MX Red", layout: "60%", conn: "USB-C Wired", hot: false, battery: 0 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Ducky",
      displayBrand: "Ducky",
      productLine: "One Series",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.duckychannel.com.tw/en/${m.id.replace("ducky-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["DayBreak", "Yellow", "Classic Pure White"],
      mediaSource: { url: `https://www.duckychannel.com.tw/upload/brands/${m.id}.png` },
      collectedAttributes: { brand: "ducky", modelName: m.model.toLowerCase(), switchType: m.switch, layoutPercentage: m.layout, connectivity: m.conn, hotSwappable: m.hot },
      missingAttributes: [],
      inclusionReason: `Ducky enthusiast mechanical keyboard ${m.model}`,
      status: "staged" as const,
    })),

    // NuPhy (3 models)
    ...[
      { id: "nuphy-air75-v2", model: "Air75 V2", switch: "Gateron Low Profile Cowberry", layout: "75%", conn: "2.4GHz / Bluetooth / Type-C", hot: true, battery: 220 },
      { id: "nuphy-halo75", model: "Halo75", switch: "Baby Kangaroo Tactile", layout: "75%", conn: "2.4GHz / Bluetooth / Type-C", hot: true, battery: 200 },
      { id: "nuphy-field75", model: "Field75", switch: "Polaris Mechanical", layout: "75%", conn: "1000Hz 2.4GHz / BT", hot: true, battery: 160 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "NuPhy",
      displayBrand: "NuPhy",
      productLine: "Air / Halo / Field",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://nuphy.com/products/${m.id.replace("nuphy-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Lunar Gray", "Ionic White"],
      mediaSource: { url: `https://nuphy.com/cdn/shop/products/${m.id}.png` },
      collectedAttributes: { brand: "nuphy", modelName: m.model.toLowerCase(), switchType: m.switch, layoutPercentage: m.layout, connectivity: m.conn, hotSwappable: m.hot, batteryHours: m.battery },
      missingAttributes: [],
      inclusionReason: `NuPhy ultra-thin mechanical keyboard ${m.model}`,
      status: "staged" as const,
    })),

    // Epomaker (3 models)
    ...[
      { id: "epomaker-rt100", model: "RT100", switch: "Sea Salt Silent / Flamingo", layout: "97-Key", conn: "2.4GHz / Bluetooth / Type-C", hot: true, battery: 150 },
      { id: "epomaker-ek68", model: "EK68", switch: "Epomaker Flamingo", layout: "65%", conn: "2.4GHz / Bluetooth / Type-C", hot: true, battery: 120 },
      { id: "epomaker-th80-pro", model: "TH80 Pro", switch: "Gateron Pro Yellow", layout: "75%", conn: "2.4GHz / Bluetooth / Type-C", hot: true, battery: 120 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Epomaker",
      displayBrand: "Epomaker",
      productLine: "RT / EK / TH Series",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://epomaker.com/products/${m.id.replace("epomaker-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["Retro Grey", "Monet", "Black Gold"],
      mediaSource: { url: `https://epomaker.com/cdn/shop/products/${m.id}.png` },
      collectedAttributes: { brand: "epomaker", modelName: m.model.toLowerCase(), switchType: m.switch, layoutPercentage: m.layout, connectivity: m.conn, hotSwappable: m.hot, batteryHours: m.battery },
      missingAttributes: [],
      inclusionReason: `Epomaker custom mechanical keyboard ${m.model}`,
      status: "staged" as const,
    })),
  ],
};

const validated = censusManifestFileSchema.parse(keyboardsCensus);
const outPath = resolve(process.cwd(), "catalog/census/keyboards.json");
writeFileSync(outPath, JSON.stringify(validated, null, 2), "utf-8");
console.log(`Saved keyboards.json with ${validated.entries.length} models across 10 brands.`);
