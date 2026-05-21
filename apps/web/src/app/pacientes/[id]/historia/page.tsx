'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useHistoriaClinica } from '@/hooks/useHistoriaClinica';
import PatientHeader from '@/components/historia/PatientHeader';
import ConsultasList from '@/components/historia/ConsultasList';
import PrescriptionsPanel from '@/components/historia/PrescriptionsPanel';
import AttachmentsPanel from '@/components/historia/AttachmentsPanel';
import EmptyState from '@/components/historia/EmptyState';

function HistoriaContent() {
  const params = useParams();
  const pacienteId = params.id as string;
  
  const { historia, isLoading, error, refresh } = useHistoriaClinica(pacienteId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-morena"></div>
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

  const todasRecetas = (historia.consultas ?? []).flatMap((c) => c.recetas || []);
  const todosDocumentos = (historia.consultas ?? []).flatMap((c) => c.documentos || []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-piel/30 via-white to-piel/20">
      <PatientHeader historia={historia} pacienteId={pacienteId} />

      {/* Layout Principal: 2 Columnas */}
      <div className="max-w-[1600px] mx-auto px-8 py-6">
        <div className="grid grid-cols-4 gap-6">
          
          {/* Columna Principal: Lista de Consultas (75%) */}
          <div className="col-span-3">
            {(historia.consultas ?? []).length > 0 ? (
               <ConsultasList consultas={historia.consultas ?? []} />
            ) : (
              <EmptyState pacienteId={pacienteId} />
            )}
          </div>

          {/* Columna Derecha: Prescripciones y Documentos (25%) */}
          <div className="col-span-1 space-y-6">
            <PrescriptionsPanel recetas={todasRecetas} />
            <AttachmentsPanel 
              documentos={todosDocumentos} 
              pacienteId={pacienteId}
              onUploadSuccess={refresh}
            />
          </div>

        </div>
      </div>
    </div>
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
