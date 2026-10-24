import { describe, expect, it, vi, beforeEach } from "vitest";
import sharp from "sharp";
import {
  matchPhotoItem,
  photoObservation,
} from "../src/domain/photo-discovery";
import type { Product } from "../src/domain/catalog";

const mocks = vi.hoisted(() => ({
  completion: vi.fn(),
  workspace: vi.fn(),
  query: vi.fn(),
  mode: vi.fn(),
}));
vi.mock("../src/server/ai", () => ({
  completion: mocks.completion,
  aiMode: mocks.mode,
}));
vi.mock("../src/server/state", () => ({ getWorkspace: mocks.workspace }));
vi.mock("../src/server/concierge/store", () => ({
  conciergeDatabase: async () => ({ query: mocks.query }),
}));
vi.mock("../src/domain/product-media-presentation", () => ({
  withVerifiedProductMedia: (p: Product) => p,
}));
import {
  discoverPhoto,
  prepareDiscoveryImage,
} from "../src/server/photo-discovery";

const product = (
  id: string,
  name: string,
  brand = "Samsung",
  category: Product["category"] = "phones",
): Product => ({
  id,
  name,
  brand,
  category,
  description: "Black folding phone",
  color: "Black",
  price: 10000,
  specs: [],
  stock: 1,
  compatibleModels: [],
  sponsored: false,
  source: "catalog:test",
});
const item = {
  label: "Folding phone",
  category: "phones" as const,
  leafType: null,
  visibleBrand: "Samsung",
  visibleModel: "Galaxy Z Fold6",
  traits: ["black", "folding"],
};
const actor = { role: "buyer" as const, workspaceId: "test", userId: "test" };
const image = async () => ({
  bytes: await sharp({
    create: { width: 1800, height: 1200, channels: 3, background: "white" },
  })
    .png()
    .toBuffer(),
  mime: "image/png",
});

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mode.mockReturnValue("live");
  mocks.workspace.mockResolvedValue({});
});
describe("photo candidate matching", () => {
  it("prioritizes legible brand/model but labels identity as only possible", () => {
    const result = matchPhotoItem(item, [
      product("a", "Galaxy Z Fold5"),
      product("b", "Galaxy Z Fold6"),
      product("c", "Galaxy Z Fold6", "Other"),
    ]);
    expect(result.map((r) => r.product.id)).toEqual(["b"]);
    expect(result[0].kind).toBe("possible_identity");
  });
  it("never treats silhouette alone as an exact model", () => {
    const result = matchPhotoItem(
      { ...item, visibleBrand: null, visibleModel: null },
      [product("a", "Galaxy Z Fold6")],
    );
    expect(result[0].kind).toBe("similar");
  });
  it("does not match unrelated categories or contradictory brands", () => {
    expect(
      matchPhotoItem(item, [
        product("a", "Galaxy Z Fold6", "Apple"),
        product("b", "Galaxy Z Fold6", "Samsung", "tablets"),
      ]),
    ).toEqual([]);
  });
  it("returns no arbitrary suggestions without visual detail overlap", () => {
    expect(
      matchPhotoItem(
        {
          ...item,
          visibleBrand: null,
          visibleModel: null,
          traits: ["pink", "polka dots"],
        },
        [product("a", "Galaxy Z Fold6")],
      ),
    ).toEqual([]);
  });
  it("enforces coherent leaf classification", () => {
    const p = { ...product("a", "Galaxy Z Fold6"), leafType: "smartphones" };
    expect(
      matchPhotoItem({ ...item, leafType: "backpacks" }, [p]),
    ).toHaveLength(1);
    expect(matchPhotoItem({ ...item, leafType: "laptops" }, [p])).toHaveLength(
      1,
    );
  });
  it("rejects unbounded or invented observation categories", () => {
    expect(
      photoObservation.safeParse({
        summary: "x",
        items: [{ ...item, category: "everything" }],
      }).success,
    ).toBe(false);
    expect(
      photoObservation.safeParse({ summary: "x", items: Array(5).fill(item) })
        .success,
    ).toBe(false);
  });
});
describe("photo processing", () => {
  it("decodes and bounds image size before sending, producing metadata-free JPEG", async () => {
    const prepared = await prepareDiscoveryImage(await image());
    const metadata = await sharp(prepared.bytes).metadata();
    expect(prepared.mime).toBe("image/jpeg");
    expect(metadata.width).toBe(1440);
    expect(metadata.exif).toBeUndefined();
  });
  it("rejects disguised, corrupt and oversized uploads", async () => {
    await expect(
      prepareDiscoveryImage({
        mime: "image/png",
        bytes: Buffer.from("not a png"),
      }),
    ).rejects.toThrow();
    await expect(
      prepareDiscoveryImage({
        mime: "image/png",
        bytes: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      }),
    ).rejects.toThrow("could not be read");
    await expect(
      prepareDiscoveryImage({
        mime: "image/jpeg",
        bytes: Buffer.alloc(4 * 1024 * 1024 + 1),
      }),
    ).rejects.toThrow();
  });
  it("does not invent fixture results or call providers in fixture mode", async () => {
    mocks.mode.mockReturnValue("fixture");
    await expect(discoverPhoto(actor, await image())).rejects.toThrow(
      "live vision",
    );
    expect(mocks.completion).not.toHaveBeenCalled();
  });
  it("uses one vision call and retrieves only published records", async () => {
    mocks.completion.mockResolvedValue({
      summary: "A folding phone",
      items: [item],
    });
    mocks.query.mockResolvedValue({
      rows: [{ record: product("test-phone", "Galaxy Z Fold6") }],
    });
    const result = await discoverPhoto(actor, await image());
    expect(mocks.completion).toHaveBeenCalledTimes(1);
    expect(mocks.query.mock.calls[0][0]).toContain("publication='published'");
    expect(result.items[0].matches[0].id).toBe("test-phone");
  });
  it("does not browse catalog when no supported object is seen", async () => {
    mocks.completion.mockResolvedValue({
      summary: "No identifiable shopping item",
      items: [],
    });
    expect((await discoverPhoto(actor, await image())).items).toEqual([]);
    expect(mocks.query).not.toHaveBeenCalled();
  });
  it("propagates model failure instead of showing fabricated matches", async () => {
    mocks.completion.mockRejectedValue(new Error("Vision unavailable"));
    await expect(discoverPhoto(actor, await image())).rejects.toThrow(
      "Vision unavailable",
    );
    expect(mocks.query).not.toHaveBeenCalled();
  });
});
