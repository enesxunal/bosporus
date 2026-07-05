import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateInvoicePdfBytes } from "@/lib/invoice-pdf";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 503 });

  const { data: order, error } = await admin.from("orders").select("*").eq("id", id).single();
  if (error || !order) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });

  const { data: items } = await admin.from("order_items").select("*").eq("order_id", id);

  const addressRaw =
    order.delivery_address && typeof order.delivery_address === "object"
      ? (order.delivery_address as { raw?: string }).raw
      : undefined;

  const pdf = generateInvoicePdfBytes({
    orderNumber: order.order_number,
    createdAt: order.created_at,
    customerName: order.customer_name ?? "",
    customerEmail: order.customer_email ?? "",
    orderType: order.order_type,
    subtotalNet: Number(order.subtotal_net),
    taxAmount: Number(order.tax_amount),
    totalGross: Number(order.total_gross),
    zipCode: order.delivery_zip_code,
    address: addressRaw,
    deliveryDate: order.delivery_date ?? undefined,
    items: (items ?? []).map((i) => ({
      product_name: i.product_name,
      product_sku: i.product_sku,
      quantity: Number(i.quantity),
      line_total_gross: Number(i.line_total_gross),
    })),
  });

  return new NextResponse(pdf.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${order.order_number}.pdf"`,
    },
  });
}
