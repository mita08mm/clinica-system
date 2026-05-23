import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        className={cn(
          // Base styles
          'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          'uppercase tracking-wide',
          
          // Variants
          {
            'btn-primary focus-visible:ring-[rgba(117,76,36,0.28)]': variant === 'primary',
            'bg-piel-soft text-concreto hover:bg-[rgba(204,175,125,0.2)] focus-visible:ring-[rgba(204,175,125,0.35)]': variant === 'secondary',
            'border border-sand bg-surface text-concreto hover:bg-surface-muted focus-visible:ring-[rgba(117,76,36,0.18)]': variant === 'outline',
            'text-marengo hover:bg-surface-muted focus-visible:ring-[rgba(117,76,36,0.12)]': variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600': variant === 'danger',
          },
          
          // Sizes - con border-radius consistente
          {
            'px-3 py-1.5 text-xs rounded-lg': size === 'sm',
            'px-5 py-2.5 text-sm rounded-lg': size === 'md',
            'px-6 py-3 text-base rounded-lg': size === 'lg',
          },
          
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
