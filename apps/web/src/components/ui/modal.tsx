'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizes: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({ open, onClose, title, description, children, footer, size = 'lg' }: ModalProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(31,31,31,0.35)] p-4 backdrop-blur-[2px] animate-in fade-in"
      onClick={onClose}
    >
      <div
        className={cn(
          'relative w-full max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] border border-[var(--neutral-200)]',
          sizes[size],
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-[var(--neutral-100)]">
          <div className="min-w-0">
            <h3 className="font-heading text-lg font-medium text-[var(--neutral-900)] leading-tight">
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-xs text-[var(--neutral-500)]">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-[var(--neutral-500)] hover:bg-[var(--neutral-100)] hover:text-[var(--neutral-800)] transition-colors"
            aria-label="Cerrar"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <footer className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-[var(--neutral-100)] bg-[var(--neutral-25)]">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
