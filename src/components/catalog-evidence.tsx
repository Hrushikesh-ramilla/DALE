import type { Product } from "@/domain/catalog";
export function CatalogEvidence({ product }: { product: Product }) {
  return (
    <div className="catalog-evidence">
      {product.source.startsWith("https://") ? (
        <a href={product.source} target="_blank" rel="noopener noreferrer">
          Manufacturer source ↗
        </a>
      ) : (
        <span>Engineering fixture · {product.source}</span>
      )}
      {product.evidence && (
        <small>
          {product.evidence.region} record · Reviewed{" "}
          {product.evidence.checkedAt} ·{" "}
          {product.evidence.review === "product_identity"
            ? "Identity only; specifications incomplete"
            : "Recorded manufacturer facts"}
        </small>
      )}
      {product.evidence && (
        <small>
          {product.comparisonOnly
            ? "Comparison only · exact variant not verified"
            : "DALE sandbox offer · simulated price and stock"}
        </small>
      )}
      {!!product.evidence?.missing.length && (
        <details>
          <summary>Unverified or unavailable facts</summary>
          <ul>
            {product.evidence.missing.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
