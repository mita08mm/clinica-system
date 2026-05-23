import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-12">
      {icon ? (
        <div className="mb-4 text-[var(--neutral-300)]">{icon}</div>
      ) : (
        <div className="mb-4 h-10 w-10 rounded-full bg-[var(--neutral-100)] flex items-center justify-center">
          <span className="h-2 w-2 rounded-full bg-[var(--neutral-400)]" />
        </div>
      )}
      <p className="text-sm font-medium text-[var(--neutral-800)]">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-[var(--neutral-500)] max-w-xs">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
