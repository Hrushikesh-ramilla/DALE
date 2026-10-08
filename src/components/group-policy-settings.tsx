"use client";
import { useState } from "react";
import { catalog } from "@/domain/catalog";
import { realProducts } from "@/domain/research";
import type { GroupPolicy, GroupPolicyInput } from "@/domain/group-policy";

export function GroupPolicySettings({
  policy,
  busy,
  onSave,
}: {
  policy: GroupPolicy;
  busy: boolean;
  onSave: (policy: GroupPolicyInput, version: number) => Promise<void>;
}) {
  const [draft, setDraft] = useState<GroupPolicyInput>(policy);
  const [sku, setSku] = useState("P001");
  const numeric = (
    name:
      | "minimumMembers"
      | "discountPercent"
      | "formingMinutes"
      | "checkoutMinutes",
    label: string,
    min: number,
    max: number,
  ) => (
    <label>
      {label}
      <input
        type="number"
        min={min}
        max={max}
        required
        value={draft[name]}
        onChange={(event) =>
          setDraft({ ...draft, [name]: Number(event.target.value) })
        }
      />
    </label>
  );
  return (
    <details className="invite-panel">
      <summary>Merchant group pricing · policy {policy.version}</summary>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void onSave(draft, policy.version);
        }}
      >
        <p>
          Reviewer approval applies to new groups only. Existing groups and
          approved prices keep their recorded terms.
        </p>
        {numeric("minimumMembers", "Default minimum shoppers", 2, 100)}
        {numeric("discountPercent", "Default discount, percent", 1, 80)}
        {numeric(
          "formingMinutes",
          "Group formation deadline, minutes",
          5,
          10080,
        )}
        {numeric("checkoutMinutes", "Locked checkout window, minutes", 5, 1440)}
        <label>
          Product-specific tier
          <select value={sku} onChange={(event) => setSku(event.target.value)}>
            {[...catalog, ...realProducts].map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.id})
              </option>
            ))}
          </select>
        </label>
        <button
          className="button secondary small"
          type="button"
          onClick={() =>
            setDraft({
              ...draft,
              productTiers: [
                ...draft.productTiers.filter((tier) => tier.productId !== sku),
                {
                  productId: sku,
                  minimumMembers: draft.minimumMembers,
                  discountPercent: draft.discountPercent,
                },
              ],
            })
          }
        >
          Use these member and discount values for this product
        </button>
        {draft.productTiers.map((tier) => (
          <p key={tier.productId}>
            {tier.productId}: {tier.minimumMembers} shoppers,{" "}
            {tier.discountPercent}% off{" "}
            <button
              type="button"
              className="button secondary small"
              onClick={() =>
                setDraft({
                  ...draft,
                  productTiers: draft.productTiers.filter(
                    (item) => item.productId !== tier.productId,
                  ),
                })
              }
            >
              Remove tier {tier.productId}
            </button>
          </p>
        ))}
        <button className="button primary" disabled={busy}>
          Approve group policy
        </button>
      </form>
    </details>
  );
}
