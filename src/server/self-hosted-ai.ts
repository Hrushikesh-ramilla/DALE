import { z } from "zod";

export function selfHostedEndpoint() {
  const base = process.env.AI_SELF_HOSTED_BASE_URL;
  if (!base) throw new Error("Self-hosted model endpoint is not configured.");
  const endpoint = new URL(`${base.replace(/\/$/, "")}/chat/completions`);
  if (
    endpoint.protocol !== "http:" ||
    !["localhost", "127.0.0.1", "[::1]"].includes(endpoint.hostname) ||
    endpoint.username ||
    endpoint.password ||
    endpoint.search ||
    endpoint.hash
  )
    throw new Error(
      "Self-hosted inference must use a private loopback HTTP endpoint. No cloud fallback is permitted.",
    );
  return endpoint;
}

export async function selfHostedCompletion<T>(
  schema: z.ZodType<T>,
  system: string,
  input: unknown,
  images: { mime: string; bytes: Buffer }[],
): Promise<T> {
  const endpoint = selfHostedEndpoint();
  if (!process.env.AI_MODEL)
    throw new Error("Self-hosted model identity is not configured.");
  const outputSchema = z.toJSONSchema(schema);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.AI_SELF_HOSTED_API_KEY
        ? { Authorization: `Bearer ${process.env.AI_SELF_HOSTED_API_KEY}` }
        : {}),
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL,
      messages: [
        {
          role: "system",
          content: `${system}\nReturn an object conforming to this output JSON schema: ${JSON.stringify(outputSchema)}`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: JSON.stringify(input) },
            ...images.map((image) => ({
              type: "image_url",
              image_url: {
                url: `data:${image.mime};base64,${image.bytes.toString("base64")}`,
              },
            })),
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "dale_analysis",
          strict: true,
          schema: outputSchema,
        },
      },
      chat_template_kwargs: { enable_thinking: false },
      ...(process.env.AI_SELF_HOSTED_PROFILE === "structured"
        ? {
            temperature: 0.2,
            top_p: 0.8,
            top_k: 20,
            presence_penalty: 0,
            repeat_penalty: 1,
          }
        : ["qwen35", "qwen3vl"].includes(
              process.env.AI_SELF_HOSTED_PROFILE || "",
            )
          ? {
              temperature: images.length ? 0.7 : 1.0,
              top_p: images.length ? 0.8 : 1.0,
              top_k:
                process.env.AI_SELF_HOSTED_PROFILE === "qwen3vl" &&
                !images.length
                  ? 40
                  : 20,
              min_p: 0,
              presence_penalty: images.length ? 1.5 : 2.0,
              repeat_penalty: 1.0,
            }
          : { temperature: 0.2 }),
      cache_prompt: false,
      max_tokens: 1200,
      stream: false,
    }),
    // CPU inference is slower than hosted generation. Do not duplicate a timed-out job.
    signal: AbortSignal.timeout(120000),
  });
  if (!response.ok)
    throw new Error(
      `Self-hosted model returned HTTP ${response.status}. No cloud fallback was attempted.`,
    );
  const data = z
    .object({
      choices: z.array(
        z.object({
          finish_reason: z.string(),
          message: z.object({ content: z.string().nullable() }),
        }),
      ),
    })
    .parse(await response.json());
  const result = data.choices[0];
  if (result?.finish_reason !== "stop" || !result.message.content)
    throw new Error(
      "Self-hosted analysis did not complete. No cloud fallback was attempted.",
    );
  return schema.parse(JSON.parse(result.message.content));
}
