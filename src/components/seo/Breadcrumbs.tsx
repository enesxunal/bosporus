import { Link } from "@/i18n/navigation";
import { ChevronRight } from "lucide-react";
import type { BreadcrumbItem } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(items)} />
      <nav aria-label="Breadcrumb" className="page-container py-3">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-bosporus-muted">
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            return (
              <li key={`${item.name}-${i}`} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-50" aria-hidden />}
                {item.href && !isLast ? (
                  <Link href={item.href} className="hover:text-bosporus font-medium transition-colors">
                    {item.name}
                  </Link>
                ) : (
                  <span className={isLast ? "text-bosporus-gray-800 font-semibold" : ""}>{item.name}</span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
