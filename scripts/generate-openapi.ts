import { writeFile } from "node:fs/promises";
import { z } from "zod";
import { actionSchema } from "../src/domain/actions";
import { briefSchema } from "../src/domain/brief";
import { scenarioKind } from "../src/server/scenarios";
import { demoRequestSchema } from "../src/server/demo";
import { voiceRequest } from "../src/domain/voice";
const jsonSchema = (schema: z.ZodType) =>
  z.toJSONSchema(schema, { io: "input" });
const responses = {
  "429": {
    description:
      "Per-actor request budget exhausted; Retry-After: 60. Actions 120/min, uploads 20/min, shopping analysis 10/min and engineering scenarios 20/min.",
  },
  "200": {
    description:
      "Successful command or private snapshot; financial completion is reported separately in order/refund status.",
  },
  "400": {
    description:
      "Invalid fields, unsafe state transition, changed approval, or integrity error.",
  },
  "401": { description: "Missing/expired session or invalid access code." },
  "403": { description: "Wrong origin, party, or privileged role." },
  "404": {
    description:
      "Resource is absent or is not owned by this shopper/workspace.",
  },
};
const requestBody = (schema: unknown) => ({
  required: true,
  content: { "application/json": { schema } },
});
const command = (description: string, schema: unknown) => ({
  description: `${description} Mutations require an Origin header matching the configured app origin.`,
  security: [{ session: [] }],
  requestBody: requestBody(schema),
  responses,
});
const idParameter = {
  name: "id",
  in: "query",
  required: true,
  schema: { type: "string", format: "uuid" },
};
const spec = {
  openapi: "3.1.0",
  info: {
    title: "DALE test storefront API",
    version: "0.1.0",
    description:
      "Sandbox/fixture commerce with separate buyer, seller and reviewer permissions. Synthetic adapters do not establish real payment completion. Case records and originals are private. No API key belongs in requests from browsers.",
  },
  servers: [{ url: "/" }],
  components: {
    securitySchemes: {
      session: {
        type: "apiKey",
        in: "cookie",
        name: "bg_session",
        description:
          "Server-issued HttpOnly session cookie. Obtain with POST /api/session; do not publish cookies in traces.",
      },
      demoOwner: {
        type: "apiKey",
        in: "cookie",
        name: "dale_demo",
        description:
          "HttpOnly ownership cookie issued only by the guided demo launcher; never expose it in reports.",
      },
    },
    schemas: {
      Action: jsonSchema(actionSchema),
      ShoppingBrief: jsonSchema(briefSchema),
    },
  },
  paths: {
    "/api/demo": {
      post: {
        ...command(
          "Launch one of nine isolated fixture-only scenarios without credentials. Persona/reset require both the existing session and its owner cookie; demo ownership cannot grant ordinary operator access. Reset rotates ownership and archives prior audit/payment records. Lifetime bounds: 200 demo workspaces, 300 actions and 50 analyses per workspace, 8 uploaded originals per workspace and 128 total demo uploads (4 MiB each). Exhausted lifetime limits require an operator review rather than a minute wait.",
          jsonSchema(demoRequestSchema),
        ),
        security: [],
      },
      get: {
        security: [{ session: [], demoOwner: [] }],
        description:
          "Export only this owned fixture scenario's private snapshot and redacted action/time audit. Tokens, hashes and credentials are omitted; synthetic=true does not establish provider completion.",
        responses,
      },
    },
    "/api/voice/session": {
      get: {
        security: [{ session: [] }],
        description:
          "Buyer-only availability: fixture, disabled or live. Fixture never uses microphone recognition or provider calls. Live requires owner-confirmed free quota and disabled billing.",
        responses,
      },
      post: {
        security: [{ session: [] }],
        description:
          "Same-origin buyer-only native Live token issuance, without a request body. Returns availability if fixture/disabled, otherwise a single-use token with 2-minute expiry and 30-second connection window, locked model/audio/transcription and prepare_request tool. Limit 2 tokens per actor/minute and 10 globally/minute. Permanent key never leaves server. Transient 5xx retries are bounded; no paid fallback.",
        responses,
      },
    },
    "/api/voice/intent": {
      post: command(
        "Buyer-only transcript-to-validated-intent preparation. Deterministic catalog matching, support drafting or own-order navigation only. Financial approval/code execution requests are rejected. USD/English bounded intent grammar; ambiguity requires clarification. At most 10 requests/actor/minute and shared demo analysis lifetime limit. Does not send another model request.",
        jsonSchema(voiceRequest),
      ),
    },
    "/api/health": {
      get: {
        security: [],
        description:
          "Database readiness, build and server-instance identifier.",
        responses: {
          "200": { description: "Ready" },
          "503": { description: "Database unavailable" },
        },
      },
    },
    "/api/session": {
      post: {
        ...command(
          "Create an isolated shopper session, join a group invitation as a distinct buyer, or authorize a seller/reviewer for a customer's workspace. Operator roles require their separate access code.",
          jsonSchema(
            z.object({
              role: z.enum(["buyer", "seller", "reviewer"]),
              accessCode: z.string().max(200).optional(),
              workspaceId: z.string().uuid().optional(),
              invite: z.string().uuid().optional(),
            }),
          ),
        ),
        security: [],
      },
      get: {
        security: [{ session: [] }],
        description:
          "Private snapshot, role, workspace ID and explicit adapter modes. Operators receive recovery heartbeat/backlog.",
        responses,
      },
      delete: {
        security: [{ session: [] }],
        description: "End the current session; requires same Origin.",
        responses,
      },
    },
    "/api/actions": {
      post: command(
        "Execute one typed domain command. Each command enforces ownership, actor role, approval and state rules. capture_session binds a code to exactly one case or order; only reviewers approve remedies/return arrangements; only the owning buyer changes remedy choices; only sellers cancel fulfillment.",
        { $ref: "#/components/schemas/Action" },
      ),
    },
    "/api/brief": {
      post: command(
        "Save the owning shopper's brief; changed constraints invalidate unpaid quotes/approvals while preserving sent capture operations.",
        { $ref: "#/components/schemas/ShoppingBrief" },
      ),
    },
    "/api/shopping": {
      post: command(
        "Save the brief and retrieve compatible, budget-eligible catalog results plus labeled fixture/live analysis.",
        { $ref: "#/components/schemas/ShoppingBrief" },
      ),
    },
    "/api/scenarios": {
      post: command(
        "Reviewer-only engineering scenarios. Creates a new isolated fixture workspace and switches the cookie to its shopper. Reset archives only designated fixtures, preserving audit history.",
        jsonSchema(
          z.object({ action: z.enum(["create", "reset"]), kind: scenarioKind }),
        ),
      ),
    },
    "/api/identify": {
      post: {
        security: [{ session: [] }],
        description:
          "Same-origin buyer-only device label extraction. PNG/JPEG/WebP up to 4 MiB. Exact owned images are recognized in fixture mode; native vision results require explicit shopper confirmation. Unknown, unreadable or conflicting labels never establish compatibility. This endpoint does not save the brief or image. Shares the 10/min analysis budget.",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["image"],
                properties: {
                  image: { type: "string", format: "binary" },
                  selectedModel: { type: "string", maxLength: 80 },
                },
              },
            },
          },
        },
        responses,
      },
    },
    "/api/evidence": {
      post: {
        security: [{ session: [] }],
        description:
          "Same-origin multipart submission: exactly one caseId/orderId. PNG/JPEG/WebP up to 4 MiB. Capture code is optional, single-use and checkpoint-bound; it does not establish physical truth. Notes remain in the body.",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["checkpoint", "serial", "note", "image"],
                properties: {
                  caseId: { type: "string", format: "uuid" },
                  orderId: { type: "string", format: "uuid" },
                  checkpoint: {
                    enum: [
                      "seller_dispatch",
                      "buyer_receipt",
                      "buyer_return",
                      "seller_return",
                    ],
                  },
                  serial: { type: "string", maxLength: 100 },
                  note: { type: "string", minLength: 1, maxLength: 2000 },
                  captureSessionId: { type: "string", format: "uuid" },
                  image: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses,
      },
      get: {
        security: [{ session: [] }],
        parameters: [idParameter],
        description:
          "Owned original file; private no-store response. SHA-256 is checked before returning bytes.",
        responses,
      },
    },
    "/api/case-report": {
      get: {
        security: [{ session: [] }],
        parameters: [idParameter],
        description:
          "Private JSON download separating submitted records, integrity/provenance, analysis, financial adapter/state, return arrangements and scoped audit. Missing/tampered originals are reported.",
        responses,
      },
    },
    "/api/paypal/webhook": {
      post: {
        security: [],
        description:
          "Actual PayPal event endpoint. Server verifies PayPal transmission signature before durable deduplication/outbox wakeup. Fixture events cannot impersonate signed PayPal events.",
        requestBody: requestBody({
          type: "object",
          required: ["id", "event_type", "resource"],
          properties: {
            id: { type: "string" },
            event_type: { type: "string" },
            resource: { type: "object" },
          },
        }),
        responses: {
          "200": {
            description: "Verified event persisted or already received.",
          },
          "400": { description: "Unverified/malformed event rejected." },
        },
      },
    },
    "/api/openapi": {
      get: {
        security: [],
        responses: {
          "200": {
            description:
              "This public OpenAPI document; no credentials or workspace data.",
          },
        },
      },
    },
  },
};
await writeFile("docs/openapi.json", JSON.stringify(spec, null, 2) + "\n");
console.log(
  "Generated docs/openapi.json from the action and shopping schemas.",
);
