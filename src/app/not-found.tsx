import Link from "next/link";
import { COMPANY } from "@/lib/company";

export default function NotFound() {
  return (
    <html lang="de">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          background: "#f5f7fa",
          color: "#1a2332",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1d71b8", letterSpacing: "0.06em" }}>
            404
          </p>
          <h1 style={{ fontSize: "1.75rem", margin: "0.5rem 0 0.75rem" }}>Seite nicht gefunden</h1>
          <p style={{ color: "#5a6577", lineHeight: 1.5, marginBottom: "1.5rem" }}>
            Diese Seite gibt es nicht oder der Link ist veraltet.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", alignItems: "center" }}>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                background: "#1d71b8",
                color: "#fff",
                fontWeight: 700,
                padding: "0.75rem 1.25rem",
                borderRadius: 12,
                textDecoration: "none",
              }}
            >
              Zur Startseite
            </Link>
            <Link href="/products" style={{ color: "#1d71b8", fontWeight: 600, textDecoration: "none" }}>
              Produkte ansehen
            </Link>
            <a href={`mailto:${COMPANY.email}`} style={{ color: "#5a6577", fontSize: "0.9rem" }}>
              {COMPANY.email}
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
