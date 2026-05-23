'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Badge, Spinner } from '@/components/ui';
import { usePacientes, type Paciente } from '@/hooks/usePacientes';
import { useDebounce } from '@/hooks/useDebounce';
import { calcularEdad } from '@/lib/utils/paciente';

export default function PacientesPage() {
  const { pacientes, isLoading, error } = usePacientes();
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 200);

  const filtrados = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    if (!q) return pacientes;
    return pacientes.filter((p) => {
      const completo = `${p.nombre} ${p.apellido}`.toLowerCase();
      return (
        completo.includes(q) ||
        p.documento.toLowerCase().includes(q) ||
        p.telefono?.includes(q) ||
        (p.email?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [pacientes, debounced]);

  const tieneBusqueda = debounced.trim().length > 0;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-6xl">
          {/* Header */}
          <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <p className="overline">Directorio</p>
              <h1 className="font-heading text-2xl font-medium text-[var(--neutral-900)] mt-1">
                Pacientes
              </h1>
              <p className="text-sm text-[var(--neutral-500)] mt-0.5">
                Gestión de pacientes y fichas clínicas
              </p>
            </div>
            <Link
              href="/pacientes/nuevo"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-[var(--brand-morena)] text-white text-sm font-medium hover:bg-[var(--brand-morena-dark)] transition-colors shadow-[var(--shadow-xs)]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nuevo paciente
            </Link>
          </header>

          {/* Toolbar */}
          <div className="flex items-center gap-3 mb-5">
            <div className="relative flex-1 max-w-md">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--neutral-400)] pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre, documento o teléfono..."
                className="w-full h-10 pl-10 pr-9 rounded-md border border-[var(--neutral-300)] bg-white text-sm text-[var(--neutral-800)] placeholder:text-[var(--neutral-400)] focus:outline-none focus:border-[var(--brand-morena)] focus:ring-[3px] focus:ring-[rgba(117,76,36,0.12)] transition-colors"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded text-[var(--neutral-400)] hover:text-[var(--neutral-700)]"
                  aria-label="Limpiar"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <span className="text-xs text-[var(--neutral-500)] tabular-nums">
              {isLoading ? '—' : `${filtrados.length} ${filtrados.length === 1 ? 'paciente' : 'pacientes'}`}
            </span>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-[rgba(181,58,58,0.2)] bg-[var(--semantic-danger-bg)] px-4 py-3 text-sm text-[var(--semantic-danger)]">
              {error}
            </div>
          )}

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : filtrados.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--neutral-300)] bg-white px-6 py-16 text-center">
              <p className="text-sm font-medium text-[var(--neutral-800)]">
                {tieneBusqueda ? 'Sin resultados' : 'Sin pacientes registrados'}
              </p>
              <p className="mt-1 text-xs text-[var(--neutral-500)]">
                {tieneBusqueda ? (
                  <>No hay coincidencias para “{debounced}”</>
                ) : (
                  'Comienza creando el primer paciente'
                )}
              </p>
              {!tieneBusqueda && (
                <Link
                  href="/pacientes/nuevo"
                  className="mt-5 inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-[var(--brand-morena)] text-white text-sm font-medium hover:bg-[var(--brand-morena-dark)] transition-colors"
                >
                  Crear primer paciente
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden lg:block rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--neutral-200)] bg-[var(--neutral-25)]">
                      {['Paciente', 'Documento', 'Edad', 'Teléfono', 'Estado', ''].map((col) => (
                        <th
                          key={col}
                          className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--neutral-500)]"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--neutral-100)]">
                    {filtrados.map((p) => (
                      <PacienteRow key={p.id} paciente={p} />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="lg:hidden space-y-3">
                {filtrados.map((p) => (
                  <PacienteCard key={p.id} paciente={p} />
                ))}
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function PacienteRow({ paciente }: { paciente: Paciente }) {
  return (
    <tr className="hover:bg-[var(--neutral-25)] transition-colors group">
      <td className="px-5 py-3">
        <Link href={`/pacientes/${paciente.id}/historia`} className="flex items-center gap-3 min-w-0">
          <Avatar nombre={paciente.nombre} apellido={paciente.apellido} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--neutral-900)] truncate group-hover:text-[var(--brand-morena)] transition-colors">
              {paciente.nombre} {paciente.apellido}
            </p>
            {paciente.email && (
              <p className="text-xs text-[var(--neutral-500)] truncate">{paciente.email}</p>
            )}
          </div>
        </Link>
      </td>
      <td className="px-5 py-3">
        <p className="text-xs uppercase tracking-wide text-[var(--neutral-500)]">{paciente.tipoDocumento}</p>
        <p className="text-sm text-[var(--neutral-800)] tabular-nums">{paciente.documento}</p>
      </td>
      <td className="px-5 py-3 text-sm text-[var(--neutral-800)] tabular-nums">
        {calcularEdad(paciente.fechaNacimiento)} <span className="text-[var(--neutral-500)]">años</span>
      </td>
      <td className="px-5 py-3 text-sm text-[var(--neutral-700)]">{paciente.telefono || '—'}</td>
      <td className="px-5 py-3">
        <EstadoBadge estado={paciente.estado} />
      </td>
      <td className="px-5 py-3 text-right">
        <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionLink href={`/pacientes/${paciente.id}/historia`} label="Historia" />
          <ActionLink href={`/pacientes/${paciente.id}`} label="Editar" subtle />
        </div>
      </td>
    </tr>
  );
}

function PacienteCard({ paciente }: { paciente: Paciente }) {
  return (
    <Link
      href={`/pacientes/${paciente.id}/historia`}
      className="block rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white p-4 hover:border-[var(--neutral-300)] transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar nombre={paciente.nombre} apellido={paciente.apellido} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--neutral-900)] truncate">
              {paciente.nombre} {paciente.apellido}
            </p>
            <p className="text-xs text-[var(--neutral-500)] truncate">
              {paciente.tipoDocumento} {paciente.documento}
            </p>
          </div>
        </div>
        <EstadoBadge estado={paciente.estado} />
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="overline">Edad</p>
          <p className="mt-0.5 text-[var(--neutral-800)] tabular-nums">
            {calcularEdad(paciente.fechaNacimiento)} años
          </p>
        </div>
        <div>
          <p className="overline">Teléfono</p>
          <p className="mt-0.5 text-[var(--neutral-800)]">{paciente.telefono || '—'}</p>
        </div>
      </div>
    </Link>
  );
}

function Avatar({ nombre, apellido }: { nombre: string; apellido: string }) {
  const initials = `${nombre[0] ?? ''}${apellido[0] ?? ''}`.toUpperCase();
  return (
    <div className="h-9 w-9 rounded-full bg-[rgba(204,175,125,0.22)] text-[var(--brand-morena)] text-xs font-semibold flex items-center justify-center shrink-0">
      {initials}
    </div>
  );
}

function EstadoBadge({ estado }: { estado: string }) {
  const activo = estado === 'ACTIVO';
  return (
    <Badge variant={activo ? 'success' : 'default'} dot>
      {activo ? 'Activo' : estado}
    </Badge>
  );
}

function ActionLink({ href, label, subtle }: { href: string; label: string; subtle?: boolean }) {
  return (
    <Link
      href={href}
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center h-7 px-2.5 rounded-md text-xs font-medium transition-colors ${
        subtle
          ? 'text-[var(--neutral-600)] hover:bg-[var(--neutral-100)] hover:text-[var(--neutral-900)]'
          : 'text-[var(--brand-morena)] hover:bg-[rgba(204,175,125,0.18)]'
      }`}
    >
      {label}
    </Link>
  );
}
