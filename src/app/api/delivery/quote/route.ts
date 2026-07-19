import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isB2cFirstOrderEligible, quoteDelivery } from "@/lib/delivery-pricing";

export async function POST(request: Request) {
  const body = await request.json();
  const {
    orderType,
    subtotalGross,
    zipCode,
    address,
  } = body as {
    orderType: "delivery" | "click_collect";
    subtotalGross: number;
    zipCode?: string;
    address?: string;
  };

  if (!orderType || !Number.isFinite(subtotalGross)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  let isB2b = false;
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
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
    // guest
  }

  const firstOrderEligible = await isB2cFirstOrderEligible(userId, isB2b);

  const quote = await quoteDelivery({
    orderType,
    isB2b,
    subtotalGross,
    zipCode,
    address,
    firstOrderFree: firstOrderEligible,
  });

  return NextResponse.json({ quote, isB2b, firstOrderEligible });
}
