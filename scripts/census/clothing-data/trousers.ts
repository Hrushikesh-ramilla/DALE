import type { CensusManifestFile } from "../../../src/domain/coverage-targets";
import { makeEntry } from "./helpers";
import { trousersModels } from "../overhaul/trousers-data";

export const trousersCensus: CensusManifestFile = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  leafKey: "trousers",
  displayName: "Trousers & Chinos",
  censusDate: "2026-10-11",
  supplyExceptions: [],
  entries: trousersModels.map((m) => makeEntry("trousers", m)),
};
