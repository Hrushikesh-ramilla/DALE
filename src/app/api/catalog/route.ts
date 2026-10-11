import { z } from "zod";
import { categoryIds } from "@/domain/departments";
import { briefSchema } from "@/domain/brief";
import { browseCatalog } from "@/server/catalog-store";
import { apiError, json } from "@/server/http";
const querySchema = z
  .object({
    movement: briefSchema.shape.requirements.unwrap().shape.movement,
    caseDiameterMm: z.coerce.number().positive().max(10000).optional(),
    waterResistanceM: z.coerce.number().positive().max(10000).optional(),
    frameShape: briefSchema.shape.requirements.unwrap().shape.frameShape,
    frameMaterial: briefSchema.shape.requirements.unwrap().shape.frameMaterial,
    lensWidthMm: z.coerce.number().positive().max(10000).optional(),
    bridgeMm: z.coerce.number().positive().max(10000).optional(),
    templeMm: z.coerce.number().positive().max(10000).optional(),
    polarization: briefSchema.shape.requirements.unwrap().shape.polarization,
    uvProtection: briefSchema.shape.requirements.unwrap().shape.uvProtection,
    sizeSystem: briefSchema.shape.requirements.unwrap().shape.sizeSystem,
    shoeSize: briefSchema.shape.requirements.unwrap().shape.shoeSize,
    connection: briefSchema.shape.requirements.unwrap().shape.connection,
    noiseCancellation:
      briefSchema.shape.requirements.unwrap().shape.noiseCancellation,
    batteryHours: z.coerce.number().positive().max(10000).optional(),
    voltage: z.coerce.number().positive().max(10000).optional(),
    capacityLitres: z.coerce.number().positive().max(10000).optional(),
    category: z.enum(["", ...categoryIds]).default(""),
    query: z.string().trim().max(100).default(""),
    budget: z.coerce.number().int().min(1).max(1000000).default(1000000),
    page: z.coerce.number().int().min(1).max(1000).default(1),
    cursor: z.string().min(1).max(600).optional(),
    use: briefSchema.shape.requirements.unwrap().shape.use,
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
      movement,
      caseDiameterMm,
      waterResistanceM,
      frameShape,
      frameMaterial,
      lensWidthMm,
      bridgeMm,
      templeMm,
      polarization,
      uvProtection,
      sizeSystem,
      shoeSize,
      connection,
      noiseCancellation,
      batteryHours,
      voltage,
      capacityLitres,
      use,
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
        movement,
        caseDiameterMm,
        waterResistanceM,
        frameShape,
        frameMaterial,
        lensWidthMm,
        bridgeMm,
        templeMm,
        polarization,
        uvProtection,
        sizeSystem,
        shoeSize,
        connection,
        noiseCancellation,
        batteryHours,
        voltage,
        capacityLitres,
        use,
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
