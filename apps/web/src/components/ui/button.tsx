import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-[var(--brand-morena)] text-white hover:bg-[var(--brand-morena-dark)] focus-visible:ring-[rgba(117,76,36,0.28)] shadow-[var(--shadow-xs)]',
  secondary:
    'bg-[rgba(204,175,125,0.14)] text-[var(--brand-morena)] hover:bg-[rgba(204,175,125,0.24)] focus-visible:ring-[rgba(204,175,125,0.35)]',
  outline:
    'border border-[var(--neutral-300)] bg-white text-[var(--neutral-800)] hover:bg-[var(--neutral-50)] hover:border-[var(--neutral-400)] focus-visible:ring-[rgba(117,76,36,0.18)]',
  ghost:
    'text-[var(--neutral-700)] hover:bg-[var(--neutral-100)] hover:text-[var(--brand-morena)] focus-visible:ring-[rgba(117,76,36,0.12)]',
  danger:
    'bg-[var(--semantic-danger)] text-white hover:opacity-90 focus-visible:ring-[rgba(181,58,58,0.35)]',
  success:
    'bg-[var(--semantic-success)] text-white hover:opacity-90 focus-visible:ring-[rgba(45,122,79,0.35)]',
};

const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  xs: 'h-7 px-2.5 text-[11px] rounded-md gap-1.5',
  sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
  md: 'h-10 px-4 text-sm rounded-lg gap-2',
  lg: 'h-11 px-5 text-sm rounded-lg gap-2',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-medium tracking-wide',
          'transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-white',
          'disabled:pointer-events-none disabled:opacity-50',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
            <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';

export { Button };
