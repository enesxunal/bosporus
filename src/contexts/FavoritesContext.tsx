"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuthOptional } from "@/contexts/AuthContext";
import { trackAddToWishlist, trackRemoveFromWishlist } from "@/lib/analytics";
import { applyOptimisticFavorite } from "@/lib/favorites";

interface FavoritesContextValue {
  favorites: Set<string>;
  loading: boolean;
  isFavorite: (productId: string) => boolean;
  addFavorite: (productId: string, meta?: { item_id?: string; item_name?: string; price?: number }) => Promise<boolean>;
  removeFavorite: (productId: string, meta?: { item_id?: string; item_name?: string }) => Promise<boolean>;
  toggleFavorite: (
    productId: string,
    meta?: { item_id?: string; item_name?: string; price?: number }
  ) => Promise<boolean>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const auth = useAuthOptional();
  const userId = auth?.user?.id ?? null;
  const authLoading = auth?.loading ?? true;
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;

      if (!userId) {
        setIds(new Set());
        setLoading(false);
        return;
      }

      setLoading(true);

      fetch("/api/account/favorites")
        .then(async (res) => {
          if (!res.ok) throw new Error("load");
          return res.json() as Promise<{ productIds?: string[] }>;
        })
        .then((data) => {
          if (cancelled) return;
          setIds(new Set(data.productIds ?? []));
        })
        .catch(() => {
          if (!cancelled) setIds(new Set());
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });

    return () => {
      cancelled = true;
    };
  }, [userId, authLoading]);

  const isFavorite = useCallback((productId: string) => ids.has(productId), [ids]);

  const addFavorite = useCallback(
    async (
      productId: string,
      meta?: { item_id?: string; item_name?: string; price?: number }
    ) => {
      if (!userId) return false;
      const prev = ids;
      setIds((s) => applyOptimisticFavorite(s, productId, true));
      try {
        const res = await fetch("/api/account/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        if (!res.ok) throw new Error("add");
        if (meta?.item_id && meta?.item_name) {
          trackAddToWishlist({
            item_id: meta.item_id,
            item_name: meta.item_name,
            price: meta.price,
          });
        }
        return true;
      } catch {
        setIds(prev);
        return false;
      }
    },
    [userId, ids]
  );

  const removeFavorite = useCallback(
    async (productId: string, meta?: { item_id?: string; item_name?: string }) => {
      if (!userId) return false;
      const prev = ids;
      setIds((s) => applyOptimisticFavorite(s, productId, false));
      try {
        const res = await fetch(`/api/account/favorites/${productId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("remove");
        if (meta?.item_id && meta?.item_name) {
          trackRemoveFromWishlist({
            item_id: meta.item_id,
            item_name: meta.item_name,
          });
        }
        return true;
      } catch {
        setIds(prev);
        return false;
      }
    },
    [userId, ids]
  );

  const toggleFavorite = useCallback(
    async (
      productId: string,
      meta?: { item_id?: string; item_name?: string; price?: number }
    ) => {
      if (ids.has(productId)) {
        return removeFavorite(productId, meta);
      }
      return addFavorite(productId, meta);
    },
    [ids, addFavorite, removeFavorite]
  );

  const value = useMemo(
    () => ({
      favorites: ids,
      loading: authLoading || loading,
      isFavorite,
      addFavorite,
      removeFavorite,
      toggleFavorite,
    }),
    [ids, authLoading, loading, isFavorite, addFavorite, removeFavorite, toggleFavorite]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    return {
      favorites: new Set(),
      loading: false,
      isFavorite: () => false,
      addFavorite: async () => false,
      removeFavorite: async () => false,
      toggleFavorite: async () => false,
    };
  }
  return ctx;
}
