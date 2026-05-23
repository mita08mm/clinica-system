'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { apiEndpoint } from '@/lib/config';
import { Button, Card, CardContent, Input, Label, Select, Textarea } from '@/components/ui';

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

  // Formulario simplificado
  const [tipoTratamiento, setTipoTratamiento] = useState<'FACIAL' | 'CORPORAL' | 'CAPILAR'>('FACIAL');
  const [zonaTratada, setZonaTratada] = useState('');
  const [evaluacionInicial, setEvaluacionInicial] = useState('');
  const [objetivoSesion, setObjetivoSesion] = useState('');
  const [procedimiento, setProcedimiento] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [proximaSesion, setProximaSesion] = useState('');

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
        evaluacionInicial: evaluacionInicial.trim() || undefined,
        protocolo: procedimiento.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
        proximaSesion: proximaSesion ? new Date(`${proximaSesion}T00:00:00`).toISOString() : undefined,
      };

      const response = await fetch(apiEndpoint('/tratamientos'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Error al crear tratamiento');
      }

      // Redirigir a la historia clínica
      router.push(`/pacientes/${pacienteId}/historia`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar tratamiento');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-lg h-12 w-12 border-b-2 border-morena"></div>
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
    <div className="form-container space-y-4">
      <div className="flex items-center gap-4">
        <Link
          href={`/pacientes/${pacienteId}/historia`}
          className="inline-flex"
        >
          <Button type="button" variant="ghost" size="sm">← Volver</Button>
        </Link>
        <div>
          <h1 className="text-2xl font-heading font-bold text-concreto">Nueva Consulta</h1>
          <p className="text-sm text-marengo">{paciente.nombre} {paciente.apellido}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label required>Tipo de Tratamiento</Label>
                <Select
                  value={tipoTratamiento}
                  onChange={(e) => setTipoTratamiento(e.target.value as 'FACIAL' | 'CORPORAL' | 'CAPILAR')}
                >
                  <option value="FACIAL">Facial</option>
                  <option value="CORPORAL">Corporal</option>
                  <option value="CAPILAR">Capilar</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label required>Zona tratada</Label>
                <Input
                  type="text"
                  value={zonaTratada}
                  onChange={(e) => setZonaTratada(e.target.value)}
                  placeholder="Rostro, abdomen, cuero cabelludo"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label required>Objetivo</Label>
              <Input
                type="text"
                value={objetivoSesion}
                onChange={(e) => setObjetivoSesion(e.target.value)}
                placeholder="Objetivo de la sesión"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Evaluación inicial</Label>
              <Textarea
                value={evaluacionInicial}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEvaluacionInicial(e.target.value)}
                placeholder="Evaluación inicial"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Procedimiento realizado</Label>
              <Textarea
                value={procedimiento}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProcedimiento(e.target.value)}
                placeholder="Procedimiento realizado"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  value={observaciones}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setObservaciones(e.target.value)}
                  placeholder="Observaciones"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Próxima sesión</Label>
                <Input
                  type="date"
                  value={proximaSesion}
                  onChange={(e) => setProximaSesion(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Link href={`/pacientes/${pacienteId}/historia`}>
            <Button type="button" variant="outline" size="md">Cancelar</Button>
          </Link>
          <Button type="submit" variant="primary" size="md" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar Consulta'}
          </Button>
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
