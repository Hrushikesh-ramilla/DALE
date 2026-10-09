export function parseRuntimeEnvironment(text) {
  const values = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const match = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(line);
    if (!match)
      throw new Error("Invalid private deployment environment format.");
    let value;
    try {
      value = JSON.parse(match[2]);
    } catch {
      throw new Error("Deployment values must be JSON-quoted strings.");
    }
    if (typeof value !== "string")
      throw new Error("Deployment values must be strings.");
    values[match[1]] = value;
  }
  return values;
}

export function installedModelUnit(result) {
  if (result.status === 0)
    return result.stdout.includes("buyerguard-model.service");
  if (result.status === 1 && !result.stdout.trim() && !result.stderr.trim())
    return false;
  throw new Error("Could not inspect the existing private model service.");
}

export function runtimePlan(settings, manifest, memoryBytes) {
  const modelEnabled =
    settings.AI_PROVIDER === "self_hosted" && settings.AI_MODE === "live";
  const voiceEnabled = settings.VOICE_MODE === "local";
  const appMemoryMiB = voiceEnabled ? 768 : 380;
  const modelMemoryMiB = modelEnabled
    ? Number(settings.LOCAL_MODEL_MEMORY_MAX_MIB || "2048")
    : 0;
  const selected = modelEnabled
    ? manifest.candidates[manifest.selection]
    : null;
  if (modelEnabled && (!selected || selected.alias !== settings.AI_MODEL))
    throw new Error(
      "A qualified manifest selection matching the live model is required.",
    );
  if (
    modelEnabled &&
    (!Number.isInteger(modelMemoryMiB) ||
      modelMemoryMiB < 256 ||
      modelMemoryMiB > 16384)
  )
    throw new Error("Invalid private inference memory limit.");
  if (
    modelEnabled &&
    selected.minimumHostGiB * 1024 ** 3 > memoryBytes + 512 * 1024 ** 2
  )
    throw new Error("Selected model exceeds the host memory class.");
  // Include app/child recognizer, worker and explicit OS/PostgreSQL/Caddy reserve.
  // This is a capacity guard; only measured joint execution establishes adequacy.
  const requiredMiB = appMemoryMiB + modelMemoryMiB + 240 + 640;
  if ((modelEnabled || voiceEnabled) && requiredMiB * 1024 ** 2 > memoryBytes)
    throw new Error(
      "Host lacks memory for the declared app/model/worker and database reserve.",
    );
  if (
    selected &&
    (!/^[a-zA-Z0-9._-]+$/.test(selected.alias) || selected.files.length !== 2)
  )
    throw new Error(
      "Selected model must have a safe alias and two pinned artifacts.",
    );
  if (selected)
    for (const file of selected.files)
      if (
        !/^[a-zA-Z0-9._-]+$/.test(file.local) ||
        !/^[a-f0-9]{64}$/.test(file.sha256)
      )
        throw new Error("Unsafe or unpinned model artifact.");
  return {
    modelEnabled,
    voiceEnabled,
    appMemoryMiB,
    modelMemoryMiB,
    requiredMiB,
    selected,
  };
}
