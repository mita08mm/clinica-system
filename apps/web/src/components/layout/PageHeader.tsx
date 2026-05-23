import Link from 'next/link';
import { ReactNode } from 'react';

interface PageHeaderProps {
  overline?: string;
  title: string;
  subtitle?: string;
  backHref?: string;
  actions?: ReactNode;
}

export function PageHeader({ overline, title, subtitle, backHref, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div className="flex items-start gap-3 min-w-0">
        {backHref && (
          <Link
            href={backHref}
            className="mt-1.5 h-9 w-9 inline-flex items-center justify-center rounded-md text-[var(--neutral-500)] hover:bg-[var(--neutral-100)] hover:text-[var(--neutral-900)] transition-colors"
            aria-label="Volver"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        )}
        <div className="min-w-0">
          {overline && <p className="overline">{overline}</p>}
          <h1 className="font-heading text-2xl font-medium text-[var(--neutral-900)] mt-1">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-[var(--neutral-500)] mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
