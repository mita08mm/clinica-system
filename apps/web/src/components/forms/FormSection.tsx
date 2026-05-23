import { ReactNode } from 'react';

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white p-6 sm:p-8">
      <div className="mb-6 pb-4 border-b border-[var(--neutral-100)]">
        <h2 className="font-heading text-lg font-medium text-[var(--neutral-900)]">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-[var(--neutral-500)]">{description}</p>
        )}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function FormField({ label, htmlFor, required, hint, error, children }: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-xs font-medium text-[var(--neutral-700)] mb-1.5"
      >
        {label}
        {required && <span className="text-[var(--semantic-danger)] ml-0.5">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-[var(--semantic-danger)]">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-[var(--neutral-500)]">{hint}</p>
      ) : null}
    </div>
  );
}
