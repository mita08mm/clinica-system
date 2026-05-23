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
const textareaBase =
  'w-full px-3 py-2.5 rounded-md border border-[var(--neutral-300)] bg-white text-sm text-[var(--neutral-800)] placeholder:text-[var(--neutral-400)] focus:outline-none focus:border-[var(--brand-morena)] focus:ring-[3px] focus:ring-[rgba(117,76,36,0.12)] transition-colors resize-none';

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  documento: string;
  tipoDocumento: string;
  estado: string;
}

interface Item {
  id: string;
  nombre: string;
  indicaciones: string;
}

export default function NuevaRecetaPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loadingPacientes, setLoadingPacientes] = useState(true);

  const [pacienteId, setPacienteId] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [nombreItem, setNombreItem] = useState('');
  const [indicaciones, setIndicaciones] = useState('');

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

  const agregarItem = () => {
    if (!nombreItem.trim() || !indicaciones.trim()) {
      setError('Complete el nombre y las indicaciones');
      return;
    }

    setItems([...items, {
      id: crypto.randomUUID(),
      nombre: nombreItem.trim(),
      indicaciones: indicaciones.trim(),
    }]);
    setNombreItem('');
    setIndicaciones('');
    setError('');
  };

  const eliminarItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (items.length === 0) {
      setError('Debe agregar al menos un item a la prescripción');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/protocolos', {
        pacienteId,
        nombre: buildPrescriptionName(items),
        items: items.map((item) => ({
          nombre: item.nombre,
          indicaciones: item.indicaciones,
        })),
      });

      router.push('/recetas');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-4xl">
          <PageHeader
            overline="Recetas"
            title="Nueva prescripción"
            subtitle="Registra los productos indicados al paciente con sus indicaciones"
            backHref="/recetas"
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

            <FormSection
              title="Productos prescritos"
              description="Agrega los productos uno por uno con sus indicaciones"
            >
              <div className="rounded-md bg-[var(--neutral-50)] border border-[var(--neutral-100)] p-4 space-y-4">
                <FormField label="Nombre del producto">
                  <input
                    type="text"
                    value={nombreItem}
                    onChange={(e) => setNombreItem(e.target.value)}
                    placeholder="Ej. Protector solar, crema reparadora"
                    className={inputBase}
                  />
                </FormField>

                <FormField label="Indicaciones">
                  <textarea
                    value={indicaciones}
                    onChange={(e) => setIndicaciones(e.target.value)}
                    rows={2}
                    placeholder="Ej. Aplicar por la noche durante 30 días"
                    className={textareaBase}
                  />
                </FormField>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={agregarItem}
                    className="h-9 px-4 inline-flex items-center rounded-md border border-[var(--neutral-300)] bg-white text-sm font-medium text-[var(--neutral-700)] hover:bg-[var(--neutral-50)] transition-colors"
                  >
                    Agregar producto
                  </button>
                </div>
              </div>

              {items.length > 0 ? (
                <div className="rounded-md border border-[var(--neutral-200)] overflow-hidden">
                  <table className="min-w-full divide-y divide-[var(--neutral-100)]">
                    <thead className="bg-[var(--neutral-50)]">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--neutral-600)]">Nombre</th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--neutral-600)]">Indicaciones</th>
                        <th className="px-4 py-2.5"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--neutral-100)] bg-white">
                      {items.map((item, index) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-sm font-medium text-[var(--neutral-800)]">{item.nombre}</td>
                          <td className="px-4 py-3 text-sm text-[var(--neutral-600)]">{item.indicaciones}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => eliminarItem(index)}
                              className="text-xs font-medium text-[var(--semantic-danger)] hover:underline"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-[var(--neutral-500)] rounded-md border border-dashed border-[var(--neutral-200)]">
                  No hay productos agregados. Agrega al menos uno para continuar.
                </div>
              )}
            </FormSection>

            <div className="flex items-center justify-end gap-3">
              <Link
                href="/recetas"
                className="h-10 px-4 inline-flex items-center rounded-md border border-[var(--neutral-300)] text-sm font-medium text-[var(--neutral-700)] hover:bg-[var(--neutral-50)] transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isLoading || items.length === 0}
                className="h-10 px-5 inline-flex items-center rounded-md bg-[var(--brand-morena)] text-sm font-medium text-white hover:bg-[var(--brand-morena-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Guardando...' : 'Guardar prescripción'}
              </button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function buildPrescriptionName(items: Item[]) {
  if (items.length === 1) {
    return items[0].nombre;
  }

  return `${items[0].nombre} y ${items.length - 1} mas`;
}
