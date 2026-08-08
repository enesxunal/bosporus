import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { isValidProductId } from "@/lib/favorites";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ productId: string }> }
) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { productId } = await context.params;
  if (!isValidProductId(productId)) {
    return NextResponse.json({ error: "INVALID_PRODUCT_ID" }, { status: 400 });
  }

  const { error, count } = await auth.supabase
    .from("product_favorites")
    .delete({ count: "exact" })
    .eq("user_id", auth.user.id)
    .eq("product_id", productId);

  if (error) {
    return NextResponse.json({ error: "DELETE_FAILED" }, { status: 500 });
  }

  // Idempotent: missing row is still success for current user scope
  return NextResponse.json({ ok: true, removed: (count ?? 0) > 0 });
}
