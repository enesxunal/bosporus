import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateInvoicePdfBytes } from "@/lib/invoice-pdf";
import { orderToInvoiceData } from "@/lib/order-invoice-data";

export async function POST(request: Request) {
  const { orderNumber, email } = (await request.json()) as {
    orderNumber?: string;
    email?: string;
  };

  const num = orderNumber?.trim().toUpperCase();
  const mail = email?.trim().toLowerCase();

  if (!num || !mail) {
    return NextResponse.json({ error: "Sipariş numarası ve e-posta gerekli" }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "DB error" }, { status: 503 });

  const { data: order, error } = await admin
    .from("orders")
    .select("*")
    .eq("order_number", num)
    .ilike("customer_email", mail)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!order) {
    return NextResponse.json({ error: "Sipariş bulunamadı." }, { status: 404 });
  }

  const { data: items } = await admin.from("order_items").select("*").eq("order_id", order.id);

  const pdf = generateInvoicePdfBytes(orderToInvoiceData(order, items ?? []));

  return new NextResponse(pdf.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${order.order_number}.pdf"`,
    },
  });
}
