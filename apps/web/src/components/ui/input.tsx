import * as React from "react";
import { cn } from "@/lib/utils";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-[var(--radius-md)] border border-[var(--neutral-300)] bg-white px-3.5 py-2",
          "text-sm text-[var(--neutral-800)] transition-colors duration-150",
          "placeholder:text-[var(--neutral-400)]",
          "focus:outline-none focus:border-[var(--brand-morena)] focus:ring-[3px] focus:ring-[rgba(117,76,36,0.12)]",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--neutral-50)]",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
