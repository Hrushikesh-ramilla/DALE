import type { CensusManifestFile } from "../../../src/domain/coverage-targets";
import { makeEntry } from "./helpers";
import { denimModels } from "../overhaul/denim-data";

export const denimCensus: CensusManifestFile = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  leafKey: "denim",
  displayName: "Jeans & Denim",
  censusDate: "2026-10-11",
  supplyExceptions: [],
  entries: denimModels.map((m) => makeEntry("denim", m)),
};
