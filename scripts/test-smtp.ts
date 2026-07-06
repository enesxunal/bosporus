import { readFileSync } from "fs";
import nodemailer from "nodemailer";
import { isSmtpConfigured, sendEmail } from "../src/lib/email/smtp";

for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const i = trimmed.indexOf("=");
  if (i === -1) continue;
  const key = trimmed.slice(0, i);
  let val = trimmed.slice(i + 1);
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  process.env[key] = val;
}

async function tryVerify(port: number, secure: boolean) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    requireTLS: !secure,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  try {
    await transporter.verify();
    console.log(`Port ${port} (secure=${secure}) -> bağlantı OK`);
    return transporter;
  } catch (e) {
    console.log(`Port ${port} (secure=${secure}) ->`, e instanceof Error ? e.message : e);
    return null;
  }
}

async function main() {
  const to = process.argv[2] ?? process.env.ADMIN_NOTIFY_EMAIL ?? "info@bosporus-gmbh.com";

  console.log("SMTP host:", process.env.SMTP_HOST);
  console.log("SMTP user:", process.env.SMTP_USER);
  console.log("SMTP configured:", isSmtpConfigured());
  console.log("Test alıcı:", to);

  const transporter =
    (await tryVerify(587, false)) ?? (await tryVerify(465, true));

  if (!transporter) {
    console.log("❌ SMTP kimlik doğrulama başarısız (535). IONOS şifresini ve posta kutusu ayarlarını kontrol edin.");
    process.exit(1);
  }

  const result = await sendEmail({
    to,
    subject: "Bosporus SMTP testi",
    html: `<p>Bu bir test e-postasıdır.</p><p>Zaman: ${new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}</p>`,
    templateType: "campaign",
    referenceId: "smtp-test",
  });

  if (result.ok) {
    console.log("✅ E-posta gönderildi — gelen kutusunu kontrol edin (spam dahil).");
    return;
  }

  console.log("❌ Gönderilemedi:", "error" in result ? result.error : "SMTP yapılandırılmamış");
  process.exit(1);
}

main().catch((e) => {
  console.error("❌ Hata:", e instanceof Error ? e.message : e);
  process.exit(1);
});
