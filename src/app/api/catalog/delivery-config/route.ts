import { NextResponse } from "next/server";
import { loadDeliveryZones, loadPickupSlots } from "@/lib/delivery-data";
import { loadDeliverySettings, loadFeeBands } from "@/lib/delivery-pricing";

export async function GET() {
  const [zones, pickupSlots, settings] = await Promise.all([
    loadDeliveryZones(),
    loadPickupSlots(),
    loadDeliverySettings(),
  ]);

  const [b2cBands, b2bBands] = await Promise.all([
    loadFeeBands("b2c_delivery"),
    loadFeeBands("b2b_delivery"),
  ]);

  return NextResponse.json({
    zones,
    pickupSlots,
    rules: {
      settings,
      feeBands: {
        b2c_delivery: b2cBands,
        b2b_delivery: b2bBands,
      },
    },
  });
}
