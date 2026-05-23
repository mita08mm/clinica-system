import { Tratamiento } from "@/types/historia";

interface TratamientosListProps {
  tratamientos: Tratamiento[];
}

export default function TratamientosList({ tratamientos }: TratamientosListProps) {
  return (
    <section>
      <header className="mb-5 flex items-baseline justify-between">
        <h2 className="font-heading text-xl font-medium text-[var(--neutral-900)]">
          Historial clínico
        </h2>
        <span className="overline">{tratamientos.length} {tratamientos.length === 1 ? 'consulta' : 'consultas'}</span>
      </header>

      <ol className="relative space-y-5 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-[var(--neutral-200)]">
        {tratamientos.map((t) => (
          <li key={t.id} className="relative pl-7">
            <span className="absolute left-0 top-3.5 h-[15px] w-[15px] rounded-full border-[3px] border-white bg-[var(--brand-morena)] shadow-[var(--shadow-xs)]" />
            <article className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white overflow-hidden hover:border-[var(--neutral-300)] transition-colors">
              <header className="flex items-baseline justify-between gap-4 px-5 py-3 border-b border-[var(--neutral-100)] bg-[var(--neutral-25)]">
                <h3 className="font-heading text-base font-medium text-[var(--neutral-900)] truncate">
                  {t.nombreTratamiento}
                </h3>
                <time className="shrink-0 text-[11px] uppercase tracking-wider text-[var(--neutral-500)] font-medium">
                  {formatDate(t.fecha)}
                </time>
              </header>
              <div className="px-5 py-4 grid gap-3 sm:grid-cols-2">
                <Field label="Tipo" value={formatTipo(t.tipoTratamiento)} />
                <Field label="Zona tratada" value={t.zonaTratada} />
                <Field label="Objetivo" value={t.objetivo} wide />
                <Field label="Nota clínica" value={t.evaluacionInicial} wide />
                <Field label="Procedimiento" value={t.protocolo} wide />
                <Field label="Observaciones" value={t.observaciones} wide />
                <Field label="Próxima consulta" value={formatOptionalDate(t.proximaSesion)} />
              </div>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Field({ label, value, wide }: { label: string; value?: string; wide?: boolean }) {
  if (!value) return null;
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <p className="overline">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-[var(--neutral-800)]">{value}</p>
    </div>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTipo(tipo: Tratamiento['tipoTratamiento']) {
  const labels: Record<Tratamiento['tipoTratamiento'], string> = {
    FACIAL: 'Facial',
    CORPORAL: 'Corporal',
    CAPILAR: 'Capilar',
    COMBINADO: 'Combinado',
  };
  return labels[tipo];
}

function formatOptionalDate(date?: string) {
  if (!date) return undefined;
  return new Date(date).toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
