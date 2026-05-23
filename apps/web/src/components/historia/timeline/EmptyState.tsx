import Link from 'next/link';

interface EmptyStateProps {
  pacienteId: string;
}

export default function EmptyState({ pacienteId }: EmptyStateProps) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-dashed border-[var(--neutral-300)] bg-[var(--neutral-25)] px-6 py-16 text-center">
      <div className="mx-auto h-12 w-12 rounded-full bg-white border border-[var(--neutral-200)] flex items-center justify-center mb-4">
        <svg className="h-5 w-5 text-[var(--neutral-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <h3 className="font-heading text-base font-medium text-[var(--neutral-900)]">
        Sin consultas registradas
      </h3>
      <p className="mt-1 text-sm text-[var(--neutral-500)] max-w-sm mx-auto">
        Cuando registres una consulta aparecerá aquí con su historial completo.
      </p>
      <Link
        href={`/pacientes/${pacienteId}/consulta/nueva`}
        className="mt-5 inline-flex items-center gap-1.5 px-4 h-9 rounded-md bg-[var(--brand-morena)] text-white text-sm font-medium hover:bg-[var(--brand-morena-dark)] transition-colors"
      >
        Registrar primera consulta
      </Link>
    </section>
  );
}
