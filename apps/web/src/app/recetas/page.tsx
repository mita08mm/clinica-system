'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Spinner } from '@/components/ui';
import { usePrescripciones, type Prescripcion } from '@/hooks/usePrescripciones';
import { useDebounce } from '@/hooks/useDebounce';
import { formatFecha } from '@/lib/utils/date';

export default function RecetasPage() {
  const { prescripciones, isLoading, error } = usePrescripciones();
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 200);

  const filtradas = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return prescripciones;
    return prescripciones.filter((p) => {
      const nombre = `${p.paciente.nombre} ${p.paciente.apellido}`.toLowerCase();
      return nombre.includes(q) || p.nombre.toLowerCase().includes(q);
    });
  }, [prescripciones, debounced]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-6xl">
          <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <p className="overline">Tratamientos</p>
              <h1 className="font-heading text-2xl font-medium text-[var(--neutral-900)] mt-1">
                Prescripciones
              </h1>
              <p className="text-sm text-[var(--neutral-500)] mt-0.5">
                Listado general de prescripciones registradas
              </p>
            </div>
            <Link
              href="/recetas/nuevo"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-[var(--brand-morena)] text-white text-sm font-medium hover:bg-[var(--brand-morena-dark)] transition-colors shadow-[var(--shadow-xs)]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nueva prescripción
            </Link>
          </header>

          <div className="flex items-center gap-3 mb-5">
            <div className="relative flex-1 max-w-md">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--neutral-400)] pointer-events-none"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por paciente o prescripción..."
                className="w-full h-10 pl-10 pr-3 rounded-md border border-[var(--neutral-300)] bg-white text-sm text-[var(--neutral-800)] placeholder:text-[var(--neutral-400)] focus:outline-none focus:border-[var(--brand-morena)] focus:ring-[3px] focus:ring-[rgba(117,76,36,0.12)] transition-colors"
              />
            </div>
            <span className="text-xs text-[var(--neutral-500)] tabular-nums ml-auto">
              {isLoading ? '—' : `${filtradas.length} ${filtradas.length === 1 ? 'prescripción' : 'prescripciones'}`}
            </span>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-[rgba(181,58,58,0.2)] bg-[var(--semantic-danger-bg)] px-4 py-3 text-sm text-[var(--semantic-danger)]">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : filtradas.length === 0 ? (
            <EmptyRecetas tieneBusqueda={debounced.trim().length > 0} />
          ) : (
            <>
              <div className="hidden lg:block rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--neutral-200)] bg-[var(--neutral-25)]">
                      {['Fecha', 'Paciente', 'Prescripción', 'Indicaciones', ''].map((c) => (
                        <th
                          key={c}
                          className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--neutral-500)]"
                        >
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--neutral-100)]">
                    {filtradas.map((p) => (
                      <PrescripcionRow key={p.id} prescripcion={p} />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden space-y-3">
                {filtradas.map((p) => (
                  <PrescripcionCard key={p.id} prescripcion={p} />
                ))}
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function PrescripcionRow({ prescripcion }: { prescripcion: Prescripcion }) {
  const indicaciones = prescripcion.items
    .map((i) => i.indicaciones)
    .filter(Boolean)
    .join(' · ');
  return (
    <tr className="hover:bg-[var(--neutral-25)] transition-colors group">
      <td className="px-5 py-3 text-sm text-[var(--neutral-700)] tabular-nums whitespace-nowrap">
        {formatFecha(prescripcion.fecha)}
      </td>
      <td className="px-5 py-3 text-sm font-medium text-[var(--neutral-900)]">
        {prescripcion.paciente.nombre} {prescripcion.paciente.apellido}
      </td>
      <td className="px-5 py-3">
        <p className="text-sm font-medium text-[var(--neutral-800)]">{prescripcion.nombre}</p>
        <p className="text-xs text-[var(--neutral-500)] mt-0.5">
          {prescripcion.items.length} item{prescripcion.items.length === 1 ? '' : 's'}
        </p>
      </td>
      <td className="px-5 py-3 text-sm text-[var(--neutral-600)] max-w-md truncate">
        {indicaciones || <span className="italic text-[var(--neutral-400)]">Sin indicaciones</span>}
      </td>
      <td className="px-5 py-3 text-right">
        <Link
          href={`/recetas/${prescripcion.id}`}
          className="inline-flex items-center h-7 px-2.5 rounded-md text-xs font-medium text-[var(--brand-morena)] hover:bg-[rgba(204,175,125,0.18)] transition-colors opacity-0 group-hover:opacity-100"
        >
          Ver
        </Link>
      </td>
    </tr>
  );
}

function PrescripcionCard({ prescripcion }: { prescripcion: Prescripcion }) {
  return (
    <Link
      href={`/recetas/${prescripcion.id}`}
      className="block rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white p-4 hover:border-[var(--neutral-300)] transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--neutral-900)] truncate">
            {prescripcion.nombre}
          </p>
          <p className="text-xs text-[var(--neutral-500)] mt-0.5">
            {prescripcion.paciente.nombre} {prescripcion.paciente.apellido} ·{' '}
            {formatFecha(prescripcion.fecha)}
          </p>
        </div>
      </div>
      <p className="text-xs text-[var(--neutral-600)] pt-2 border-t border-[var(--neutral-100)]">
        {prescripcion.items.length} item{prescripcion.items.length === 1 ? '' : 's'}
      </p>
    </Link>
  );
}

function EmptyRecetas({ tieneBusqueda }: { tieneBusqueda: boolean }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--neutral-300)] bg-white px-6 py-16 text-center">
      <p className="text-sm font-medium text-[var(--neutral-800)]">
        {tieneBusqueda ? 'Sin resultados' : 'Sin prescripciones registradas'}
      </p>
      <p className="mt-1 text-xs text-[var(--neutral-500)]">
        {tieneBusqueda
          ? 'Ajusta la búsqueda para ver más resultados'
          : 'Crea la primera prescripción para comenzar'}
      </p>
      {!tieneBusqueda && (
        <Link
          href="/recetas/nuevo"
          className="mt-5 inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-[var(--brand-morena)] text-white text-sm font-medium hover:bg-[var(--brand-morena-dark)] transition-colors"
        >
          Crear primera prescripción
        </Link>
      )}
    </div>
  );
}
