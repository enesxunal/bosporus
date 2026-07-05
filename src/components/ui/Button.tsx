import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "outline" | "danger" | "ghost" | "yellow";
type Size = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-bosporus text-white shadow-[var(--shadow-btn)] hover:bg-bosporus-dark active:scale-[0.98]",
  secondary:
    "bg-bosporus-light text-bosporus hover:bg-bosporus/15 active:scale-[0.98]",
  outline:
    "bg-white border-2 border-bosporus-gray-200 text-bosporus-gray-800 hover:border-bosporus hover:text-bosporus active:scale-[0.98]",
  danger:
    "bg-bosporus-red text-white hover:bg-red-700 active:scale-[0.98]",
  ghost:
    "text-bosporus-gray-800 hover:bg-bosporus-gray-100 active:scale-[0.98]",
  yellow:
    "bg-bosporus-yellow text-bosporus-gray-800 font-bold hover:bg-bosporus-yellow-dark active:scale-[0.98]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-11 px-5 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-base gap-2 rounded-xl",
  icon: "h-11 w-11 p-0 rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all duration-150",
        "disabled:opacity-50 disabled:pointer-events-none disabled:scale-100",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
      {children}
    </button>
  )
);
Button.displayName = "Button";
