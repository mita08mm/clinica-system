'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { apiEndpoint } from '@/lib/config';

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

export default function CitaDetailPage() {
  const params = useParams();
  const { token } = useAuth();
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
    if (!token) return;

    const fetchCita = async () => {
      try {
        const response = await fetch(apiEndpoint(`/citas/${params.id}`), {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Error al cargar cita');
        }

        const data = await response.json();
        setCita(data.data);
        
        setFormData({
          fecha: data.data.fecha.split('T')[0],
          horaInicio: data.data.horaInicio,
          horaFin: data.data.horaFin,
          motivo: data.data.motivo,
          estado: data.data.estado,
          notas: data.data.notas || '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCita();
  }, [params.id, token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      const response = await fetch(apiEndpoint(`/citas/${params.id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al actualizar cita');
      }

      const updatedData = await response.json();
      setCita(updatedData.data);
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
      const response = await fetch(apiEndpoint(`/citas/${params.id}/cancelar`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          notas: 'Cancelada por el usuario',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al cancelar cita');
      }

      const updatedData = await response.json();
      setCita(updatedData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsSaving(false);
    }
  };

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    });
  };

  const getEstadoColor = (estado: string) => {
    const colors: Record<string, string> = {
      PROGRAMADA: 'bg-blue-100 text-blue-800',
      CONFIRMADA: 'bg-green-100 text-green-800',
      EN_CURSO: 'bg-yellow-100 text-yellow-800',
      COMPLETADA: 'bg-gray-100 text-gray-800',
      CANCELADA: 'bg-red-100 text-red-800',
      NO_ASISTIO: 'bg-red-200 text-red-900',
    };
    return colors[estado] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-morena"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (error || !cita) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="max-w-3xl">
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error || 'Cita no encontrada'}</p>
              <Link href="/citas" className="text-morena hover:underline mt-4 inline-block">
                ← Volver a citas
              </Link>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-4xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/citas"
                className="text-marengo hover:text-concreto"
              >
                ← Volver
              </Link>
              <div>
                <h1 className="text-3xl font-heading font-bold text-concreto">
                  Detalle de Cita
                </h1>
                <p className="text-marengo mt-1">
                  {formatFecha(cita.fecha)}
                </p>
              </div>
            </div>
            
            {!isEditMode && cita.estado !== 'CANCELADA' && cita.estado !== 'COMPLETADA' && (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditMode(true)}
                  className="px-6 py-2 bg-morena text-white rounded-lg 
                           hover:bg-morena/90 transition-all"
                >
                  Editar
                </button>
                <button
                  onClick={handleCancelar}
                  disabled={isSaving}
                  className="px-6 py-2 border-2 border-red-500 text-red-500 rounded-lg 
                           hover:bg-red-50 transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar Cita
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Información del paciente */}
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-xl font-heading font-bold text-concreto mb-4">
              Paciente
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-marengo mb-1">Nombre Completo</p>
                <Link 
                  href={`/pacientes/${cita.paciente.id}`}
                  className="text-morena hover:underline font-medium"
                >
                  {cita.paciente.nombre} {cita.paciente.apellido}
                </Link>
              </div>
              <div>
                <p className="text-sm text-marengo mb-1">Documento</p>
                <p className="text-concreto">{cita.paciente.tipoDocumento}: {cita.paciente.documento}</p>
              </div>
              <div>
                <p className="text-sm text-marengo mb-1">Telefono</p>
                <p className="text-concreto">{cita.paciente.telefono}</p>
              </div>
              <div>
                <p className="text-sm text-marengo mb-1">Email</p>
                <p className="text-concreto">{cita.paciente.email || '-'}</p>
              </div>
            </div>
          </div>

          {/* Información de la cita */}
          {isEditMode ? (
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-8 space-y-6">
              <h2 className="text-xl font-heading font-bold text-concreto mb-4">
                Editar Cita
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-concreto">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    name="fecha"
                    value={formData.fecha}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-marengo/30 
                             focus:border-morena focus:ring-2 focus:ring-piel/20 
                             transition-all outline-none"
                    required
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-concreto">
                    Estado *
                  </label>
                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-marengo/30 
                             focus:border-morena focus:ring-2 focus:ring-piel/20 
                             transition-all outline-none"
                    required
                    disabled={isSaving}
                  >
                    <option value="PROGRAMADA">Programada</option>
                    <option value="CONFIRMADA">Confirmada</option>
                    <option value="EN_CURSO">En Curso</option>
                    <option value="COMPLETADA">Completada</option>
                    <option value="NO_ASISTIO">No Asistio</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-concreto">
                    Hora Inicio *
                  </label>
                  <input
                    type="time"
                    name="horaInicio"
                    value={formData.horaInicio}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-marengo/30 
                             focus:border-morena focus:ring-2 focus:ring-piel/20 
                             transition-all outline-none"
                    required
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-concreto">
                    Hora Fin *
                  </label>
                  <input
                    type="time"
                    name="horaFin"
                    value={formData.horaFin}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-marengo/30 
                             focus:border-morena focus:ring-2 focus:ring-piel/20 
                             transition-all outline-none"
                    required
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-concreto">
                  Motivo *
                </label>
                <input
                  type="text"
                  name="motivo"
                  value={formData.motivo}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-marengo/30 
                           focus:border-morena focus:ring-2 focus:ring-piel/20 
                           transition-all outline-none"
                  required
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-concreto">
                  Notas
                </label>
                <textarea
                  name="notas"
                  value={formData.notas}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-marengo/30 
                           focus:border-morena focus:ring-2 focus:ring-piel/20 
                           transition-all outline-none resize-none"
                  disabled={isSaving}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary"
                >
                  {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
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
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-white rounded-xl shadow-md p-8 space-y-6">
              <h2 className="text-xl font-heading font-bold text-concreto mb-4">
                Detalles de la Cita
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-marengo mb-1">Fecha</p>
                  <p className="text-concreto text-lg">{formatFecha(cita.fecha)}</p>
                </div>

                <div>
                  <p className="text-sm text-marengo mb-1">Horario</p>
                  <p className="text-concreto text-lg">{cita.horaInicio} - {cita.horaFin}</p>
                </div>

                <div>
                  <p className="text-sm text-marengo mb-1">Motivo</p>
                  <p className="text-concreto text-lg">{cita.motivo}</p>
                </div>

                <div>
                  <p className="text-sm text-marengo mb-1">Estado</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(cita.estado)}`}>
                    {cita.estado.replace('_', ' ')}
                  </span>
                </div>

                {cita.notas && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-marengo mb-1">Notas</p>
                    <p className="text-concreto">{cita.notas}</p>
                  </div>
                )}

                <div className="md:col-span-2">
                  <p className="text-sm text-marengo mb-1">Creada</p>
                  <p className="text-concreto">
                    {new Date(cita.createdAt).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
