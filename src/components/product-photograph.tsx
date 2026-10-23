"use client";
import dynamic from "next/dynamic";

// Keep the complete identity-verification registry out of pages that do not
// render listing photographs. Its validation runs unchanged when requested.
export const ProductPhotograph = dynamic(
  () =>
    import("./verified-product-photograph").then(
      (module) => module.VerifiedProductPhotograph,
    ),
  {
    loading: () => (
      <div
        className="product-photograph-loading"
        aria-label="Loading product photograph"
        style={{ width: "100%", height: "100%" }}
      />
    ),
  },
);
