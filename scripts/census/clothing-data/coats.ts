import type { CensusManifestFile } from "../../../src/domain/coverage-targets";
import { makeEntry } from "./helpers";
import { coatsModels } from "../overhaul/coats-data";

export const coatsCensus: CensusManifestFile = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  leafKey: "coats",
  displayName: "Coats & Outerwear",
  censusDate: "2026-10-11",
  supplyExceptions: [],
  entries: coatsModels.map((m) => makeEntry("coats", m)),
};
