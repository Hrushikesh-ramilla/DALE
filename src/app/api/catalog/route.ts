import { z } from "zod";
import { categoryIds } from "@/domain/departments";
import { briefSchema } from "@/domain/brief";
import { browseCatalog } from "@/server/catalog-store";
import { apiError, json } from "@/server/http";
const querySchema = z
  .object({
    category: z.enum(["", ...categoryIds]).default(""),
    query: z.string().trim().max(100).default(""),
    budget: z.coerce.number().int().min(1).max(1000000).default(1000000),
    page: z.coerce.number().int().min(1).max(1000).default(1),
    productType: briefSchema.shape.requirements.unwrap().shape.productType,
    size: briefSchema.shape.requirements.unwrap().shape.size,
    material: briefSchema.shape.requirements.unwrap().shape.material,
    scent: briefSchema.shape.requirements.unwrap().shape.scent,
    volumeMl: z.coerce.number().int().min(1).max(1000).optional(),
    brand: briefSchema.shape.requirements.unwrap().shape.brand,
    modelName: briefSchema.shape.requirements.unwrap().shape.modelName,
    concentration: briefSchema.shape.requirements.unwrap().shape.concentration,
    storageGb: z.coerce.number().int().min(1).max(8192).optional(),
    ramGb: z.coerce.number().int().min(1).max(256).optional(),
  })
  .strict();
export async function GET(request: Request) {
  try {
    const {
      productType,
      size,
      material,
      scent,
      volumeMl,
      brand,
      modelName,
      concentration,
      storageGb,
      ramGb,
      ...input
    } = querySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    const requirements = Object.fromEntries(
      Object.entries({
        productType,
        size,
        material,
        scent,
        volumeMl,
        brand,
        modelName,
        concentration,
        storageGb,
        ramGb,
      }).filter(([, value]) => value !== undefined),
    ) as Record<string, string | number>;
    return json(await browseCatalog({ ...input, requirements }));
  } catch (error) {
    return apiError(error);
  }
}
