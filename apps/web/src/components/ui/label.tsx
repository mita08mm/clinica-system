import * as React from "react";
import { cn } from "@/lib/utils";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "block text-xs font-medium text-[var(--neutral-700)] mb-1.5 tracking-wide",
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-[var(--semantic-danger)] ml-0.5">*</span>}
    </label>
  )
);
Label.displayName = "Label";

export { Label };
