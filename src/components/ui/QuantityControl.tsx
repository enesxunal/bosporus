"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

interface QuantityControlProps {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  size?: "sm" | "md";
  className?: string;
}

export function QuantityControl({
  value,
  onDecrease,
  onIncrease,
  size = "md",
  className,
}: QuantityControlProps) {
  const btn = size === "sm" ? "h-9 w-9" : "h-11 w-11";

  return (
    <div className={cn("inline-flex items-center gap-1 bg-bosporus-gray-50 rounded-xl p-1 border border-bosporus-gray-200", className)}>
      <button
        type="button"
        onClick={onDecrease}
        className={cn(
          btn,
          "flex items-center justify-center rounded-lg bg-white text-bosporus-gray-800",
          "hover:bg-bosporus-light active:scale-95 transition-all shadow-sm"
        )}
        aria-label="Decrease"
      >
        <Minus className="w-4 h-4" />
      </button>
      <span className={cn("text-center font-bold text-bosporus-gray-800", size === "sm" ? "w-8 text-sm" : "w-10")}>
        {value}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        className={cn(
          btn,
          "flex items-center justify-center rounded-lg bg-bosporus text-white",
          "hover:bg-bosporus-dark active:scale-95 transition-all shadow-sm"
        )}
        aria-label="Increase"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
