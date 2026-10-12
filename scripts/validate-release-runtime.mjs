// A packaged Linux release must not inherit a development candidate or Windows
// speech paths. Download success is deliberately separate from model selection.
export function validateReleaseRuntime(settings, manifest) {
  if (settings.AI_PROVIDER === "self_hosted" && settings.AI_MODE === "live") {
    const selected = manifest.candidates[manifest.selection];
    if (!selected || settings.AI_MODEL !== selected.alias)
      throw new Error(
        "Live self-hosted release requires the qualified model selected in deploy/model-candidates.json. No release configuration was written.",
      );
    let endpoint;
    try {
      endpoint = new URL(settings.AI_SELF_HOSTED_BASE_URL);
    } catch {
      throw new Error("Release inference endpoint is missing or invalid.");
    }
    if (
      endpoint.protocol !== "http:" ||
      !["127.0.0.1", "localhost", "[::1]"].includes(endpoint.hostname) ||
      endpoint.username ||
      endpoint.password ||
      endpoint.search ||
      endpoint.hash
    )
      throw new Error("Release inference must use private HTTP loopback.");
  }
  if (settings.VOICE_MODE === "local")
    for (const name of ["LOCAL_SPEECH_EXECUTABLE", "LOCAL_SPEECH_MODEL"])
      if (
        !settings[name]?.startsWith("/") ||
        /[\\\r\n\0]/.test(settings[name]) ||
        settings[name].split("/").includes("..")
      )
        throw new Error(
          "Local speech release requires absolute Linux runtime/model paths. No Windows paths can be deployed.",
        );
}
