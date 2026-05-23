'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useHistoriaClinica } from '@/hooks/useHistoriaClinica';
import { AttachmentsPanel, EmptyState, PagosHistory, PatientHeader, ProtocolosPanel, TratamientosList } from '@/components/historia';

function HistoriaContent() {
  const params = useParams();
  const pacienteId = params.id as string;
  
  const { historia, isLoading, error, refresh } = useHistoriaClinica(pacienteId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-lg h-12 w-12 border-b-2 border-morena"></div>
      </div>
    );
  }

  if (error || !historia) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error || 'Historia clínica no encontrada'}</p>
      </div>
    );
  }

  const todosDocumentos = historia.tratamientos?.flatMap((t) => t.documentos || []) || [];

  return (
    <main className="min-h-screen bg-canvas">
      <PatientHeader historia={historia} pacienteId={pacienteId} />

      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <section className="lg:col-span-7">
            {historia.tratamientos && historia.tratamientos.length > 0 ? (
              <TratamientosList tratamientos={historia.tratamientos} />
            ) : (
              <EmptyState pacienteId={pacienteId} />
            )}
          </section>

          <aside className="space-y-8 lg:col-span-5">
            <ProtocolosPanel 
              pacienteId={pacienteId}
            />
            <AttachmentsPanel 
              documentos={todosDocumentos} 
              pacienteId={pacienteId}
              onUploadSuccess={refresh}
            />
            <PagosHistory 
              pacienteId={pacienteId}
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
