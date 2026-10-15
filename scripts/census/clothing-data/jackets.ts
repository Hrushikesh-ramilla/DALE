import type { CensusManifestFile } from "../../../src/domain/coverage-targets";
import { makeEntry } from "./helpers";
import { jacketsModels } from "../overhaul/jackets-data";

export const jacketsCensus: CensusManifestFile = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  leafKey: "jackets",
  displayName: "Jackets & Blousons",
  censusDate: "2026-10-11",
  supplyExceptions: [],
  entries: jacketsModels.map((m) => makeEntry("jackets", m)),
};
