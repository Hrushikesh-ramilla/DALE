import { cp } from "node:fs/promises";

// Serve the optimized application and the same browser assets used by a release.
// Provider configuration and credentials are not needed for fixture acceptance.
await cp(".next/static", ".next/standalone/.next/static", { recursive: true });
await cp("public", ".next/standalone/public", { recursive: true });
