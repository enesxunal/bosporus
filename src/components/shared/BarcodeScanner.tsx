"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Scan, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  label?: string;
}

export function BarcodeScanner({ onScan, label }: BarcodeScannerProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = "barcode-scanner-region";

  useEffect(() => {
    if (!open) return;

    let active = true;
    const scanner = new Html5Qrcode(regionId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 120 } },
        (decoded) => {
          onScan(decoded);
          setOpen(false);
        },
        () => {}
      )
      .catch(() => {
        if (active) setError("Kamera açılamadı. Barkodu elle yazabilirsiniz.");
      });

    return () => {
      active = false;
      scanner.stop().catch(() => {});
      try { scanner.clear(); } catch { /* ignore */ }
      scannerRef.current = null;
    };
  }, [open, onScan]);

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => { setError(""); setOpen(true); }}>
        <Scan className="w-4 h-4" />
        {label ?? "Barkod tara"}
      </Button>
      {open && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-4 max-w-md w-full">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold">Barkod tarayıcı</h3>
              <button type="button" onClick={() => setOpen(false)} className="p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div id={regionId} className="w-full overflow-hidden rounded-xl" />
            {error && <p className="text-sm text-bosporus-red mt-2">{error}</p>}
          </div>
        </div>
      )}
    </>
  );
}
