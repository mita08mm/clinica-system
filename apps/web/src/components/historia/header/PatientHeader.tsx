'use client';

import Link from 'next/link';
import { HistoriaClinica } from '@/types/historia';
import { calcularEdad } from '@/lib/utils/paciente';
import { usePacienteSaldo } from '@/hooks/usePacienteSaldo';
import { Badge } from '@/components/ui/badge';

interface PatientHeaderProps {
  historia: HistoriaClinica;
  pacienteId: string;
}

export default function PatientHeader({ historia, pacienteId }: PatientHeaderProps) {
  const paciente = historia.paciente;
  const edad = calcularEdad(paciente.fechaNacimiento);
  const isFemale = paciente.sexo?.toUpperCase() === 'FEMENINO';
  const { saldo, isLoading: loadingSaldo } = usePacienteSaldo(pacienteId);

  const iniciales =
    `${paciente.nombre?.[0] ?? ''}${paciente.apellido?.[0] ?? ''}`.toUpperCase() || 'P';

  return (
    <header className="bg-white border-b border-[var(--neutral-200)]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-5 pb-6">
        <Link
          href="/pacientes"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--neutral-500)] hover:text-[var(--brand-morena)] transition-colors mb-4"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Pacientes
        </Link>

        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-14 w-14 rounded-full bg-[rgba(204,175,125,0.18)] text-[var(--brand-morena)] font-heading text-lg font-medium flex items-center justify-center shrink-0 ring-1 ring-[rgba(117,76,36,0.12)]">
              {iniciales}
            </div>
            <div className="min-w-0">
              <h1 className="font-heading text-2xl font-medium text-[var(--neutral-900)] leading-tight truncate">
                {paciente.nombre} {paciente.apellido}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--neutral-600)]">
                <span>{edad} años</span>
                <span className="text-[var(--neutral-300)]">·</span>
                <span className="capitalize">{(paciente.sexo ?? 'No especificado').toLowerCase()}</span>
                {paciente.documento && (
                  <>
                    <span className="text-[var(--neutral-300)]">·</span>
                    <span>CI {paciente.documento}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <Link
            href={`/pacientes/${pacienteId}/consulta/nueva`}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-[var(--brand-morena)] text-white text-sm font-medium hover:bg-[var(--brand-morena-dark)] transition-colors shrink-0"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nueva consulta
          </Link>
        </div>

        <dl className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 pt-5 border-t border-[var(--neutral-100)]">
          <Stat
            label="Objetivo estético"
            value={paciente.objetivoEstetico || '—'}
          />
          <Stat
            label="Alergias"
            value={paciente.alergias || 'Ninguna'}
            highlight={paciente.alergias ? 'danger' : undefined}
          />
          {isFemale && (
            <Stat
              label="Embarazo / Lactancia"
              value={paciente.embarazoLactancia ? 'Sí' : 'No'}
              highlight={paciente.embarazoLactancia ? 'warning' : undefined}
            />
          )}
          <Stat
            label="Saldo pendiente"
            value={loadingSaldo ? '…' : saldo > 0 ? `Bs. ${saldo.toFixed(2)}` : 'Al día'}
            highlight={!loadingSaldo && saldo > 0 ? 'warning' : undefined}
          />
        </dl>
      </div>
    </header>
  );
}

interface StatProps {
  label: string;
  value: string;
  highlight?: 'warning' | 'danger';
}

function Stat({ label, value, highlight }: StatProps) {
  return (
    <div className="min-w-0">
      <dt className="overline">{label}</dt>
      <dd className="mt-1 text-sm font-medium truncate">
        {highlight ? (
          <Badge variant={highlight} dot>
            {value}
          </Badge>
        ) : (
          <span className="text-[var(--neutral-800)]">{value}</span>
        )}
      </dd>
    </div>
  );
}

