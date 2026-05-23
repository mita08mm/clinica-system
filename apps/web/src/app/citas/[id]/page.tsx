'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { FormSection, FormField } from '@/components/forms/FormSection';
import { api } from '@/lib/api';

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  documento: string;
  tipoDocumento: string;
  telefono: string;
  email?: string;
  fechaNacimiento: string;
}

interface Cita {
  id: string;
  pacienteId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivo: string;
  estado: string;
  notas?: string;
  createdAt: string;
  paciente: Paciente;
}

const inputBase =
  'w-full h-10 px-3 rounded-md border border-[var(--neutral-300)] bg-white text-sm text-[var(--neutral-800)] focus:outline-none focus:border-[var(--brand-morena)] focus:ring-[3px] focus:ring-[rgba(117,76,36,0.12)] transition-colors disabled:bg-[var(--neutral-50)]';
const textareaBase =
  'w-full px-3 py-2.5 rounded-md border border-[var(--neutral-300)] bg-white text-sm text-[var(--neutral-800)] focus:outline-none focus:border-[var(--brand-morena)] focus:ring-[3px] focus:ring-[rgba(117,76,36,0.12)] transition-colors resize-none disabled:bg-[var(--neutral-50)]';

const estadoStyles: Record<string, { bg: string; color: string; label: string }> = {
  PROGRAMADA: { bg: 'var(--semantic-info-bg)', color: 'var(--semantic-info)', label: 'Programada' },
  CONFIRMADA: { bg: 'var(--semantic-success-bg)', color: 'var(--semantic-success)', label: 'Confirmada' },
  EN_CURSO: { bg: 'var(--semantic-warning-bg)', color: 'var(--semantic-warning)', label: 'En curso' },
  COMPLETADA: { bg: 'var(--neutral-100)', color: 'var(--neutral-700)', label: 'Completada' },
  CANCELADA: { bg: 'var(--semantic-danger-bg)', color: 'var(--semantic-danger)', label: 'Cancelada' },
  NO_ASISTIO: { bg: 'var(--semantic-danger-bg)', color: 'var(--semantic-danger)', label: 'No asistió' },
};

export default function CitaDetailPage() {
  const params = useParams();
  const [cita, setCita] = useState<Cita | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    fecha: '',
    horaInicio: '',
    horaFin: '',
    motivo: '',
    estado: 'PROGRAMADA',
    notas: '',
  });

  useEffect(() => {
    const fetchCita = async () => {
      try {
        const data = await api.get<Cita>(`/citas/${params.id}`);
        setCita(data);
        setFormData({
          fecha: data.fecha.split('T')[0],
          horaInicio: data.horaInicio,
          horaFin: data.horaFin,
          motivo: data.motivo,
          estado: data.estado,
          notas: data.notas || '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCita();
  }, [params.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      const updated = await api.patch<Cita>(`/citas/${params.id}`, formData);
      setCita(updated);
      setIsEditMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelar = async () => {
    if (!confirm('¿Está seguro de cancelar esta cita?')) return;
    setError('');
    setIsSaving(true);
    try {
      const updated = await api.post<Cita>(`/citas/${params.id}/cancelar`, { notas: 'Cancelada por el usuario' });
      setCita(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsSaving(false);
    }
  };

  const formatFecha = (fecha: string) =>
    new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', weekday: 'long' });

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px] text-sm text-[var(--neutral-500)]">
            Cargando cita...
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error || !cita) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="max-w-3xl space-y-3">
            <div className="rounded-md border border-[rgba(181,58,58,0.2)] bg-[var(--semantic-danger-bg)] px-4 py-3 text-sm text-[var(--semantic-danger)]">
              {error || 'Cita no encontrada'}
            </div>
            <Link href="/citas" className="inline-block text-sm text-[var(--brand-morena)] hover:underline">
              ← Volver a citas
            </Link>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const estado = estadoStyles[cita.estado] ?? { bg: 'var(--neutral-100)', color: 'var(--neutral-700)', label: cita.estado };
  const isLocked = cita.estado === 'CANCELADA' || cita.estado === 'COMPLETADA';

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-4xl">
          <PageHeader
            overline="Citas"
            title="Detalle de cita"
            subtitle={formatFecha(cita.fecha)}
            backHref="/citas"
            actions={
              !isEditMode && !isLocked ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditMode(true)}
                    className="inline-flex items-center h-9 px-4 rounded-md bg-[var(--brand-morena)] text-white text-sm font-medium hover:bg-[var(--brand-morena-dark)] transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelar}
                    disabled={isSaving}
                    className="inline-flex items-center h-9 px-4 rounded-md border border-[rgba(181,58,58,0.4)] text-sm font-medium text-[var(--semantic-danger)] hover:bg-[var(--semantic-danger-bg)] transition-colors disabled:opacity-60"
                  >
                    Cancelar cita
                  </button>
                </div>
              ) : null
            }
          />

          {error && (
            <div className="mb-5 rounded-md border border-[rgba(181,58,58,0.2)] bg-[var(--semantic-danger-bg)] px-4 py-3 text-sm text-[var(--semantic-danger)]">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <section className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white p-6">
              <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--neutral-500)] mb-3">Paciente</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <p className="text-xs text-[var(--neutral-500)]">Nombre completo</p>
                  <Link
                    href={`/pacientes/${cita.paciente.id}`}
                    className="mt-0.5 inline-block text-base font-medium text-[var(--brand-morena)] hover:underline"
                  >
                    {cita.paciente.nombre} {cita.paciente.apellido}
                  </Link>
                </div>
                <div>
                  <p className="text-xs text-[var(--neutral-500)]">Documento</p>
                  <p className="mt-0.5 text-base text-[var(--neutral-900)]">{cita.paciente.tipoDocumento}: {cita.paciente.documento}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--neutral-500)]">Teléfono</p>
                  <p className="mt-0.5 text-base text-[var(--neutral-900)]">{cita.paciente.telefono}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--neutral-500)]">Email</p>
                  <p className="mt-0.5 text-base text-[var(--neutral-900)]">{cita.paciente.email || '—'}</p>
                </div>
              </div>
            </section>

            {isEditMode ? (
              <form onSubmit={handleSubmit}>
                <FormSection title="Editar cita">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Fecha" required>
                      <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} className={inputBase} required disabled={isSaving} />
                    </FormField>
                    <FormField label="Estado" required>
                      <select name="estado" value={formData.estado} onChange={handleChange} className={inputBase} required disabled={isSaving}>
                        <option value="PROGRAMADA">Programada</option>
                        <option value="CONFIRMADA">Confirmada</option>
                        <option value="EN_CURSO">En curso</option>
                        <option value="COMPLETADA">Completada</option>
                        <option value="NO_ASISTIO">No asistió</option>
                      </select>
                    </FormField>
                    <FormField label="Hora inicio" required>
                      <input type="time" name="horaInicio" value={formData.horaInicio} onChange={handleChange} className={inputBase} required disabled={isSaving} />
                    </FormField>
                    <FormField label="Hora fin" required>
                      <input type="time" name="horaFin" value={formData.horaFin} onChange={handleChange} className={inputBase} required disabled={isSaving} />
                    </FormField>
                  </div>
                  <FormField label="Motivo" required>
                    <input type="text" name="motivo" value={formData.motivo} onChange={handleChange} className={inputBase} required disabled={isSaving} />
                  </FormField>
                  <FormField label="Notas">
                    <textarea name="notas" value={formData.notas} onChange={handleChange} rows={3} className={textareaBase} disabled={isSaving} />
                  </FormField>
                </FormSection>

                <div className="flex items-center justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditMode(false);
                      setError('');
                      setFormData({
                        fecha: cita.fecha.split('T')[0],
                        horaInicio: cita.horaInicio,
                        horaFin: cita.horaFin,
                        motivo: cita.motivo,
                        estado: cita.estado,
                        notas: cita.notas || '',
                      });
                    }}
                    className="inline-flex items-center h-10 px-4 rounded-md border border-[var(--neutral-300)] bg-white text-sm font-medium text-[var(--neutral-700)] hover:bg-[var(--neutral-50)] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center h-10 px-5 rounded-md bg-[var(--brand-morena)] text-white text-sm font-medium hover:bg-[var(--brand-morena-dark)] transition-colors disabled:opacity-60"
                  >
                    {isSaving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            ) : (
              <section className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white p-6">
                <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--neutral-500)] mb-3">Detalles de la cita</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <p className="text-xs text-[var(--neutral-500)]">Fecha</p>
                    <p className="mt-0.5 text-base text-[var(--neutral-900)]">{formatFecha(cita.fecha)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--neutral-500)]">Horario</p>
                    <p className="mt-0.5 text-base text-[var(--neutral-900)] tabular-nums">{cita.horaInicio} – {cita.horaFin}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--neutral-500)]">Motivo</p>
                    <p className="mt-0.5 text-base text-[var(--neutral-900)]">{cita.motivo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--neutral-500)]">Estado</p>
                    <span
                      className="mt-1 inline-flex items-center h-6 px-2.5 rounded-full text-xs font-medium"
                      style={{ backgroundColor: estado.bg, color: estado.color }}
                    >
                      {estado.label}
                    </span>
                  </div>
                  {cita.notas && (
                    <div className="md:col-span-2">
                      <p className="text-xs text-[var(--neutral-500)]">Notas</p>
                      <p className="mt-0.5 text-sm text-[var(--neutral-700)] whitespace-pre-line">{cita.notas}</p>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <p className="text-xs text-[var(--neutral-500)]">Creada</p>
                    <p className="mt-0.5 text-sm text-[var(--neutral-700)]">
                      {new Date(cita.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
