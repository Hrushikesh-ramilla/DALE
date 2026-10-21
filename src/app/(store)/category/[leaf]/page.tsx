import { notFound } from "next/navigation";
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
        "Explore 152 certified timepieces across 14 prestigious horological houses. In-house mechanical calibres, chronometers, and precision quartz movements.",
    };
  }
  return {
    title: `${leafTitles[leaf] || leaf} — DALE Luxury Collection`,
    description: `Explore authenticated models in ${leafTitles[leaf] || leaf} with verified technical specifications.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ leaf: string }>;
}) {
  const { leaf } = await params;
  if (!isLeafTypeKey(leaf)) {
    notFound();
  }

  if (leaf === "watches") {
    return <WatchesCatalogView />;
  }

  const initialBrands = await getCategoryBrandsSummary(leaf);
  return <CategoryCatalogView leaf={leaf} initialBrands={initialBrands} />;
}
