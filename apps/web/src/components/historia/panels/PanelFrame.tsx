import { ReactNode } from 'react';

interface PanelFrameProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  contentClassName?: string;
}

export default function PanelFrame({
  title,
  description,
  action,
  children,
  contentClassName,
}: PanelFrameProps) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white overflow-hidden">
      <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-3 border-b border-[var(--neutral-100)]">
        <div className="min-w-0">
          <h2 className="font-heading text-base font-medium text-[var(--neutral-900)] leading-tight">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-[11px] text-[var(--neutral-500)]">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className={contentClassName ?? 'px-5 py-4'}>{children}</div>
    </section>
  );
}

interface PanelActionButtonProps {
  onClick: () => void;
  title?: string;
  children: ReactNode;
}

export function PanelActionButton({ onClick, title, children }: PanelActionButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="inline-flex items-center justify-center h-8 w-8 rounded-md text-[var(--neutral-500)] hover:bg-[var(--neutral-100)] hover:text-[var(--brand-morena)] transition-colors"
    >
      {children}
    </button>
  );
}
