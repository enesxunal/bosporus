const MESSAGES: Record<string, { de: string; tr: string }> = {
  PRICE_MISMATCH: {
    de: "Preise haben sich geändert. Bitte Warenkorb prüfen.",
    tr: "Fiyatlar değişti. Lütfen sepeti kontrol edin.",
  },
  PICKUP_SLOT_FULL: {
    de: "Dieser Abholtermin ist ausgebucht. Bitte andere Zeit wählen.",
    tr: "Bu gel-al saati dolu. Lütfen başka saat seçin.",
  },
  MIN_ORDER_NOT_MET: {
    de: "Mindestbestellwert nicht erreicht.",
    tr: "Minimum sipariş tutarına ulaşılmadı.",
  },
  DELIVERY_DISTANCE_EXCEEDED: {
    de: "Lieferung nur bis 40 km möglich.",
    tr: "Teslimat en fazla 40 km mesafeye yapılır.",
  },
  DELIVERY_DISTANCE_EXCEEDED_B2B: {
    de: "Lieferung nur bis 50 km möglich.",
    tr: "Teslimat en fazla 50 km mesafeye yapılır.",
  },
  DELIVERY_ADDRESS_UNKNOWN: {
    de: "Adresse konnte nicht geprüft werden. Bitte PLZ und Adresse prüfen.",
    tr: "Adres doğrulanamadı. Posta kodu ve adresi kontrol edin.",
  },
  DELIVERY_ZONE_INVALID: {
    de: "Lieferung in diese PLZ nicht möglich.",
    tr: "Bu posta koduna teslimat yok.",
  },
  DELIVERY_DAY_INVALID: {
    de: "An diesem Tag keine Lieferung möglich.",
    tr: "Bu gün teslimat yapılmıyor.",
  },
  DELIVERY_FIELDS_REQUIRED: {
    de: "Bitte PLZ, Adresse und Lieferdatum angeben.",
    tr: "Posta kodu, adres ve teslimat tarihi gerekli.",
  },
  PICKUP_FIELDS_REQUIRED: {
    de: "Bitte Abholdatum und -zeit wählen.",
    tr: "Alış tarihi ve saati gerekli.",
  },
  PICKUP_DAY_INVALID: {
    de: "Abholung nur Mo–Sa möglich.",
    tr: "Gel-al sadece Pzt–Cmt.",
  },
  PICKUP_SLOT_INVALID: {
    de: "Ungültiger Abholtermin.",
    tr: "Geçersiz gel-al saati.",
  },
  PAYMENT_NOT_COMPLETED: {
    de: "Zahlung noch nicht abgeschlossen.",
    tr: "Ödeme henüz tamamlanmadı.",
  },
  STRIPE_ERROR: {
    de: "Online-Zahlung fehlgeschlagen. Bitte erneut versuchen.",
    tr: "Online ödeme başarısız. Lütfen tekrar deneyin.",
  },
  PAYPAL_ERROR: {
    de: "PayPal-Zahlung fehlgeschlagen. Bitte erneut versuchen.",
    tr: "PayPal ödemesi başarısız. Lütfen tekrar deneyin.",
  },
  AMOUNT_MISMATCH: {
    de: "Zahlungsbetrag stimmt nicht. Bitte erneut versuchen.",
    tr: "Ödeme tutarı uyuşmuyor. Lütfen tekrar deneyin.",
  },
  EMPTY_CART: {
    de: "Warenkorb ist leer.",
    tr: "Sepet boş.",
  },
  ORDER_FAILED: {
    de: "Bestellung fehlgeschlagen. Bitte später erneut versuchen.",
    tr: "Sipariş oluşturulamadı. Lütfen daha sonra tekrar deneyin.",
  },
};

export function checkoutErrorMessage(code: string, locale: "de" | "tr"): string {
  const entry = MESSAGES[code];
  if (entry) return locale === "tr" ? entry.tr : entry.de;
  return locale === "tr" ? "Bir hata oluştu." : "Ein Fehler ist aufgetreten.";
}
