import Link from "next/link";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="editorial-breadcrumbs">
      <ol>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} aria-current={isLast ? "page" : undefined}>
              {idx > 0 && <span className="sep">/</span>}
              {!isLast && item.href ? (
                <Link href={item.href}>{item.label}</Link>
              ) : (
                <span className="current">{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
