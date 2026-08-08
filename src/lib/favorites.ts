/** Pure helpers for product favorites (API + tests). */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidProductId(id: unknown): id is string {
  return typeof id === "string" && UUID_RE.test(id.trim());
}

export function parseFavoriteProductId(
  body: unknown
): { ok: true; productId: string } | { ok: false; status: 400; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, status: 400, error: "INVALID_BODY" };
  }
  const productId = (body as { productId?: unknown }).productId;
  if (!isValidProductId(productId)) {
    return { ok: false, status: 400, error: "INVALID_PRODUCT_ID" };
  }
  return { ok: true, productId: productId.trim() };
}

/** Postgres unique_violation */
export function isUniqueViolation(error: { code?: string } | null | undefined): boolean {
  return error?.code === "23505";
}

export function assertFavoriteOwnership(params: {
  requesterId: string;
  rowUserId: string | null | undefined;
}): { ok: true } | { ok: false; status: 403 | 404 } {
  if (!params.rowUserId) return { ok: false, status: 404 };
  if (params.rowUserId !== params.requesterId) return { ok: false, status: 403 };
  return { ok: true };
}

/** Optimistic Set update for add/remove (rollback = previous Set). */
export function applyOptimisticFavorite(
  ids: Set<string>,
  productId: string,
  nextFavorite: boolean
): Set<string> {
  const next = new Set(ids);
  if (nextFavorite) next.add(productId);
  else next.delete(productId);
  return next;
}

/** Client-side quick-order filter: keep only favorited products. */
export function filterProductsByFavorites<T extends { id: string }>(
  products: T[],
  favoriteIds: Set<string>,
  onlyFavorites: boolean
): T[] {
  if (!onlyFavorites) return products;
  return products.filter((p) => favoriteIds.has(p.id));
}
