"use client";
import { retailTypes } from "@/domain/retail-types";
import type { RetailRequirements } from "@/domain/catalog";
import { isRetailCategory } from "@/domain/departments";
export function RetailFilters({
  category,
  value,
  onChange,
}: {
  category: string;
  value: RetailRequirements;
  onChange: (value: RetailRequirements) => void;
}) {
  if (!isRetailCategory(category)) return null;
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
                [key]:
                  key === "volumeMl"
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
      {select("productType", "Product type", retailTypes[category])}
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
        select("volumeMl", "Volume (ml)", ["30", "50", "100"])}
      <p className="muted">
        Exact variants · Merchant-authored sample offers ·{" "}
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
