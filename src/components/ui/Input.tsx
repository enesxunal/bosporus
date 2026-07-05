import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="field-label">
          {label}
        </label>
      )}
      <input ref={ref} id={id} className={cn("field-input", error && "border-bosporus-red", className)} {...props} />
      {error && <p className="text-bosporus-red text-xs mt-1">{error}</p>}
    </div>
  )
);
Input.displayName = "Input";
