import { type ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  action?: { label: string; href: string };
  className?: string;
  children?: ReactNode;
}

export function SectionHeader({ eyebrow, title, action, className, children }: SectionHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6", className)}>
      <div>
        {eyebrow && (
          <span className="text-xs font-bold uppercase text-bosporus-red tracking-wider block mb-1">
            {eyebrow}
          </span>
        )}
        <h2 className="text-xl sm:text-2xl font-bold text-bosporus-gray-800 tracking-tight">{title}</h2>
        {children}
      </div>
      {action && (
        <Link
          href={action.href}
          className="text-sm font-bold text-bosporus hover:text-bosporus-dark transition-colors shrink-0"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
