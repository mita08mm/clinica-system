'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useHistoriaClinica } from '@/hooks/useHistoriaClinica';
import {
  AttachmentsPanel,
  EmptyState,
  PagosHistory,
  PatientHeader,
  ProtocolosPanel,
  TratamientosList,
} from '@/components/historia';
import { Spinner } from '@/components/ui';

function HistoriaContent() {
  const params = useParams();
  const pacienteId = params.id as string;

  const { historia, isLoading, error, refresh } = useHistoriaClinica(pacienteId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !historia) {
    return (
      <div className="max-w-2xl mx-auto mt-12 px-6">
        <div className="rounded-[var(--radius-lg)] border border-[rgba(181,58,58,0.2)] bg-[var(--semantic-danger-bg)] px-5 py-4">
          <p className="text-sm font-medium text-[var(--semantic-danger)]">
            {error || 'Historia clínica no encontrada'}
          </p>
        </div>
      </div>
    );
  }

  const documentos = historia.tratamientos?.flatMap((t) => t.documentos || []) ?? [];
  const tieneTratamientos = (historia.tratamientos?.length ?? 0) > 0;

  return (
    <main className="min-h-screen bg-[var(--neutral-25)]">
      <PatientHeader historia={historia} pacienteId={pacienteId} />

      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-12 lg:py-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <section className="lg:col-span-7 xl:col-span-8">
            {tieneTratamientos ? (
              <TratamientosList tratamientos={historia.tratamientos!} />
            ) : (
              <EmptyState pacienteId={pacienteId} />
            )}
          </section>

          <aside className="lg:col-span-5 xl:col-span-4 space-y-6">
            <ProtocolosPanel pacienteId={pacienteId} />
            <PagosHistory pacienteId={pacienteId} />
            <AttachmentsPanel
              documentos={documentos}
              pacienteId={pacienteId}
              onUploadSuccess={refresh}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function HistoriaClinicaPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <HistoriaContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
