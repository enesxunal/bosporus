export async function validateVatId(vatId: string): Promise<{
  valid: boolean;
  name?: string;
  address?: string;
  error?: string;
}> {
  const cleaned = vatId.replace(/\s/g, "").toUpperCase();
  const match = cleaned.match(/^([A-Z]{2})(.+)$/);
  if (!match) {
    return { valid: false, error: "Ungültiges Format" };
  }
  const [, country, number] = match;

  try {
    const res = await fetch(
      `https://ec.europa.eu/taxation_customs/vies/rest-api/ms/${country}/vat/${number}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) {
      return { valid: false, error: "VIES API nicht erreichbar" };
    }
    const data = await res.json();
    if (!data.isValid) {
      return { valid: false, error: "USt-IdNr. nicht gültig" };
    }
    return {
      valid: true,
      name: data.name,
      address: data.address,
    };
  } catch {
    return { valid: false, error: "Verbindungsfehler bei VIES" };
  }
}
