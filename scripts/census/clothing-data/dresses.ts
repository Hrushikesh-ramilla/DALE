import type { CensusManifestFile } from "../../../src/domain/coverage-targets";
import { makeEntry } from "./helpers";
import { dressesModels } from "../overhaul/dresses-data";

export const dressesCensus: CensusManifestFile = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  leafKey: "dresses",
  displayName: "Dresses & Eveningwear",
  censusDate: "2026-10-11",
  supplyExceptions: [],
  entries: dressesModels.map((m) => makeEntry("dresses", m)),
};
