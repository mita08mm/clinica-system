'use client';

import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CalendarioCitas from '@/components/CalendarioCitas';
import UpcomingToday from '@/components/UpcomingToday';
import { Spinner } from '@/components/ui';
import { useCitas } from '@/hooks/useCitas';

export default function CitasPage() {
  const { citas, isLoading, error, refresh, removeCita } = useCitas();

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-[1400px]">
          <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <p className="overline">Agenda</p>
              <h1 className="font-heading text-2xl font-medium text-[var(--neutral-900)] mt-1">
                Citas
              </h1>
              <p className="text-sm text-[var(--neutral-500)] mt-0.5">
                Gestión de turnos y agenda médica
              </p>
            </div>
            <Link
              href="/citas/nueva"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-[var(--brand-morena)] text-white text-sm font-medium hover:bg-[var(--brand-morena-dark)] transition-colors shadow-[var(--shadow-xs)]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nueva cita
            </Link>
          </header>

          {error && (
            <div className="mb-4 rounded-md border border-[rgba(181,58,58,0.2)] bg-[var(--semantic-danger-bg)] px-4 py-3 text-sm text-[var(--semantic-danger)]">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-4 items-start">
              <aside className="w-full lg:w-72 lg:flex-shrink-0 order-first lg:order-last">
                <UpcomingToday
                  citas={citas}
                  onCitaEliminada={removeCita}
                  onCitaActualizada={refresh}
                />
              </aside>
              <div className="flex-1 min-w-0">
                <CalendarioCitas citas={citas} />
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
