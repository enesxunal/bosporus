import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getCategoryImageUrl } from "@/lib/category-images";
import type { Category } from "@/lib/types";
import { ArrowRight } from "lucide-react";

interface CategoryTileProps {
  category: Category;
  locale: string;
}

export function CategoryTile({ category, locale }: CategoryTileProps) {
  const name = locale === "tr" && category.name_tr ? category.name_tr : category.name_de;
  const image = getCategoryImageUrl(category.slug);
  const countLabel = locale === "de" ? `${category.product_count} Artikel` : `${category.product_count} ürün`;

  return (
    <Link
      href={`/products/${category.slug}`}
      className="group relative overflow-hidden rounded-2xl card card-hover aspect-[4/3] block"
    >
      <Image
        src={image}
        alt={name}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-110"
        sizes="(max-width: 640px) 50vw, 25vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
        <h3 className="text-white font-bold text-sm sm:text-base leading-tight">{name}</h3>
        <p className="text-white/75 text-xs mt-1 font-medium flex items-center gap-1">
          {countLabel}
          <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
        </p>
      </div>
    </Link>
  );
}
