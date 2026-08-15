"use client";

import { useEffect } from "react";
import { ensureFirstTouchCaptured } from "@/lib/acquisition-client";

export function AcquisitionCapture() {
  useEffect(() => {
    ensureFirstTouchCaptured();
  }, []);

  return null;
}
