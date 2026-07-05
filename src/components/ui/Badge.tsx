import { cn } from "@/lib/cn";

type BadgeVariant = "promo" | "default" | "success" | "muted";

const variants: Record<BadgeVariant, string> = {
  promo: "bg-bosporus-red text-white",
  default: "bg-bosporus text-white",
  success: "bg-green-600 text-white",
  muted: "bg-bosporus-gray-100 text-bosporus-gray-800",
};

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-wide rounded-md",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
