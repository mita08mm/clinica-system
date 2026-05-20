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
  direccion?: string;
  estado: string;
  fechaNacimiento: string;
  createdAt: string;
}

export default function PacienteDetailPage() {
  const params = useParams();
  const { token } = useAuth();
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    documento: '',
    tipoDocumento: 'DNI',
    fechaNacimiento: '',
    telefono: '',
    email: '',
    direccion: '',
  });

  useEffect(() => {
    if (!token) return;

    const fetchPaciente = async () => {
      try {
        const response = await fetch(apiEndpoint(`/pacientes/${params.id}`), {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Error al cargar paciente');
        }

        const data = await response.json();
        setPaciente(data.data);
        
        // Inicializar el formulario con los datos del paciente
        setFormData({
          nombre: data.data.nombre,
          apellido: data.data.apellido,
          documento: data.data.documento,
          tipoDocumento: data.data.tipoDocumento,
          fechaNacimiento: data.data.fechaNacimiento.split('T')[0],
          telefono: data.data.telefono,
          email: data.data.email || '',
          direccion: data.data.direccion || '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaciente();
  }, [params.id, token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      const response = await fetch(apiEndpoint(`/pacientes/${params.id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al actualizar paciente');
      }

      const updatedData = await response.json();
      setPaciente(updatedData.data);
      setIsEditMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsSaving(false);
    }
  };

  const calcularEdad = (fechaNacimiento: string): number => {
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
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

  if (error || !paciente) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="max-w-3xl">
            <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error || 'Paciente no encontrado'}</p>
              <Link href="/pacientes" className="text-morena hover:underline mt-4 inline-block">
                ← Volver a pacientes
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
                href="/pacientes"
                className="text-marengo hover:text-concreto"
              >
                ← Volver
              </Link>
              <div>
                <h1 className="text-3xl font-heading font-bold text-concreto">
                  {paciente.nombre} {paciente.apellido}
                </h1>
                <p className="text-marengo mt-1">
                  {paciente.tipoDocumento}: {paciente.documento}
                </p>
              </div>
            </div>
            
            {!isEditMode && (
              <button
                onClick={() => setIsEditMode(true)}
                className="px-6 py-2 bg-morena text-white rounded-lg 
                         hover:bg-morena/90 transition-all"
              >
                Editar
              </button>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {isEditMode ? (
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-concreto">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
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
                    Apellido *
                  </label>
                  <input
                    type="text"
                    name="apellido"
                    value={formData.apellido}
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
                    Tipo de Documento *
                  </label>
                  <select
                    name="tipoDocumento"
                    value={formData.tipoDocumento}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-marengo/30 
                             focus:border-morena focus:ring-2 focus:ring-piel/20 
                             transition-all outline-none"
                    required
                    disabled={isSaving}
                  >
                    <option value="DNI">DNI</option>
                    <option value="PASAPORTE">Pasaporte</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-concreto">
                    Numero de Documento *
                  </label>
                  <input
                    type="text"
                    name="documento"
                    value={formData.documento}
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
                    Fecha de Nacimiento *
                  </label>
                  <input
                    type="date"
                    name="fechaNacimiento"
                    value={formData.fechaNacimiento}
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
                    Telefono *
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
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
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-marengo/30 
                             focus:border-morena focus:ring-2 focus:ring-piel/20 
                             transition-all outline-none"
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-sm font-medium text-concreto">
                    Direccion
                  </label>
                  <input
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-marengo/30 
                             focus:border-morena focus:ring-2 focus:ring-piel/20 
                             transition-all outline-none"
                    disabled={isSaving}
                  />
                </div>
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
                    // Restablecer el formulario
                    setFormData({
                      nombre: paciente.nombre,
                      apellido: paciente.apellido,
                      documento: paciente.documento,
                      tipoDocumento: paciente.tipoDocumento,
                      fechaNacimiento: paciente.fechaNacimiento.split('T')[0],
                      telefono: paciente.telefono,
                      email: paciente.email || '',
                      direccion: paciente.direccion || '',
                    });
                  }}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-marengo font-medium mb-1">Nombre Completo</p>
                  <p className="text-concreto text-lg">{paciente.nombre} {paciente.apellido}</p>
                </div>

                <div>
                  <p className="text-sm text-marengo font-medium mb-1">Documento</p>
                  <p className="text-concreto text-lg">{paciente.tipoDocumento}: {paciente.documento}</p>
                </div>

                <div>
                  <p className="text-sm text-marengo font-medium mb-1">Edad</p>
                  <p className="text-concreto text-lg">{calcularEdad(paciente.fechaNacimiento)} años</p>
                </div>

                <div>
                  <p className="text-sm text-marengo font-medium mb-1">Fecha de Nacimiento</p>
                  <p className="text-concreto text-lg">
                    {new Date(paciente.fechaNacimiento).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-marengo font-medium mb-1">Telefono</p>
                  <p className="text-concreto text-lg">{paciente.telefono}</p>
                </div>

                <div>
                  <p className="text-sm text-marengo font-medium mb-1">Email</p>
                  <p className="text-concreto text-lg">{paciente.email || '-'}</p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-sm text-marengo font-medium mb-1">Direccion</p>
                  <p className="text-concreto text-lg">{paciente.direccion || '-'}</p>
                </div>

                <div>
                  <p className="text-sm text-marengo font-medium mb-1">Estado</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium
                    ${paciente.estado === 'ACTIVO' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {paciente.estado}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-marengo font-medium mb-1">Registrado</p>
                  <p className="text-concreto text-lg">
                    {new Date(paciente.createdAt).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-xl font-heading font-bold text-concreto mb-4">
              Historia Clinica
            </h2>
            <p className="text-marengo">
              Proximamente: historial de citas, cobros y recetas
            </p>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
