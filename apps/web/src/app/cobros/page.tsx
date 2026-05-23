'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Badge, Spinner } from '@/components/ui';
import { useCobros, type CobroResumen } from '@/hooks/useCobros';
import { useDebounce } from '@/hooks/useDebounce';
import { formatFecha } from '@/lib/utils/date';
import { formatMonto } from '@/lib/utils/money';

type Filtro = 'todos' | 'pendientes' | 'pagados';

export default function CobrosPage() {
  const { cobros, isLoading, error } = useCobros();
  const [query, setQuery] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const debounced = useDebounce(query, 200);

  const cobrosConTotales = useMemo(() => {
    return cobros.map((c) => {
      const abonado = (c.pagos || []).reduce((sum, p) => sum + Number(p.monto), 0);
      const pendiente = Math.max(Number(c.total) - abonado, 0);
      return { ...c, abonado, pendiente };
    });
  }, [cobros]);

  const filtrados = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    return cobrosConTotales.filter((c) => {
      if (filtro === 'pendientes' && c.pendiente <= 0) return false;
      if (filtro === 'pagados' && c.pendiente > 0) return false;
      if (!q) return true;
      const nombre = `${c.paciente.nombre} ${c.paciente.apellido}`.toLowerCase();
      return nombre.includes(q) || c.paciente.documento.toLowerCase().includes(q);
    });
  }, [cobrosConTotales, debounced, filtro]);

  const resumen = useMemo(() => {
    return cobrosConTotales.reduce(
      (acc, c) => ({
        total: acc.total + Number(c.total),
        abonado: acc.abonado + c.abonado,
        pendiente: acc.pendiente + c.pendiente,
      }),
      { total: 0, abonado: 0, pendiente: 0 }
    );
  }, [cobrosConTotales]);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-6xl">
          {/* Header */}
          <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <p className="overline">Finanzas</p>
              <h1 className="font-heading text-2xl font-medium text-[var(--neutral-900)] mt-1">
                Cobros
              </h1>
              <p className="text-sm text-[var(--neutral-500)] mt-0.5">
                Registro de cobros y seguimiento de pagos
              </p>
            </div>
            <Link
              href="/cobros/nuevo"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-[var(--brand-morena)] text-white text-sm font-medium hover:bg-[var(--brand-morena-dark)] transition-colors shadow-[var(--shadow-xs)]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nuevo cobro
            </Link>
          </header>

          {/* KPIs */}
          {!isLoading && cobros.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <KpiCard label="Facturado" value={formatMonto(resumen.total)} />
              <KpiCard label="Cobrado" value={formatMonto(resumen.abonado)} tone="success" />
              <KpiCard label="Pendiente" value={formatMonto(resumen.pendiente)} tone="warning" />
            </div>
          )}

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="relative flex-1 min-w-[220px] max-w-md">
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
                placeholder="Buscar paciente o documento..."
                className="w-full h-10 pl-10 pr-3 rounded-md border border-[var(--neutral-300)] bg-white text-sm text-[var(--neutral-800)] placeholder:text-[var(--neutral-400)] focus:outline-none focus:border-[var(--brand-morena)] focus:ring-[3px] focus:ring-[rgba(117,76,36,0.12)] transition-colors"
              />
            </div>
            <div className="inline-flex rounded-md border border-[var(--neutral-300)] bg-white p-0.5">
              {(['todos', 'pendientes', 'pagados'] as Filtro[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltro(f)}
                  className={`h-8 px-3 rounded text-xs font-medium capitalize transition-colors ${
                    filtro === f
                      ? 'bg-[var(--neutral-100)] text-[var(--neutral-900)]'
                      : 'text-[var(--neutral-600)] hover:text-[var(--neutral-900)]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <span className="text-xs text-[var(--neutral-500)] tabular-nums ml-auto">
              {isLoading ? '—' : `${filtrados.length} ${filtrados.length === 1 ? 'registro' : 'registros'}`}
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
            <EmptyCobros tieneFiltro={debounced.trim().length > 0 || filtro !== 'todos'} />
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden lg:block rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--neutral-200)] bg-[var(--neutral-25)]">
                      {['Fecha', 'Paciente', 'Descripción', 'Total', 'Abonado', 'Pendiente', 'Estado', ''].map((c) => (
                        <th
                          key={c}
                          className={`px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--neutral-500)] ${
                            ['Total', 'Abonado', 'Pendiente'].includes(c) ? 'text-right' : 'text-left'
                          }`}
                        >
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--neutral-100)]">
                    {filtrados.map((c) => (
                      <CobroRow key={c.id} cobro={c} />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile */}
              <div className="lg:hidden space-y-3">
                {filtrados.map((c) => (
                  <CobroCard key={c.id} cobro={c} />
                ))}
              </div>
            </>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

type CobroConTotales = CobroResumen & { abonado: number; pendiente: number };

function CobroRow({ cobro }: { cobro: CobroConTotales }) {
  const pagado = cobro.pendiente <= 0;
  return (
    <tr className="hover:bg-[var(--neutral-25)] transition-colors group">
      <td className="px-4 py-3 text-sm text-[var(--neutral-700)] tabular-nums whitespace-nowrap">
        {formatFecha(cobro.fecha)}
      </td>
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-[var(--neutral-900)]">
          {cobro.paciente.nombre} {cobro.paciente.apellido}
        </p>
        <p className="text-xs text-[var(--neutral-500)]">
          {cobro.paciente.tipoDocumento} {cobro.paciente.documento}
        </p>
      </td>
      <td className="px-4 py-3 text-sm text-[var(--neutral-700)]">
        {buildTitle(cobro)}
      </td>
      <td className="px-4 py-3 text-sm text-[var(--neutral-800)] text-right tabular-nums">
        {formatMonto(Number(cobro.total))}
      </td>
      <td className="px-4 py-3 text-sm text-[var(--neutral-700)] text-right tabular-nums">
        {formatMonto(cobro.abonado)}
      </td>
      <td className={`px-4 py-3 text-sm text-right tabular-nums font-medium ${
        pagado ? 'text-[var(--neutral-400)]' : 'text-[var(--semantic-danger)]'
      }`}>
        {formatMonto(cobro.pendiente)}
      </td>
      <td className="px-4 py-3">
        <Badge variant={pagado ? 'success' : 'warning'} dot>
          {pagado ? 'Pagado' : 'Pendiente'}
        </Badge>
      </td>
      <td className="px-4 py-3 text-right">
        <Link
          href={`/cobros/${cobro.id}`}
          className="inline-flex items-center h-7 px-2.5 rounded-md text-xs font-medium text-[var(--brand-morena)] hover:bg-[rgba(204,175,125,0.18)] transition-colors opacity-0 group-hover:opacity-100"
        >
          Ver
        </Link>
      </td>
    </tr>
  );
}

function CobroCard({ cobro }: { cobro: CobroConTotales }) {
  const pagado = cobro.pendiente <= 0;
  return (
    <Link
      href={`/cobros/${cobro.id}`}
      className="block rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white p-4 hover:border-[var(--neutral-300)] transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--neutral-900)] truncate">
            {cobro.paciente.nombre} {cobro.paciente.apellido}
          </p>
          <p className="text-xs text-[var(--neutral-500)] mt-0.5">
            {formatFecha(cobro.fecha)} · {buildTitle(cobro)}
          </p>
        </div>
        <Badge variant={pagado ? 'success' : 'warning'} dot>
          {pagado ? 'Pagado' : 'Pendiente'}
        </Badge>
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs pt-3 border-t border-[var(--neutral-100)]">
        <Stat label="Total" value={formatMonto(Number(cobro.total))} />
        <Stat label="Abonado" value={formatMonto(cobro.abonado)} />
        <Stat
          label="Pendiente"
          value={formatMonto(cobro.pendiente)}
          tone={pagado ? 'muted' : 'danger'}
        />
      </div>
    </Link>
  );
}

function Stat({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'muted' | 'danger';
}) {
  const color =
    tone === 'danger'
      ? 'text-[var(--semantic-danger)]'
      : tone === 'muted'
      ? 'text-[var(--neutral-400)]'
      : 'text-[var(--neutral-800)]';
  return (
    <div>
      <p className="overline">{label}</p>
      <p className={`mt-0.5 tabular-nums font-medium ${color}`}>{value}</p>
    </div>
  );
}

function KpiCard({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'warning';
}) {
  const accent =
    tone === 'success'
      ? 'text-[var(--semantic-success)]'
      : tone === 'warning'
      ? 'text-[var(--semantic-warning)]'
      : 'text-[var(--neutral-900)]';
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white px-4 py-3">
      <p className="overline">{label}</p>
      <p className={`mt-1 font-heading text-xl tabular-nums ${accent}`}>{value}</p>
    </div>
  );
}

function EmptyCobros({ tieneFiltro }: { tieneFiltro: boolean }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--neutral-300)] bg-white px-6 py-16 text-center">
      <p className="text-sm font-medium text-[var(--neutral-800)]">
        {tieneFiltro ? 'Sin resultados' : 'Sin registros de cobro'}
      </p>
      <p className="mt-1 text-xs text-[var(--neutral-500)]">
        {tieneFiltro
          ? 'Ajusta el filtro o la búsqueda para ver más resultados'
          : 'Crea tu primer registro para comenzar a llevar cuentas'}
      </p>
      {!tieneFiltro && (
        <Link
          href="/cobros/nuevo"
          className="mt-5 inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-[var(--brand-morena)] text-white text-sm font-medium hover:bg-[var(--brand-morena-dark)] transition-colors"
        >
          Crear primer cobro
        </Link>
      )}
    </div>
  );
}

function buildTitle(cobro: CobroResumen): string {
  if (!cobro.items || cobro.items.length === 0) return 'Registro de cobro';
  if (cobro.items.length === 1) return cobro.items[0].nombre;
  return `${cobro.items[0].nombre} +${cobro.items.length - 1}`;
}
