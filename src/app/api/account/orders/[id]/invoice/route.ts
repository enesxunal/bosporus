import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { generateInvoicePdfBytes } from "@/lib/invoice-pdf";
import { orderToInvoiceData } from "@/lib/order-invoice-data";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const { data: order, error } = await auth.supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("user_id", auth.user.id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  const { data: items } = await auth.supabase.from("order_items").select("*").eq("order_id", id);

  const pdf = generateInvoicePdfBytes(orderToInvoiceData(order, items ?? []));

  return new NextResponse(pdf.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${order.order_number}.pdf"`,
    },
  });
}
