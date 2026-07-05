type AuthLikeError = {
  message?: string;
  status?: number;
  code?: string;
};

export function authErrorMessage(error: AuthLikeError): string {
  const msg = error.message?.trim();
  if (msg && msg !== "{}") return msg;

  if (error.code === "email_exists" || error.status === 422) {
    return "Diese E-Mail ist bereits registriert.";
  }
  if (error.code === "weak_password") {
    return "Passwort zu schwach (mindestens 6 Zeichen).";
  }

  return "Registrierung fehlgeschlagen. Bitte später erneut versuchen.";
}
