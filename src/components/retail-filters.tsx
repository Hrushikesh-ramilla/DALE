"use client";
import { retailTypes } from "@/domain/retail-types";
import type { RetailRequirements } from "@/domain/catalog";
import { publicCatalog } from "@/domain/catalog";
import { isRetailCategory } from "@/domain/departments";
export function RetailFilters({
  facets,
  category,
  value,
  onChange,
  fixtures = false,
}: {
  facets?: Record<string, string[]>;
  category: string;
  value: RetailRequirements;
  onChange: (value: RetailRequirements) => void;
  fixtures?: boolean;
}) {
  if (
    !isRetailCategory(category) &&
    !facets?.brand?.length &&
    !publicCatalog.some((p) => p.category === category && p.brand)
  )
    return null;
  const records = publicCatalog.filter((p) => p.category === category);
  const recorded = (key: keyof RetailRequirements) =>
    facets?.[key] || [
      ...new Set(
        records
          .map((p) => p.attributes?.[key])
          .filter((v) => v !== undefined)
          .map(String),
      ),
    ];
  function select(
    key: keyof RetailRequirements,
    label: string,
    choices: string[],
  ) {
    return (
      <label>
        {label}
        <select
          aria-label={label}
          value={String(value[key] ?? "")}
          onChange={(event) => {
            const next = { ...value };
            if (event.target.value)
              Object.assign(next, {
                [key]: [
                  "volumeMl",
                  "storageGb",
                  "ramGb",
                  "caseDiameterMm",
                  "waterResistanceM",
                  "lensWidthMm",
                  "bridgeMm",
                  "templeMm",
                  "batteryHours",
                  "voltage",
                  "capacityLitres",
                ].includes(key)
                  ? Number(event.target.value)
                  : event.target.value,
              });
            else delete next[key];
            onChange(next);
          }}
        >
          <option value="">Any recorded {label.toLowerCase()}</option>
          {choices.map((choice) => (
            <option key={choice}>{choice}</option>
          ))}
        </select>
      </label>
    );
  }
  return (
    <div className="retail-filters" aria-label="Department requirements">
      {!fixtures && select("brand", "Brand", recorded("brand"))}
      {!fixtures && select("modelName", "Model", recorded("modelName"))}
      {select(
        "productType",
        "Product type",
        fixtures && isRetailCategory(category)
          ? retailTypes[category]
          : recorded("productType"),
      )}
      {["phones", "laptops", "tablets", "storage"].includes(category) && (
        <>
          {select("storageGb", "Storage (GB)", recorded("storageGb"))}
          {select("ramGb", "RAM (GB)", recorded("ramGb"))}
        </>
      )}
      {category === "watches" && (
        <>
          {select("movement", "Movement", recorded("movement"))}
          {select(
            "caseDiameterMm",
            "Case diameter (mm)",
            recorded("caseDiameterMm"),
          )}
          {select(
            "waterResistanceM",
            "Stated water resistance (m)",
            recorded("waterResistanceM"),
          )}
        </>
      )}
      {category === "sunglasses" && (
        <>
          {select("frameShape", "Frame shape", recorded("frameShape"))}
          {select("frameMaterial", "Frame material", recorded("frameMaterial"))}
          {select("polarization", "Polarization", recorded("polarization"))}
          {select("lensWidthMm", "Lens width (mm)", recorded("lensWidthMm"))}
        </>
      )}
      {category === "footwear" && (
        <>
          {select("sizeSystem", "Sizing system", recorded("sizeSystem"))}
          {select("shoeSize", "Shoe size", recorded("shoeSize"))}
        </>
      )}
      {["headphones", "earbuds", "audio"].includes(category) && (
        <>
          {select("connection", "Connection", recorded("connection"))}
          {select(
            "noiseCancellation",
            "Noise cancellation",
            recorded("noiseCancellation"),
          )}
        </>
      )}
      {category === "fragrance" &&
        select("concentration", "Concentration", recorded("concentration"))}
      {category === "clothing" && select("size", "Size", ["S", "M", "L"])}
      {["clothing", "bags", "home"].includes(category) &&
        select(
          "material",
          "Material",
          category === "clothing"
            ? [
                "cotton",
                "linen",
                "merino wool",
                "wool blend",
                "denim",
                "recycled polyester",
                "silk",
                "cashmere",
              ]
            : category === "bags"
              ? ["canvas", "nylon", "leather"]
              : [
                  "cotton",
                  "linen",
                  "ceramic",
                  "stoneware",
                  "glass",
                  "acacia wood",
                  "steel",
                  "bamboo",
                  "porcelain",
                ],
        )}
      {category === "fragrance" &&
        select("scent", "Scent family", [
          "citrus",
          "floral",
          "woody",
          "gourmand",
          "fresh",
          "amber",
          "aromatic",
          "spicy",
        ])}
      {category === "fragrance" &&
        select(
          "volumeMl",
          "Volume (ml)",
          fixtures ? ["30", "50", "100"] : recorded("volumeMl"),
        )}
      <p className="muted">
        Exact variants ·{" "}
        {fixtures
          ? "Engineering fixtures"
          : "Manufacturer facts; sandbox offers"}{" "}
        ·{" "}
        {category === "clothing"
          ? "Review measurements; size labels do not guarantee fit."
          : category === "fragrance"
            ? "Notes describe a preference; enjoyment is personal."
            : "Check recorded dimensions against your needs."}
      </p>
    </div>
  );
}
