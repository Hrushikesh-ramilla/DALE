import { notFound } from "next/navigation";
import { getStoredProduct } from "@/server/catalog-store";
import { ProductDetailView } from "@/components/product-detail-view";
import { publicCatalog } from "@/domain/catalog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    let product;
    try {
      product = await getStoredProduct(id);
    } catch {
      product = publicCatalog.find((p) => p.id === id);
    }
    if (!product) return { title: "Product — DALE" };
    return {
      title: `${product.name} — DALE Luxury Collection`,
      description: product.description,
    };
  } catch {
    return { title: "Product — DALE" };
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let product;
  try {
    product = await getStoredProduct(id);
  } catch {
    product = publicCatalog.find((p) => p.id === id);
  }

  if (!product) {
    notFound();
  }

  return <ProductDetailView product={product} />;
}
