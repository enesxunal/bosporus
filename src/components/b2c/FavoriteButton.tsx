"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAuthOptional } from "@/contexts/AuthContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import { cn } from "@/lib/cn";

type FavoriteButtonProps = {
  productId: string;
  itemId: string;
  itemName: string;
  price?: number;
  className?: string;
  size?: "sm" | "md";
};

export function FavoriteButton({
  productId,
  itemId,
  itemName,
  price,
  className,
  size = "sm",
}: FavoriteButtonProps) {
  const t = useTranslations("favorites");
  const router = useRouter();
  const auth = useAuthOptional();
  const user = auth?.user ?? null;
  const authLoading = auth?.loading ?? true;
  const { isFavorite, toggleFavorite } = useFavorites();
  const [busy, setBusy] = useState(false);
  const active = isFavorite(productId);

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (authLoading || busy) return;

    if (!user) {
      router.push("/login");
      return;
    }

    setBusy(true);
    try {
      await toggleFavorite(productId, {
        item_id: itemId,
        item_name: itemName,
        price,
      });
    } finally {
      setBusy(false);
    }
  };

  const label = active ? t("remove") : t("add");

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || authLoading}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center justify-center rounded-xl transition-colors",
        "bg-white/90 backdrop-blur-sm border border-bosporus-gray-200 shadow-sm",
        "hover:bg-bosporus-light hover:border-bosporus/30",
        "disabled:opacity-60",
        size === "sm" ? "h-9 w-9" : "h-11 w-11",
        className
      )}
    >
      <Heart
        className={cn(
          size === "sm" ? "w-4 h-4" : "w-5 h-5",
          active ? "fill-bosporus-red text-bosporus-red" : "text-bosporus-gray-800"
        )}
      />
    </button>
  );
}
