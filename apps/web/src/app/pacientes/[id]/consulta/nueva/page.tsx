'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { FormSection, FormField } from '@/components/forms/FormSection';
import { api } from '@/lib/api/client';

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  documento: string;
}

const inputBase =
  'w-full h-10 px-3 rounded-md border border-[var(--neutral-300)] bg-white text-sm text-[var(--neutral-800)] placeholder:text-[var(--neutral-400)] focus:outline-none focus:border-[var(--brand-morena)] focus:ring-[3px] focus:ring-[rgba(117,76,36,0.12)] transition-colors disabled:bg-[var(--neutral-50)]';
const textareaBase =
  'w-full px-3 py-2.5 rounded-md border border-[var(--neutral-300)] bg-white text-sm text-[var(--neutral-800)] placeholder:text-[var(--neutral-400)] focus:outline-none focus:border-[var(--brand-morena)] focus:ring-[3px] focus:ring-[rgba(117,76,36,0.12)] transition-colors resize-none disabled:bg-[var(--neutral-50)]';

function NuevaConsultaContent() {
  const params = useParams();
  const router = useRouter();
  const pacienteId = params.id as string;

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [tipoTratamiento, setTipoTratamiento] = useState<'FACIAL' | 'CORPORAL' | 'CAPILAR'>('FACIAL');
  const [zonaTratada, setZonaTratada] = useState('');
  const [evaluacion, setEvaluacion] = useState('');
  const [objetivoSesion, setObjetivoSesion] = useState('');
  const [procedimiento, setProcedimiento] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [proximaConsulta, setProximaConsulta] = useState('');

  useEffect(() => {
    const fetchPaciente = async () => {
      try {
        const data = await api.get<Paciente>(`/pacientes/${pacienteId}`);
        setPaciente(data);
      } catch {
        setError('No se pudo cargar la información del paciente');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPaciente();
  }, [pacienteId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zonaTratada.trim() || !objetivoSesion.trim()) {
      setError('La zona tratada y el objetivo son obligatorios');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const payload = {
        pacienteId,
        tipoTratamiento,
        nombreTratamiento: procedimiento.trim() || `Consulta ${tipoTratamiento.toLowerCase()}`,
        zonaTratada: zonaTratada.trim(),
        objetivo: objetivoSesion.trim(),
        evaluacionInicial: evaluacion.trim() || undefined,
        protocolo: procedimiento.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
        proximaSesion: proximaConsulta ? new Date(`${proximaConsulta}T00:00:00`).toISOString() : undefined,
      };
      await api.post('/tratamientos', payload);
      router.push(`/pacientes/${pacienteId}/historia`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar tratamiento');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-sm text-[var(--neutral-500)]">
        Cargando paciente...
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="rounded-md border border-[rgba(181,58,58,0.2)] bg-[var(--semantic-danger-bg)] px-4 py-3 text-sm text-[var(--semantic-danger)]">
        No se encontró el paciente
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        overline="Historia clínica"
        title="Nueva consulta"
        subtitle={`${paciente.nombre} ${paciente.apellido}`}
        backHref={`/pacientes/${pacienteId}/historia`}
      />

      {error && (
        <div className="mb-5 rounded-md border border-[rgba(181,58,58,0.2)] bg-[var(--semantic-danger-bg)] px-4 py-3 text-sm text-[var(--semantic-danger)]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <FormSection title="Datos de la sesión">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Tipo de tratamiento" required>
              <select
                value={tipoTratamiento}
                onChange={(e) => setTipoTratamiento(e.target.value as 'FACIAL' | 'CORPORAL' | 'CAPILAR')}
                className={inputBase}
                disabled={isSaving}
              >
                <option value="FACIAL">Facial</option>
                <option value="CORPORAL">Corporal</option>
                <option value="CAPILAR">Capilar</option>
              </select>
            </FormField>
            <FormField label="Zona tratada" required>
              <input
                type="text"
                value={zonaTratada}
                onChange={(e) => setZonaTratada(e.target.value)}
                placeholder="Rostro, abdomen, cuero cabelludo..."
                className={inputBase}
                required
                disabled={isSaving}
              />
            </FormField>
          </div>

          <FormField label="Objetivo" required>
            <input
              type="text"
              value={objetivoSesion}
              onChange={(e) => setObjetivoSesion(e.target.value)}
              placeholder="Objetivo de la sesión"
              className={inputBase}
              required
              disabled={isSaving}
            />
          </FormField>
        </FormSection>

        <FormSection title="Detalles clínicos">
          <FormField label="Nota clínica / evaluación">
            <textarea
              value={evaluacion}
              onChange={(e) => setEvaluacion(e.target.value)}
              rows={3}
              className={textareaBase}
              disabled={isSaving}
            />
          </FormField>
          <FormField label="Procedimiento">
            <textarea
              value={procedimiento}
              onChange={(e) => setProcedimiento(e.target.value)}
              rows={3}
              className={textareaBase}
              disabled={isSaving}
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Observaciones">
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={2}
                className={textareaBase}
                disabled={isSaving}
              />
            </FormField>
            <FormField label="Próxima consulta">
              <input
                type="date"
                value={proximaConsulta}
                onChange={(e) => setProximaConsulta(e.target.value)}
                className={inputBase}
                disabled={isSaving}
              />
            </FormField>
          </div>
        </FormSection>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href={`/pacientes/${pacienteId}/historia`}
            className="inline-flex items-center h-10 px-4 rounded-md border border-[var(--neutral-300)] bg-white text-sm font-medium text-[var(--neutral-700)] hover:bg-[var(--neutral-50)] transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center h-10 px-5 rounded-md bg-[var(--brand-morena)] text-white text-sm font-medium hover:bg-[var(--brand-morena-dark)] transition-colors disabled:opacity-60"
          >
            {isSaving ? 'Guardando...' : 'Guardar consulta'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NuevaConsultaPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <NuevaConsultaContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
