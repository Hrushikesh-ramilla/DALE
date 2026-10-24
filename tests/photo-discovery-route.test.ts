import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  actor: vi.fn(),
  budget: vi.fn(),
  demo: vi.fn(),
  discover: vi.fn(),
}));
vi.mock("../src/server/auth", () => ({ actorFromRequest: mocks.actor }));
vi.mock("../src/server/budgets", () => ({ takeRequestBudget: mocks.budget }));
vi.mock("../src/server/demo", () => ({ takeDemoBudget: mocks.demo }));
vi.mock("../src/server/photo-discovery", () => ({
  discoverPhoto: mocks.discover,
}));
import { POST } from "../src/app/api/catalog/photo/route";
const url = "http://localhost:3002/api/catalog/photo";
function request(file = true, origin = "http://localhost:3002") {
  const form = new FormData();
  if (file)
    form.set(
      "image",
      new File([new Uint8Array([1, 2, 3])], "photo.png", { type: "image/png" }),
    );
  return new Request(url, { method: "POST", headers: { origin }, body: form });
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("APP_URL", "http://localhost:3002");
  mocks.actor.mockResolvedValue({
    role: "buyer",
    workspaceId: "test",
    userId: "test",
  });
  mocks.budget.mockResolvedValue(undefined);
  mocks.demo.mockResolvedValue(undefined);
  mocks.discover.mockResolvedValue({ summary: "No item", items: [] });
});
describe("photo search HTTP boundary", () => {
  it("requires same origin before analysis", async () => {
    expect(
      (await POST(request(true, "https://elsewhere.example"))).status,
    ).toBe(403);
    expect(mocks.discover).not.toHaveBeenCalled();
  });
  it("requires a session", async () => {
    mocks.actor.mockRejectedValue(new Error("Please sign in"));
    expect((await POST(request())).status).toBe(401);
    expect(mocks.discover).not.toHaveBeenCalled();
  });
  it("enforces request budget before analysis", async () => {
    mocks.budget.mockRejectedValue(new Error("Request rate limit reached"));
    expect((await POST(request())).status).toBe(429);
    expect(mocks.discover).not.toHaveBeenCalled();
  });
  it("requires an actual file", async () => {
    expect((await POST(request(false))).status).toBe(400);
    expect(mocks.discover).not.toHaveBeenCalled();
  });
  it("passes uploaded bytes and does not cache response", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mocks.discover.mock.calls[0][1]).toEqual({
      bytes: Buffer.from([1, 2, 3]),
      mime: "image/png",
    });
  });
});
