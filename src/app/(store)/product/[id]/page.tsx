import { notFound, redirect } from "next/navigation";
import { getPublishedProduct } from "@/server/catalog-store";
import { ProductDetailView } from "@/components/product-detail-view";
import { getDatabase } from "@/server/database";
import { publishedReplacement } from "@/server/catalog-repairs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    let product;
    try {
      product = await getPublishedProduct(id);
    } catch {
      product = undefined;
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
    product = await getPublishedProduct(id);
  } catch {
    product = undefined;
  }

  if (!product) {
    const replacement = await publishedReplacement(await getDatabase(), id);
    if (replacement) redirect(`/product/${encodeURIComponent(replacement)}`);
    notFound();
  }

  return <ProductDetailView product={product} />;
}
