import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { censusManifestFileSchema, type CensusManifestFile } from "../../src/domain/coverage-targets";

const path = resolve(process.cwd(), "catalog/census/wall-chargers.json");
const raw: CensusManifestFile = JSON.parse(readFileSync(path, "utf-8"));

// Add Stuffcool, Xiaomi, Baseus supply exceptions
raw.supplyExceptions.push(
  {
    brand: "Stuffcool",
    leafKey: "wall-chargers",
    reason: "Stuffcool active GaN wall charger lineup consists of 4 models.",
    officialSourceUrl: "https://www.stuffcool.com/collections/chargers",
    verifiedAt: "2026-10-11",
    fullEnumeratedModels: [
      "Stuffcool Napoleon 65W GaN Charger",
      "Stuffcool Centurion 100W 4-Port GaN Charger",
      "Stuffcool Flow 33W Dual Port GaN Charger",
      "Stuffcool Neutron 20W Tiny USB-C Charger"
    ],
    totalQualifyingModels: 4,
    sourceRegion: "IN",
  },
  {
    brand: "Xiaomi",
    leafKey: "wall-chargers",
    reason: "Xiaomi standalone fast charger portfolio features 3 SonicCharge & HyperCharge adapters.",
    officialSourceUrl: "https://www.mi.com/in/product-list/chargers/",
    verifiedAt: "2026-10-11",
    fullEnumeratedModels: [
      "Xiaomi 67W SonicCharge 3.0 Combo",
      "Xiaomi 33W SonicCharge 2.0 Fast Charger",
      "Xiaomi 120W HyperCharge Adapter Combo"
    ],
    totalQualifyingModels: 3,
    sourceRegion: "IN",
  },
  {
    brand: "Baseus",
    leafKey: "wall-chargers",
    reason: "Baseus GaN wall chargers lineup features 3 core models.",
    officialSourceUrl: "https://www.baseus.com/collections/chargers",
    verifiedAt: "2026-10-11",
    fullEnumeratedModels: [
      "Baseus GaN5 Pro 65W Fast Charger",
      "Baseus GaN3 Pro 100W 4-Port Charger",
      "Baseus GaN5 30W Mini Fast Charger"
    ],
    totalQualifyingModels: 3,
    sourceRegion: "GLOBAL",
  }
);

// Add entries
raw.entries.push(
  // Stuffcool
  ...[
    { id: "stuffcool-napoleon-65w", model: "Napoleon 65W GaN Charger", watts: 65, ports: "1x USB-C + 1x USB-A", pd: "USB-PD 3.0 PPS", pps: true },
    { id: "stuffcool-centurion-100w", model: "Centurion 100W 4-Port GaN Charger", watts: 100, ports: "2x USB-C + 2x USB-A", pd: "USB-PD 3.0 PPS", pps: true },
    { id: "stuffcool-flow-33w", model: "Flow 33W Dual Port GaN Charger", watts: 33, ports: "1x USB-C + 1x USB-A", pd: "USB-PD 3.0 PPS", pps: true },
    { id: "stuffcool-neutron-20w", model: "Neutron 20W Tiny USB-C Charger", watts: 20, ports: "1x USB-C", pd: "USB-PD 3.0", pps: false },
  ].map((m) => ({
    id: m.id,
    canonicalBrand: "Stuffcool",
    displayBrand: "Stuffcool",
    productLine: "GaN Fast Charger",
    modelName: m.model,
    generationOrYear: "Current",
    sourceUrls: [`https://www.stuffcool.com/products/${m.id.replace("stuffcool-", "")}`],
    observationDate: "2026-10-11",
    sourceRegion: "IN",
    lifecycle: "active" as const,
    variants: ["White", "Black"],
    collectedAttributes: {
      totalWatts: m.watts,
      connectorType: m.ports,
      pdVersion: m.pd,
      ppsSupported: m.pps,
      voltageProfiles: `${m.watts}W Max Output`,
      compatibleEcosystems: "iPhone, iPad, MacBook Air, Samsung Galaxy",
    },
    missingAttributes: [],
    inclusionReason: `Stuffcool Indian compact GaN charger ${m.model}`,
    status: "staged" as const,
  })),

  // Xiaomi
  ...[
    { id: "xiaomi-67w-soniccharge", model: "Xiaomi 67W SonicCharge 3.0 Combo", watts: 67, ports: "1x USB-A", pd: "Qualcomm QC 3.0 / SonicCharge", pps: false },
    { id: "xiaomi-33w-soniccharge", model: "Xiaomi 33W SonicCharge 2.0 Fast Charger", watts: 33, ports: "1x USB-A", pd: "Qualcomm QC 3.0", pps: false },
    { id: "xiaomi-120w-hypercharge", model: "Xiaomi 120W HyperCharge Adapter Combo", watts: 120, ports: "1x USB-A", pd: "HyperCharge / PD", pps: false },
  ].map((m) => ({
    id: m.id,
    canonicalBrand: "Xiaomi",
    displayBrand: "Xiaomi",
    productLine: "SonicCharge / HyperCharge",
    modelName: m.model,
    generationOrYear: "Current",
    sourceUrls: [`https://www.mi.com/in/product/${m.id.replace("xiaomi-", "")}`],
    observationDate: "2026-10-11",
    sourceRegion: "IN",
    lifecycle: "active" as const,
    variants: ["White"],
    collectedAttributes: {
      totalWatts: m.watts,
      connectorType: m.ports,
      pdVersion: m.pd,
      ppsSupported: m.pps,
      voltageProfiles: `${m.watts}W Flash Charge`,
      compatibleEcosystems: "Xiaomi, Redmi, POCO, USB Devices",
    },
    missingAttributes: [],
    inclusionReason: `Xiaomi flash charge adapter ${m.model}`,
    status: "staged" as const,
  })),

  // Baseus
  ...[
    { id: "baseus-gan5-pro-65w", model: "Baseus GaN5 Pro 65W Fast Charger", watts: 65, ports: "2x USB-C + 1x USB-A", pd: "USB-PD 3.0 PPS", pps: true },
    { id: "baseus-gan3-pro-100w", model: "Baseus GaN3 Pro 100W 4-Port Charger", watts: 100, ports: "2x USB-C + 2x USB-A", pd: "USB-PD 3.0 PPS", pps: true },
    { id: "baseus-gan5-30w", model: "Baseus GaN5 30W Mini Fast Charger", watts: 30, ports: "1x USB-C", pd: "USB-PD 3.0 PPS", pps: true },
  ].map((m) => ({
    id: m.id,
    canonicalBrand: "Baseus",
    displayBrand: "Baseus",
    productLine: "GaN Pro Series",
    modelName: m.model,
    generationOrYear: "Current",
    sourceUrls: [`https://www.baseus.com/products/${m.id.replace("baseus-", "")}`],
    observationDate: "2026-10-11",
    sourceRegion: "GLOBAL",
    lifecycle: "active" as const,
    variants: ["Black", "White"],
    collectedAttributes: {
      totalWatts: m.watts,
      connectorType: m.ports,
      pdVersion: m.pd,
      ppsSupported: m.pps,
      voltageProfiles: `${m.watts}W GaN Output`,
      compatibleEcosystems: "MacBook Pro, iPhone, Galaxy, iPad",
    },
    missingAttributes: [],
    inclusionReason: `Baseus multi-port GaN charger ${m.model}`,
    status: "staged" as const,
  }))
);

const validated = censusManifestFileSchema.parse(raw);
writeFileSync(path, JSON.stringify(validated, null, 2), "utf-8");
console.log(`Updated wall-chargers.json with ${validated.entries.length} models across ${new Set(validated.entries.map(e => e.canonicalBrand)).size} brands.`);
