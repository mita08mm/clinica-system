'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { apiEndpoint } from '@/lib/config';
import { SignosVitalesInputs } from '@/components/consulta/SignosVitalesInputs';
interface SignosVitales {
  pa_sistolica?: number;
  pa_diastolica?: number;
  fc?: number;
  temp?: number;
  peso?: number;
  talla?: number;
  imc?: number;
  spo2?: number;
}

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  documento: string;
}

function NuevaConsultaContent() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const pacienteId = params.id as string;

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Datos del formulario
  const [motivoConsulta, setMotivoConsulta] = useState('');
  const [examenFisico, setExamenFisico] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [codigoCIE, setCodigoCIE] = useState('');
  const [tratamiento, setTratamiento] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [proximaConsulta, setProximaConsulta] = useState('');
  const [signosVitales, setSignosVitales] = useState<SignosVitales>({});

  useEffect(() => {
    if (!token) return;

    const fetchPaciente = async () => {
      try {
        const response = await fetch(apiEndpoint(`/pacientes/${pacienteId}`), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Error al cargar paciente');

        const data = await response.json();
        setPaciente(data.data);
      } catch {
        setError('No se pudo cargar la información del paciente');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaciente();
  }, [pacienteId, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!motivoConsulta.trim() || !diagnostico.trim()) {
      setError('El motivo de consulta y el diagnóstico son obligatorios');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const payload = {
        pacienteId,
        motivoConsulta: motivoConsulta.trim(),
        examenFisico: examenFisico.trim() || undefined,
        diagnostico: diagnostico.trim(),
        codigoCIE: codigoCIE.trim() || undefined,
        tratamiento: tratamiento.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
        proximaConsulta: proximaConsulta || undefined,
        signosVitales: Object.keys(signosVitales).length > 0 ? signosVitales : undefined,
      };

      const response = await fetch(apiEndpoint('/consultas'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear consulta');
      }

      // Redirigir a la historia clínica
      router.push(`/pacientes/${pacienteId}/historia`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar consulta');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-morena"></div>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">No se encontró el paciente</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href={`/pacientes/${pacienteId}/historia`}
            className="text-marengo hover:text-concreto"
          >
            ← Volver
          </Link>
          <h1 className="text-3xl font-heading font-bold text-concreto">Nueva Consulta</h1>
        </div>
        <p className="text-marengo">
          Paciente: <span className="font-medium text-concreto">
            {paciente.nombre} {paciente.apellido}
          </span>
        </p>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Motivo de Consulta */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-concreto mb-4">
            Motivo de Consulta <span className="text-red-500">*</span>
          </h2>
          <textarea
            value={motivoConsulta}
            onChange={(e) => setMotivoConsulta(e.target.value)}
            placeholder="Describa el motivo principal de la consulta..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-morena focus:border-transparent"
            required
          />
        </div>

        {/* Signos Vitales */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-concreto mb-4">Signos Vitales</h2>
          <SignosVitalesInputs
            signosVitales={signosVitales}
            onChange={setSignosVitales}
          />
        </div>

        {/* Examen Físico */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-concreto mb-4">Examen Físico</h2>
          <textarea
            value={examenFisico}
            onChange={(e) => setExamenFisico(e.target.value)}
            placeholder="Hallazgos del examen físico..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-morena focus:border-transparent"
          />
        </div>

        {/* Diagnóstico */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-concreto mb-4">
            Diagnóstico <span className="text-red-500">*</span>
          </h2>
          <textarea
            value={diagnostico}
            onChange={(e) => setDiagnostico(e.target.value)}
            placeholder="Diagnóstico clínico..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-morena focus:border-transparent mb-3"
            required
          />
          
          <label className="block text-sm font-medium text-marengo mb-2">
            Código CIE-10 (opcional)
          </label>
          <input
            type="text"
            value={codigoCIE}
            onChange={(e) => setCodigoCIE(e.target.value)}
            placeholder="Ej: J06.9, K21.0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-morena focus:border-transparent"
          />
        </div>

        {/* Tratamiento */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-concreto mb-4">Tratamiento</h2>
          <textarea
            value={tratamiento}
            onChange={(e) => setTratamiento(e.target.value)}
            placeholder="Indicaciones médicas, medicamentos, dosificación..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-morena focus:border-transparent"
          />
        </div>

        {/* Observaciones */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-concreto mb-4">Observaciones</h2>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Notas adicionales, recomendaciones..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-morena focus:border-transparent"
          />
        </div>

        {/* Próxima Consulta */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-concreto mb-4">Próxima Consulta</h2>
          <input
            type="date"
            value={proximaConsulta}
            onChange={(e) => setProximaConsulta(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-morena focus:border-transparent"
          />
        </div>

        {/* Botones de Acción */}
        <div className="flex gap-4 justify-end">
          <Link
            href={`/pacientes/${pacienteId}/historia`}
            className="px-6 py-3 border border-gray-300 text-marengo rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-morena text-white rounded-lg hover:bg-morena/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Guardando...' : 'Guardar Consulta'}
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
