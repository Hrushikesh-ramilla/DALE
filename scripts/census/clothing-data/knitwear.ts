import type { CensusManifestFile } from "../../../src/domain/coverage-targets";
import { makeEntry } from "./helpers";
import { knitwearModels } from "../overhaul/knitwear-data";

export const knitwearCensus: CensusManifestFile = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  leafKey: "knitwear",
  displayName: "Knitwear & Sweaters",
  censusDate: "2026-10-11",
  supplyExceptions: [],
  entries: knitwearModels.map((m) => makeEntry("knitwear", m)),
};
