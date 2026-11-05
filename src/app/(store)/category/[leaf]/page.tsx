import { notFound, redirect } from "next/navigation";
import { isLeafTypeKey, leafTitles } from "@/domain/departments";
import { CategoryCatalogView } from "@/components/category-catalog-view";
import { WatchesCatalogView } from "@/components/watches-catalog-view";
import { getCategoryBrandsSummary } from "@/server/catalog-store";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ leaf: string }>;
}) {
  const { leaf } = await params;
  if (!isLeafTypeKey(leaf)) return { title: "Collection — DALE" };
  if (leaf === "watches") {
    return {
      title: "Precision & Luxury Watches — DALE Haute Horlogerie",
      description:
        "Explore watch references, recorded movements, selected variants and specifications.",
    };
  }
  return {
    title: `${leafTitles[leaf] || leaf} — DALE Luxury Collection`,
    description: `Explore ${leafTitles[leaf] || leaf}, recorded variants and product specifications.`,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ leaf: string }>;
  searchParams: Promise<{ brand?: string }>;
}) {
  const { leaf } = await params;
  if (!isLeafTypeKey(leaf)) {
    notFound();
  }

  const initialBrands = await getCategoryBrandsSummary(leaf);
  if (!initialBrands.length) notFound();
  const { brand } = await searchParams;
  const selectedBrand =
    brand &&
    initialBrands.find(
      (b) => b.name.toLowerCase() === brand.trim().toLowerCase(),
    );
  if (brand && !selectedBrand) redirect(`/category/${leaf}`);
  if (selectedBrand && brand !== selectedBrand.name)
    redirect(
      `/category/${leaf}?brand=${encodeURIComponent(selectedBrand.name)}`,
    );
  if (leaf === "watches")
    return <WatchesCatalogView initialBrands={initialBrands} />;
  return <CategoryCatalogView leaf={leaf} initialBrands={initialBrands} />;
}
