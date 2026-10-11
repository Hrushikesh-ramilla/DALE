import { z } from "zod";
import { categoryIds } from "@/domain/departments";
import { briefSchema } from "@/domain/brief";
import { browseCatalog } from "@/server/catalog-store";
import { apiError, json } from "@/server/http";
const querySchema = z
  .object({
    category: z.enum(["", ...categoryIds]).default(""),
    query: z.string().trim().max(100).default(""),
    budget: z.coerce.number().int().min(1).max(100000).default(100000),
    page: z.coerce.number().int().min(1).max(1000).default(1),
    productType: briefSchema.shape.requirements.unwrap().shape.productType,
    size: briefSchema.shape.requirements.unwrap().shape.size,
    material: briefSchema.shape.requirements.unwrap().shape.material,
    scent: briefSchema.shape.requirements.unwrap().shape.scent,
    volumeMl: z.coerce.number().int().min(1).max(1000).optional(),
  })
  .strict();
export async function GET(request: Request) {
  try {
    const { productType, size, material, scent, volumeMl, ...input } =
      querySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    const requirements = Object.fromEntries(
      Object.entries({ productType, size, material, scent, volumeMl }).filter(
        ([, value]) => value !== undefined,
      ),
    ) as Record<string, string | number>;
    return json(await browseCatalog({ ...input, requirements }));
  } catch (error) {
    return apiError(error);
  }
}
