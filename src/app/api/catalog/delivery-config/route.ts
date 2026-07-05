import { NextResponse } from "next/server";
import { loadDeliveryZones, loadPickupSlots } from "@/lib/delivery-data";

export async function GET() {
  const [zones, pickupSlots] = await Promise.all([loadDeliveryZones(), loadPickupSlots()]);
  return NextResponse.json({ zones, pickupSlots });
}
