'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { FormSection, FormField } from '@/components/forms/FormSection';
import Link from 'next/link';
import { api } from '@/lib/api';

const inputBase =
  'w-full h-10 px-3 rounded-md border border-[var(--neutral-300)] bg-white text-sm text-[var(--neutral-800)] placeholder:text-[var(--neutral-400)] focus:outline-none focus:border-[var(--brand-morena)] focus:ring-[3px] focus:ring-[rgba(117,76,36,0.12)] transition-colors disabled:bg-[var(--neutral-50)]';

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  documento: string;
  tipoDocumento: string;
  estado: string;
}

export default function NuevoCobroPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loadingPacientes, setLoadingPacientes] = useState(true);

  const [pacienteId, setPacienteId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [costo, setCosto] = useState('');

  useEffect(() => {
    const fetchPacientes = async () => {
      try {
        const data = await api.get<Paciente[]>('/pacientes');
        setPacientes(data.filter((p) => p.estado === 'ACTIVO'));
      } catch (err) {
        console.error('Error cargando pacientes:', err);
      } finally {
        setLoadingPacientes(false);
      }
    };

    fetchPacientes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const monto = Number(costo);

    if (!titulo.trim()) {
      setError('Ingrese una descripción o título');
      return;
    }

    if (Number.isNaN(monto) || monto <= 0) {
      setError('El costo debe ser mayor a 0');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/cobros', {
        pacienteId,
        items: [
          {
            tipo: 'PAQUETE',
            nombre: titulo.trim(),
            cantidad: 1,
            precioUnitario: monto,
          },
        ],
      });
      router.push('/cobros');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const formatMonto = (monto: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
    }).format(monto);
  };

  const costoActual = Number(costo) || 0;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-4xl">
          <PageHeader
            overline="Cobros"
            title="Nuevo cobro"
            subtitle="Registra un producto o servicio y su costo"
            backHref="/cobros"
          />

          {error && (
            <div className="mb-5 rounded-md border border-[rgba(181,58,58,0.2)] bg-[var(--semantic-danger-bg)] px-4 py-3 text-sm text-[var(--semantic-danger)]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <FormSection title="Paciente">
              <FormField label="Paciente" required>
                {loadingPacientes ? (
                  <div className="text-sm text-[var(--neutral-500)]">Cargando pacientes...</div>
                ) : (
                  <select
                    value={pacienteId}
                    onChange={(e) => setPacienteId(e.target.value)}
                    className={inputBase}
                    required
                    disabled={isLoading}
                  >
                    <option value="">Seleccione un paciente</option>
                    {pacientes.map((paciente) => (
                      <option key={paciente.id} value={paciente.id}>
                        {paciente.nombre} {paciente.apellido} — {paciente.tipoDocumento}: {paciente.documento}
                      </option>
                    ))}
                  </select>
                )}
              </FormField>
            </FormSection>

            <FormSection title="Registro">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Descripción o título" required>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ej. Limpieza facial, producto reparador"
                    className={inputBase}
                    required
                  />
                </FormField>

                <FormField label="Costo (Bs.)" required>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={costo}
                    onChange={(e) => setCosto(e.target.value)}
                    placeholder="0.00"
                    className={inputBase}
                    required
                  />
                </FormField>
              </div>

              <div className="mt-2 flex items-center justify-between rounded-md bg-[var(--neutral-50)] border border-[var(--neutral-100)] px-4 py-3">
                <span className="text-xs font-medium uppercase tracking-wider text-[var(--neutral-600)]">
                  Total a cobrar
                </span>
                <span className="font-heading text-2xl font-medium text-[var(--brand-morena-dark)]">
                  {formatMonto(costoActual)}
                </span>
              </div>
            </FormSection>

            <div className="flex items-center justify-end gap-3">
              <Link
                href="/cobros"
                className="h-10 px-4 inline-flex items-center rounded-md border border-[var(--neutral-300)] text-sm font-medium text-[var(--neutral-700)] hover:bg-[var(--neutral-50)] transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isLoading || !titulo.trim() || costoActual <= 0}
                className="h-10 px-5 inline-flex items-center rounded-md bg-[var(--brand-morena)] text-sm font-medium text-white hover:bg-[var(--brand-morena-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Guardando...' : 'Guardar registro'}
              </button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
