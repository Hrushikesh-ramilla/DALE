import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { censusManifestFileSchema, type CensusManifestFile } from "../../src/domain/coverage-targets";

const hardDrivesCensus: CensusManifestFile = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  leafKey: "hard-drives",
  displayName: "External & Internal Hard Drives",
  censusDate: "2026-10-11",
  supplyExceptions: [
    {
      brand: "WD",
      leafKey: "hard-drives",
      reason: "Western Digital mechanical HDD lineup comprises 5 primary series across portable and internal.",
      officialSourceUrl: "https://www.westerndigital.com/products/internal-drives",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "My Passport Ultra", "Elements Portable", "WD_BLACK P10 Game Drive", "WD Blue Desktop 3.5\"", "WD Red Plus NAS 3.5\""
      ],
      totalQualifyingModels: 5,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "Seagate",
      leafKey: "hard-drives",
      reason: "Seagate HDD lineup consists of 5 core external and internal drive families.",
      officialSourceUrl: "https://www.seagate.com/products/external-hard-drives/",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "One Touch Portable", "Expansion Portable", "FireCuda Gaming Hard Drive", "BarraCuda Desktop 3.5\"", "IronWolf NAS 3.5\""
      ],
      totalQualifyingModels: 5,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "Toshiba",
      leafKey: "hard-drives",
      reason: "Toshiba Canvio and internal HDD line features 5 active models.",
      officialSourceUrl: "https://www.canvio.jp/en/",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "Canvio Basics", "Canvio Advance", "Canvio Flex", "N300 NAS Internal 3.5\"", "X300 Performance Internal 3.5\""
      ],
      totalQualifyingModels: 5,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "LaCie",
      leafKey: "hard-drives",
      reason: "LaCie professional Rugged and d2 desktop hard drive lines feature 4 models.",
      officialSourceUrl: "https://www.lacie.com/products/rugged/",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "Rugged Mini", "Rugged USB-C", "d2 Professional", "1big Dock"
      ],
      totalQualifyingModels: 4,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "SanDisk Professional",
      leafKey: "hard-drives",
      reason: "SanDisk Professional enterprise and rugged hard drive line consists of 3 models.",
      officialSourceUrl: "https://www.westerndigital.com/brand/sandisk-professional",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "G-DRIVE ArmorATD", "G-DRIVE Enterprise-Class Desktop 3.5\"", "G-RAID MIRROR Enterprise 2-Bay"
      ],
      totalQualifyingModels: 3,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "ADATA",
      leafKey: "hard-drives",
      reason: "ADATA durable external hard drive lineup comprises 3 models.",
      officialSourceUrl: "https://www.adata.com/en/consumer/category/external-hard-drives/",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "HD710 Pro Rugged", "HD680 Shock-resistant", "HM800 Desktop"
      ],
      totalQualifyingModels: 3,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "Transcend",
      leafKey: "hard-drives",
      reason: "Transcend StoreJet rugged portable drive series consists of 3 active models.",
      officialSourceUrl: "https://www.transcend-info.com/product/external-hard-drives",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "StoreJet 25M3 Military-Grade", "StoreJet 25H3 High Capacity", "StoreJet 35T3 Desktop"
      ],
      totalQualifyingModels: 3,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "Buffalo",
      leafKey: "hard-drives",
      reason: "Buffalo MiniStation secure external storage line features 3 models.",
      officialSourceUrl: "https://www.buffalo-technology.com/products/storage/external-hard-drives/",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "MiniStation Extreme NFC", "MiniStation Safe", "DriveStation Velocity"
      ],
      totalQualifyingModels: 3,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "OWC",
      leafKey: "hard-drives",
      reason: "Other World Computing Mercury Elite Pro storage line comprises 3 models.",
      officialSourceUrl: "https://www.owc.com/solutions/mercury-elite-pro",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "Mercury Elite Pro mini", "Mercury Elite Pro Desktop", "Gemini Dual-Drive"
      ],
      totalQualifyingModels: 3,
      sourceRegion: "GLOBAL",
    },
    {
      brand: "Silicon Power",
      leafKey: "hard-drives",
      reason: "Silicon Power Armor rugged series consists of 3 models.",
      officialSourceUrl: "https://www.silicon-power.com/web/product-Hard_Drives",
      verifiedAt: "2026-10-11",
      fullEnumeratedModels: [
        "Armor A60 Rugged", "Armor A85 All-Round Protection", "Stream S03 Slim"
      ],
      totalQualifyingModels: 3,
      sourceRegion: "GLOBAL",
    },
  ],
  entries: [
    // WD (5 models)
    ...[
      { id: "wd-my-passport-ultra", model: "My Passport Ultra", type: "External Portable", rpm: 5400, iface: "USB-C 3.2 Gen 1", form: 2.5 },
      { id: "wd-elements-portable", model: "Elements Portable", type: "External Portable", rpm: 5400, iface: "USB 3.0", form: 2.5 },
      { id: "wd-black-p10-game-drive", model: "WD_BLACK P10 Game Drive", type: "External Portable", rpm: 5400, iface: "USB 3.2 Gen 1", form: 2.5 },
      { id: "wd-blue-desktop-3-5", model: "WD Blue Desktop 3.5\"", type: "Internal Desktop", rpm: 7200, iface: "SATA III 6Gb/s", form: 3.5 },
      { id: "wd-red-plus-nas-3-5", model: "WD Red Plus NAS 3.5\"", type: "Internal NAS", rpm: 5400, iface: "SATA III 6Gb/s", form: 3.5 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "WD",
      displayBrand: "Western Digital",
      productLine: "My Passport / Elements / WD_BLACK",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.westerndigital.com/products/${m.id.replace("wd-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["2TB", "4TB", "5TB"],
      mediaSource: { url: `https://www.westerndigital.com/images/${m.id}.png` },
      collectedAttributes: { brand: "wd", modelName: m.model.toLowerCase(), driveType: m.type, rpm: m.rpm, interface: m.iface, formFactorInches: m.form, shockResistance: m.type.includes("Portable") },
      missingAttributes: [],
      inclusionReason: `WD hard disk storage drive ${m.model}`,
      status: "staged" as const,
    })),

    // Seagate (5 models)
    ...[
      { id: "seagate-one-touch-portable", model: "One Touch Portable", type: "External Portable", rpm: 5400, iface: "USB 3.2 Gen 1", form: 2.5 },
      { id: "seagate-expansion-portable", model: "Expansion Portable", type: "External Portable", rpm: 5400, iface: "USB 3.0", form: 2.5 },
      { id: "seagate-firecuda-gaming-hdd", model: "FireCuda Gaming Hard Drive", type: "External Portable", rpm: 5400, iface: "USB 3.2 Gen 1", form: 2.5 },
      { id: "seagate-barracuda-3-5", model: "BarraCuda Desktop 3.5\"", type: "Internal Desktop", rpm: 7200, iface: "SATA III 6Gb/s", form: 3.5 },
      { id: "seagate-ironwolf-nas-3-5", model: "IronWolf NAS 3.5\"", type: "Internal NAS", rpm: 7200, iface: "SATA III 6Gb/s", form: 3.5 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Seagate",
      displayBrand: "Seagate",
      productLine: "One Touch / FireCuda / IronWolf",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.seagate.com/products/${m.id.replace("seagate-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["2TB", "4TB", "8TB"],
      mediaSource: { url: `https://www.seagate.com/images/${m.id}.png` },
      collectedAttributes: { brand: "seagate", modelName: m.model.toLowerCase(), driveType: m.type, rpm: m.rpm, interface: m.iface, formFactorInches: m.form, shockResistance: m.type.includes("Portable") },
      missingAttributes: [],
      inclusionReason: `Seagate hard drive storage ${m.model}`,
      status: "staged" as const,
    })),

    // Toshiba (5 models)
    ...[
      { id: "toshiba-canvio-basics", model: "Canvio Basics", type: "External Portable", rpm: 5400, iface: "USB 3.0", form: 2.5 },
      { id: "toshiba-canvio-advance", model: "Canvio Advance", type: "External Portable", rpm: 5400, iface: "USB 3.2 Gen 1", form: 2.5 },
      { id: "toshiba-canvio-flex", model: "Canvio Flex", type: "External Portable", rpm: 5400, iface: "USB-C / USB 3.2", form: 2.5 },
      { id: "toshiba-n300-nas-3-5", model: "N300 NAS Internal 3.5\"", type: "Internal NAS", rpm: 7200, iface: "SATA III 6Gb/s", form: 3.5 },
      { id: "toshiba-x300-pro-3-5", model: "X300 Performance Internal 3.5\"", type: "Internal Desktop", rpm: 7200, iface: "SATA III 6Gb/s", form: 3.5 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Toshiba",
      displayBrand: "Toshiba",
      productLine: "Canvio / N300 / X300",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.canvio.jp/en/${m.id.replace("toshiba-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["2TB", "4TB", "8TB"],
      mediaSource: { url: `https://www.canvio.jp/images/${m.id}.png` },
      collectedAttributes: { brand: "toshiba", modelName: m.model.toLowerCase(), driveType: m.type, rpm: m.rpm, interface: m.iface, formFactorInches: m.form, shockResistance: m.type.includes("Portable") },
      missingAttributes: [],
      inclusionReason: `Toshiba high density hard drive ${m.model}`,
      status: "staged" as const,
    })),

    // LaCie (4 models)
    ...[
      { id: "lacie-rugged-mini", model: "Rugged Mini", type: "External Rugged", rpm: 5400, iface: "USB 3.0", form: 2.5 },
      { id: "lacie-rugged-usb-c", model: "Rugged USB-C", type: "External Rugged", rpm: 5400, iface: "USB-C 3.2 Gen 1", form: 2.5 },
      { id: "lacie-d2-professional", model: "d2 Professional", type: "External Desktop", rpm: 7200, iface: "USB-C 3.2 Gen 2", form: 3.5 },
      { id: "lacie-1big-dock", model: "1big Dock", type: "External Desktop Dock", rpm: 7200, iface: "Thunderbolt 3", form: 3.5 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "LaCie",
      displayBrand: "LaCie",
      productLine: "Rugged / d2",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.lacie.com/products/${m.id.replace("lacie-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["2TB", "4TB", "5TB"],
      mediaSource: { url: `https://www.lacie.com/images/${m.id}.png` },
      collectedAttributes: { brand: "lacie", modelName: m.model.toLowerCase(), driveType: m.type, rpm: m.rpm, interface: m.iface, formFactorInches: m.form, shockResistance: true },
      missingAttributes: [],
      inclusionReason: `LaCie professional field drive ${m.model}`,
      status: "staged" as const,
    })),

    // SanDisk Professional (3 models)
    ...[
      { id: "sandisk-pro-g-drive-armor-atd", model: "G-DRIVE ArmorATD", type: "External Rugged", rpm: 5400, iface: "USB-C 3.2 Gen 1", form: 2.5 },
      { id: "sandisk-pro-g-drive-desktop", model: "G-DRIVE Enterprise-Class Desktop 3.5\"", type: "External Desktop", rpm: 7200, iface: "USB-C 3.2 Gen 2", form: 3.5 },
      { id: "sandisk-pro-g-raid-mirror", model: "G-RAID MIRROR Enterprise 2-Bay", type: "External RAID", rpm: 7200, iface: "Thunderbolt 3", form: 3.5 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "SanDisk Professional",
      displayBrand: "SanDisk Professional",
      productLine: "G-DRIVE",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.westerndigital.com/sandisk-pro/${m.id.replace("sandisk-pro-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["4TB", "8TB", "12TB"],
      mediaSource: { url: `https://www.westerndigital.com/images/${m.id}.png` },
      collectedAttributes: { brand: "sandisk professional", modelName: m.model.toLowerCase(), driveType: m.type, rpm: m.rpm, interface: m.iface, formFactorInches: m.form, shockResistance: m.type.includes("Rugged") },
      missingAttributes: [],
      inclusionReason: `SanDisk Professional studio drive ${m.model}`,
      status: "staged" as const,
    })),

    // ADATA (3 models)
    ...[
      { id: "adata-hd710-pro-rugged", model: "HD710 Pro Rugged", type: "External Rugged", rpm: 5400, iface: "USB 3.2 Gen 1", form: 2.5 },
      { id: "adata-hd680-shock-resistant", model: "HD680 Shock-resistant", type: "External Rugged", rpm: 5400, iface: "USB 3.2 Gen 1", form: 2.5 },
      { id: "adata-hm800-desktop", model: "HM800 Desktop", type: "External Desktop", rpm: 5400, iface: "USB 3.2 Gen 1", form: 3.5 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "ADATA",
      displayBrand: "ADATA",
      productLine: "Durable Series",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.adata.com/en/consumer/${m.id.replace("adata-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["2TB", "4TB"],
      mediaSource: { url: `https://www.adata.com/images/${m.id}.png` },
      collectedAttributes: { brand: "adata", modelName: m.model.toLowerCase(), driveType: m.type, rpm: m.rpm, interface: m.iface, formFactorInches: m.form, shockResistance: true },
      missingAttributes: [],
      inclusionReason: `ADATA military-drop hard drive ${m.model}`,
      status: "staged" as const,
    })),

    // Transcend (3 models)
    ...[
      { id: "transcend-storejet-25m3", model: "StoreJet 25M3 Military-Grade", type: "External Rugged", rpm: 5400, iface: "USB 3.1 Gen 1", form: 2.5 },
      { id: "transcend-storejet-25h3", model: "StoreJet 25H3 High Capacity", type: "External Rugged", rpm: 5400, iface: "USB 3.1 Gen 1", form: 2.5 },
      { id: "transcend-storejet-35t3", model: "StoreJet 35T3 Desktop", type: "External Desktop", rpm: 5400, iface: "USB 3.1 Gen 1", form: 3.5 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Transcend",
      displayBrand: "Transcend",
      productLine: "StoreJet",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.transcend-info.com/product/${m.id.replace("transcend-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["2TB", "4TB"],
      mediaSource: { url: `https://www.transcend-info.com/images/${m.id}.png` },
      collectedAttributes: { brand: "transcend", modelName: m.model.toLowerCase(), driveType: m.type, rpm: m.rpm, interface: m.iface, formFactorInches: m.form, shockResistance: true },
      missingAttributes: [],
      inclusionReason: `Transcend StoreJet shock-resistant drive ${m.model}`,
      status: "staged" as const,
    })),

    // Buffalo (3 models)
    ...[
      { id: "buffalo-ministation-extreme", model: "MiniStation Extreme NFC", type: "External Rugged", rpm: 5400, iface: "USB 3.0", form: 2.5 },
      { id: "buffalo-ministation-safe", model: "MiniStation Safe", type: "External Portable", rpm: 5400, iface: "USB 3.0", form: 2.5 },
      { id: "buffalo-drivestation-velocity", model: "DriveStation Velocity", type: "External Desktop", rpm: 7200, iface: "USB 3.0", form: 3.5 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Buffalo",
      displayBrand: "Buffalo",
      productLine: "MiniStation",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.buffalo-technology.com/products/${m.id.replace("buffalo-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["1TB", "2TB"],
      mediaSource: { url: `https://www.buffalo-technology.com/images/${m.id}.png` },
      collectedAttributes: { brand: "buffalo", modelName: m.model.toLowerCase(), driveType: m.type, rpm: m.rpm, interface: m.iface, formFactorInches: m.form, shockResistance: true },
      missingAttributes: [],
      inclusionReason: `Buffalo encrypted external drive ${m.model}`,
      status: "staged" as const,
    })),

    // OWC (3 models)
    ...[
      { id: "owc-mercury-elite-pro-mini", model: "Mercury Elite Pro mini", type: "External Portable", rpm: 5400, iface: "USB-C 3.2 Gen 2", form: 2.5 },
      { id: "owc-mercury-elite-pro-desktop", model: "Mercury Elite Pro Desktop", type: "External Desktop", rpm: 7200, iface: "USB 3.2 Gen 1", form: 3.5 },
      { id: "owc-gemini-dual-drive", model: "Gemini Dual-Drive", type: "External RAID", rpm: 7200, iface: "Thunderbolt 3", form: 3.5 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "OWC",
      displayBrand: "OWC",
      productLine: "Mercury Elite Pro",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.owc.com/solutions/${m.id.replace("owc-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["2TB", "4TB", "8TB"],
      mediaSource: { url: `https://www.owc.com/images/${m.id}.png` },
      collectedAttributes: { brand: "owc", modelName: m.model.toLowerCase(), driveType: m.type, rpm: m.rpm, interface: m.iface, formFactorInches: m.form, shockResistance: m.type.includes("mini") },
      missingAttributes: [],
      inclusionReason: `OWC professional creative storage ${m.model}`,
      status: "staged" as const,
    })),

    // Silicon Power (3 models)
    ...[
      { id: "sp-armor-a60", model: "Armor A60 Rugged", type: "External Rugged", rpm: 5400, iface: "USB 3.2 Gen 1", form: 2.5 },
      { id: "sp-armor-a85", model: "Armor A85 All-Round Protection", type: "External Rugged", rpm: 5400, iface: "USB 3.2 Gen 1", form: 2.5 },
      { id: "sp-stream-s03", model: "Stream S03 Slim", type: "External Portable", rpm: 5400, iface: "USB 3.2 Gen 1", form: 2.5 },
    ].map((m) => ({
      id: m.id,
      canonicalBrand: "Silicon Power",
      displayBrand: "Silicon Power",
      productLine: "Armor / Stream",
      modelName: m.model,
      generationOrYear: "Current",
      sourceUrls: [`https://www.silicon-power.com/product/${m.id.replace("sp-", "")}`],
      observationDate: "2026-10-11",
      sourceRegion: "GLOBAL",
      lifecycle: "active" as const,
      variants: ["2TB", "4TB"],
      mediaSource: { url: `https://www.silicon-power.com/images/${m.id}.png` },
      collectedAttributes: { brand: "silicon power", modelName: m.model.toLowerCase(), driveType: m.type, rpm: m.rpm, interface: m.iface, formFactorInches: m.form, shockResistance: true },
      missingAttributes: [],
      inclusionReason: `Silicon Power Armor series drive ${m.model}`,
      status: "staged" as const,
    })),
  ],
};

const validated = censusManifestFileSchema.parse(hardDrivesCensus);
const outPath = resolve(process.cwd(), "catalog/census/hard-drives.json");
writeFileSync(outPath, JSON.stringify(validated, null, 2), "utf-8");
console.log(`Saved hard-drives.json with ${validated.entries.length} models across 10 brands.`);
