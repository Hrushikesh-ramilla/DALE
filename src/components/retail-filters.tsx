"use client";
import { retailTypes } from "@/domain/retail-types";
import type { RetailRequirements } from "@/domain/catalog";
import { publicCatalog } from "@/domain/catalog";
import { isRetailCategory } from "@/domain/departments";
export function RetailFilters({
  category,
  value,
  onChange,
  fixtures = false,
}: {
  category: string;
  value: RetailRequirements;
  onChange: (value: RetailRequirements) => void;
  fixtures?: boolean;
}) {
  if (
    !isRetailCategory(category) &&
    !publicCatalog.some((p) => p.category === category && p.brand)
  )
    return null;
  const records = publicCatalog.filter((p) => p.category === category);
  const recorded = (key: keyof RetailRequirements) => [
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
                [key]: ["volumeMl", "storageGb", "ramGb"].includes(key)
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
      {["fragrance", "beauty"].includes(category) &&
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
            : category === "beauty"
              ? "Ingredients do not establish allergy or medical safety."
              : "Check recorded dimensions against your needs."}
      </p>
    </div>
  );
}
