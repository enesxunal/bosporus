import { NextResponse } from "next/server";
import { createOrder } from "@/lib/orders";
import { isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { CartItem } from "@/lib/types";

export async function POST(request: Request) {
  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      {
        error:
          "Datenbank nicht verbunden. Bitte Supabase in Vercel verbinden und Migration ausführen.",
        code: "SUPABASE_NOT_CONFIGURED",
      },
      { status: 503 }
    );
  }

  const body = await request.json();
  const {
    items,
    orderType,
    customerEmail,
    customerName,
    zipCode,
    address,
    pickupDate,
    pickupSlot,
    notes,
  } = body as {
    items: CartItem[];
    orderType: "delivery" | "click_collect";
    customerEmail: string;
    customerName: string;
    zipCode?: string;
    address?: string;
    pickupDate?: string;
    pickupSlot?: string;
    notes?: string;
  };

  if (!items?.length) {
    return NextResponse.json({ error: "Warenkorb leer" }, { status: 400 });
  }
  if (!customerEmail?.trim() || !customerName?.trim()) {
    return NextResponse.json({ error: "Name und E-Mail erforderlich" }, { status: 400 });
  }

  let userId: string | null = null;
  let isB2b = false;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      isB2b = profile?.role === "b2b_approved";
    }
  } catch {
    // guest checkout
  }

  const result = await createOrder({
    items,
    orderType,
    customerEmail: customerEmail.trim(),
    customerName: customerName.trim(),
    userId,
    isB2b,
    zipCode,
    address,
    pickupDate,
    pickupSlot,
    notes,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    orderNumber: result.orderNumber,
    orderId: result.orderId,
    total: result.totalGross,
  });
}
