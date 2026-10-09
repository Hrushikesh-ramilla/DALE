import { createHash } from "node:crypto";

// Validate a CI-produced artifact before reading or changing private settings.
export function validateAppArchive(metadata, bytes, expectedSource) {
  if (
    !/^[a-f0-9]{40}$/.test(expectedSource) ||
    metadata.source !== expectedSource ||
    metadata.platform !== "linux" ||
    metadata.architecture !== "x64" ||
    metadata.nodeMajor !== 22
  )
    throw new Error("Download the Linux x64 Node 22 release artifact for the current commit from its successful CI run.");
  if (
    metadata.size !== bytes.length ||
    !/^[a-f0-9]{64}$/.test(metadata.sha256) ||
    createHash("sha256").update(bytes).digest("hex") !== metadata.sha256
  )
    throw new Error("Linux release archive checksum or size does not match its CI metadata.");
  return metadata;
}
