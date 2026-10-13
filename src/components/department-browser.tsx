"use client";
import { departments, categoryTitles } from "@/domain/departments";
import { publicCatalog } from "@/domain/catalog";
import {
  ArrowRight,
  Smartphone,
  Laptop,
  Tablet,
  Headphones,
  Keyboard,
  Plug,
  ShoppingBag,
} from "lucide-react";
const icons = {
  phones: Smartphone,
  laptops: Laptop,
  tablets: Tablet,
  audio: Headphones,
  accessories: Keyboard,
  chargers: Plug,
};
export function DepartmentBrowser({
  departmentId,
  category,
  onDepartment,
  onCategory,
}: {
  departmentId: string;
  category: string;
  onDepartment: (id: string) => void;
  onCategory: (category: string, productType?: string) => void;
}) {
  const department = departments.find((d) => d.id === departmentId);
  const records = publicCatalog.filter((p) => p.category === category);
  const types = [
    ...new Set(
      records
        .map((p) => p.attributes?.productType)
        .filter((type): type is string => !!type),
    ),
  ];
  return (
    <section
      className="department-browser"
      aria-label="Browse departments and categories"
    >
      <nav className="department-tabs" aria-label="Departments">
        {departments.map((d) => (
          <button
            type="button"
            key={d.id}
            aria-pressed={d.id === departmentId}
            onClick={() => onDepartment(d.id)}
          >
            {d.title}
          </button>
        ))}
      </nav>
      {department && (
        <>
          <div className="department-breadcrumb">
            <span>Collections</span>
            <span>/</span>
            <button type="button" onClick={() => onDepartment(department.id)}>
              {department.title}
            </button>
            {category && (
              <>
                <span>/</span>
                <span>
                  {categoryTitles[category as keyof typeof categoryTitles]}
                </span>
              </>
            )}
          </div>
          <h3>
            {category
              ? "Refine your collection"
              : `Explore ${department.title}`}
          </h3>
          <div className="department-grid">
            {department.categories
              .filter((c) => publicCatalog.some((p) => p.category === c))
              .map((c) => {
                const Icon = icons[c as keyof typeof icons] || ShoppingBag;
                const count = publicCatalog.filter(
                  (p) => p.category === c,
                ).length;
                return (
                  <button
                    className="department-tile"
                    type="button"
                    key={c}
                    aria-pressed={category === c}
                    onClick={() => onCategory(c)}
                  >
                    <Icon size={28} strokeWidth={1} />
                    <strong>{categoryTitles[c]}</strong>
                    <small>{count} sourced records</small>
                    <ArrowRight size={18} />
                  </button>
                );
              })}
          </div>
          {category && types.length > 0 && (
            <div className="department-types" aria-label="Product types">
              {types.map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => onCategory(category, type)}
                >
                  {type}
                  <ArrowRight size={13} />
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
