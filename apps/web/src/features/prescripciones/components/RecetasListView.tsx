'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Spinner,
  alertError,
  DataTable,
  EmptyState,
  SearchInput,
  PlusIcon,
  type Column,
  Subtitle,
  Overline,
  LinkButton,
} from '@/shared/ui';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { formatFecha } from '@/shared/utils/date';
import { usePrescripciones, type Prescripcion } from '../hooks/usePrescripciones';

export function RecetasListView() {
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
    <div className="max-w-6xl">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Overline>Tratamientos</Overline>
          <h1 className="title-page mt-1">Prescripciones</h1>
          <Subtitle className="mt-0.5">Listado general de prescripciones registradas</Subtitle>
        </div>
        <LinkButton
          href="/prescripciones/nuevo"
          variant="primary"
          size="sm"
          className="h-10 gap-2 px-4 shadow-xs"
        >
          <PlusIcon className="h-4 w-4" />
          Nueva prescripción
        </LinkButton>
      </header>

      <div className="mb-5 flex items-center gap-3">
        <SearchInput
          containerClassName="flex-1 max-w-md"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por paciente o prescripción..."
        />
        <span className="muted ml-auto tabular-nums">
          {isLoading
            ? '—'
            : `${filtradas.length} ${filtradas.length === 1 ? 'prescripción' : 'prescripciones'}`}
        </span>
      </div>

      {error && <div className={`mb-4 ${alertError}`}>{error}</div>}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : filtradas.length === 0 ? (
        <div className="surface-dashed">
          <EmptyState
            title={debounced.trim() ? 'Sin resultados' : 'Sin prescripciones registradas'}
            description={
              debounced.trim()
                ? 'Ajusta la búsqueda para ver más resultados'
                : 'Crea la primera prescripción para comenzar'
            }
            action={
              !debounced.trim() ? (
                <LinkButton href="/prescripciones/nuevo" variant="primary" size="sm">
                  Crear primera prescripción
                </LinkButton>
              ) : undefined
            }
          />
        </div>
      ) : (
        <>
          <DataTable<Prescripcion>
            desktopOnly
            columns={cols}
            rows={filtradas}
            getKey={(p) => p.id}
          />
          <div className="space-y-3 lg:hidden">
            {filtradas.map((p) => (
              <CardItem key={p.id} prescripcion={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const cols: Column<Prescripcion>[] = [
  {
    key: 'fecha',
    label: 'Fecha',
    render: (p) => (
      <span className="whitespace-nowrap text-neutral-700 tabular-nums">
        {formatFecha(p.fecha)}
      </span>
    ),
  },
  {
    key: 'paciente',
    label: 'Paciente',
    render: (p) => (
      <span className="font-medium text-neutral-900">
        {p.paciente.nombre} {p.paciente.apellido}
      </span>
    ),
  },
  {
    key: 'prescripcion',
    label: 'Prescripción',
    render: (p) => (
      <div>
        <p className="font-medium text-neutral-800">{p.nombre}</p>
        <p className="muted mt-0.5">
          {p.items.length} item{p.items.length === 1 ? '' : 's'}
        </p>
      </div>
    ),
  },
  {
    key: 'indicaciones',
    label: 'Indicaciones',
    render: (p) => {
      const ind = p.items
        .map((i) => i.indicaciones)
        .filter(Boolean)
        .join(' · ');
      return (
        <span className="inline-block max-w-md truncate text-neutral-600">
          {ind || <span className="text-neutral-400 italic">Sin indicaciones</span>}
        </span>
      );
    },
  },
  {
    key: 'acciones',
    label: '',
    align: 'right',
    render: (p) => (
      <Link
        href={`/prescripciones/${p.id}`}
        className="text-brand-morena inline-flex h-7 items-center rounded-md px-2.5 text-xs font-medium opacity-0 transition-colors group-hover:opacity-100 hover:bg-[rgba(204,175,125,0.18)]"
      >
        Ver
      </Link>
    ),
  },
];

function CardItem({ prescripcion }: { prescripcion: Prescripcion }) {
  return (
    <Link
      href={`/prescripciones/${prescripcion.id}`}
      className="surface block p-4 transition-colors hover:border-neutral-300"
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="body-strong truncate text-neutral-900">{prescripcion.nombre}</p>
          <p className="muted mt-0.5">
            {prescripcion.paciente.nombre} {prescripcion.paciente.apellido} ·{' '}
            {formatFecha(prescripcion.fecha)}
          </p>
        </div>
      </div>
      <p className="border-t border-neutral-100 pt-2 text-xs text-neutral-600">
        {prescripcion.items.length} item{prescripcion.items.length === 1 ? '' : 's'}
      </p>
    </Link>
  );
}
