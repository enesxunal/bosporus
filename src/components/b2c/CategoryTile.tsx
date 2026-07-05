import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getCategoryImageUrl } from "@/lib/category-images";
import type { Category } from "@/lib/types";

interface CategoryTileProps {
  category: Category;
  locale: string;
}

export function CategoryTile({ category, locale }: CategoryTileProps) {
  const name = locale === "tr" && category.name_tr ? category.name_tr : category.name_de;
  const image = getCategoryImageUrl(category.slug);

  return (
    <Link
      href={`/products/${category.slug}`}
      className="group relative overflow-hidden rounded-sm bg-white border border-bosporus-gray-200 hover:shadow-lg transition-shadow aspect-[4/3]"
    >
      <Image
        src={image}
        alt={name}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-300"
        sizes="(max-width: 768px) 50vw, 25vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-white font-bold text-sm md:text-base leading-tight">{name}</h3>
        <p className="text-white/80 text-xs mt-0.5">{category.product_count} Artikel</p>
      </div>
    </Link>
  );
}
