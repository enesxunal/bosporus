import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

export function Card({ children, className, hover = false, padding = "md" }: CardProps) {
  return (
    <div className={cn("card", hover && "card-hover", paddingMap[padding], className)}>
      {children}
    </div>
  );
}
