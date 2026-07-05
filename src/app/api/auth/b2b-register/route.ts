import { NextResponse } from "next/server";
import { validateVatId } from "@/lib/vies";

export async function POST(request: Request) {
  const body = await request.json();
  const { companyName, companyAddress, vatId, email, password } = body;

  if (!companyName || !companyAddress || !vatId || !email || !password) {
    return NextResponse.json({ error: "Alle Felder sind Pflicht" }, { status: 400 });
  }

  if (!/^DE\d{9}$/.test(vatId.replace(/\s/g, ""))) {
    return NextResponse.json(
      { error: "Nur deutsche USt-IdNr. (DE + 9 Ziffern) werden unterstützt" },
      { status: 400 }
    );
  }

  const vies = await validateVatId(vatId);
  if (!vies.valid) {
    return NextResponse.json({ error: vies.error ?? "USt-IdNr. ungültig" }, { status: 400 });
  }

  // TODO: Supabase Auth + profiles insert when credentials are configured
  // For MVP without Supabase: return success after VIES validation
  return NextResponse.json({
    success: true,
    message: "Gewerbekonto verifiziert! Sie können jetzt im Portal einkaufen.",
    viesName: vies.name,
  });
}
