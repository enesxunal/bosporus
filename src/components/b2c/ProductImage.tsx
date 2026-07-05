import Image from "next/image";
import { getProductImageUrl } from "@/lib/category-images";
import type { Product } from "@/lib/types";

interface ProductImageProps {
  product: Pick<Product, "name_de" | "image_url" | "category_slug">;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

export function ProductImage({ product, className = "object-cover", priority, sizes }: ProductImageProps) {
  const src = getProductImageUrl(product);
  return (
    <Image
      src={src}
      alt={product.name_de}
      fill
      className={className}
      priority={priority}
      sizes={sizes ?? "(max-width: 768px) 50vw, 25vw"}
    />
  );
}
