import type { CensusManifestFile } from "../../../src/domain/coverage-targets";
import { makeEntry } from "./helpers";
import { tshirtsModels } from "../overhaul/tshirts-data";

export const tshirtsCensus: CensusManifestFile = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  leafKey: "t-shirts",
  displayName: "T-Shirts & Polos",
  censusDate: "2026-10-11",
  supplyExceptions: [],
  entries: tshirtsModels.map((m) => makeEntry("t-shirts", m)),
};
