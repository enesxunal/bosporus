/** Resmi şirket bilgileri – Impressum, fatura, e-posta */
export const COMPANY = {
  legalName: "BOSPORUS Handelsgesellschaft mbH",
  tradeName: "Bosporus",
  street: "Von-Hünefeld-Str. 2",
  city: "Köln",
  zip: "50829",
  country: "Deutschland",
  countryEn: "Germany",
  phone: "+49 221 34098290",
  email: "info@bosporus-gmbh.com",
  website: "https://bosporus-blue.vercel.app",
  taxNumber: "217/5713/2173",
  vatId: "DE317695485",
  registerCourt: "Amtsgericht Köln",
  registerNumber: "HRB 93064",
} as const;

export function companyAddressLine(): string {
  return `${COMPANY.street}, ${COMPANY.zip} ${COMPANY.city}`;
}

export function companyAddressBlock(): string {
  return `${COMPANY.legalName}\n${COMPANY.street}\n${COMPANY.zip} ${COMPANY.city}\n${COMPANY.country}`;
}
