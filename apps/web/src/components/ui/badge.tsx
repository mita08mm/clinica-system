import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'outline';
  dot?: boolean;
}

const variants: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-[var(--neutral-100)] text-[var(--neutral-700)] ring-1 ring-inset ring-[var(--neutral-200)]',
  success: 'bg-[var(--semantic-success-bg)] text-[var(--semantic-success)] ring-1 ring-inset ring-[rgba(45,122,79,0.18)]',
  warning: 'bg-[var(--semantic-warning-bg)] text-[var(--semantic-warning)] ring-1 ring-inset ring-[rgba(199,122,31,0.20)]',
  danger:  'bg-[var(--semantic-danger-bg)]  text-[var(--semantic-danger)]  ring-1 ring-inset ring-[rgba(181,58,58,0.18)]',
  info:    'bg-[var(--semantic-info-bg)]    text-[var(--semantic-info)]    ring-1 ring-inset ring-[rgba(42,95,143,0.18)]',
  brand:   'bg-[rgba(204,175,125,0.18)]     text-[var(--brand-morena)]     ring-1 ring-inset ring-[rgba(117,76,36,0.18)]',
  outline: 'bg-transparent text-[var(--neutral-700)] ring-1 ring-inset ring-[var(--neutral-300)]',
};

const dotColors: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-[var(--neutral-500)]',
  success: 'bg-[var(--semantic-success)]',
  warning: 'bg-[var(--semantic-warning)]',
  danger:  'bg-[var(--semantic-danger)]',
  info:    'bg-[var(--semantic-info)]',
  brand:   'bg-[var(--brand-morena)]',
  outline: 'bg-[var(--neutral-500)]',
};

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', dot, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium tracking-wide",
          variants[variant],
          className,
        )}
        {...props}
      >
        {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dotColors[variant])} />}
        {children}
      </div>
    );
  },
);
Badge.displayName = "Badge";

export { Badge };
