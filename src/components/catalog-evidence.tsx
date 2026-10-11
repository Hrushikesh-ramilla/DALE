import type { Product } from "@/domain/catalog";
import { researchSources } from "@/domain/research";
export function CatalogEvidence({ product }: { product: Product }) {
  const reviewed = product.source.startsWith("apple:")
    ? researchSources.filter((source) =>
        product.source.split(":")[1].split("+").includes(source.id),
      )
    : [];
  return (
    <div className="catalog-evidence">
      {product.source.startsWith("https://") ? (
        <a href={product.source} target="_blank" rel="noopener noreferrer">
          Manufacturer source ↗
        </a>
      ) : reviewed.length ? (
        reviewed.map((source) => (
          <a
            key={source.id}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {source.title} ↗
          </a>
        ))
      ) : (
        <span>Engineering fixture · {product.source}</span>
      )}
      {!!reviewed.length && (
        <small>
          Reviewed Apple sources · DALE sandbox offer · simulated price and
          stock
        </small>
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
