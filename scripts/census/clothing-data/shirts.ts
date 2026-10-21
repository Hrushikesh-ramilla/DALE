import type { CensusManifestFile } from "../../../src/domain/coverage-targets";
import { makeEntry } from "./helpers";
import { shirtsModels } from "../overhaul/shirts-data";

export const shirtsCensus: CensusManifestFile = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  leafKey: "shirts",
  displayName: "Shirts & Blouses",
  censusDate: "2026-10-11",
  supplyExceptions: [],
  entries: shirtsModels.map((m) => makeEntry("shirts", m)),
};
