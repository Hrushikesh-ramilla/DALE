import type { CensusManifestFile } from "../../../src/domain/coverage-targets";
import { makeEntry } from "./helpers";
import { suitsModels } from "../overhaul/suits-data";

export const suitsCensus: CensusManifestFile = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  leafKey: "suits",
  displayName: "Suits & Tailoring",
  censusDate: "2026-10-11",
  supplyExceptions: [],
  entries: suitsModels.map((m) => makeEntry("suits", m)),
};
