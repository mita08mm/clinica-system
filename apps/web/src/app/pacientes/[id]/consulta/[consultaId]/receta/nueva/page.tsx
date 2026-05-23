'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { FormSection, FormField } from '@/components/forms/FormSection';
import { api } from '@/lib/api/client';

interface Item {
  tipo: 'MEDICAMENTO' | 'INSUMO';
  itemId: string;
  nombre: string;
  cantidad: number;
  dosis?: string;
  frecuencia?: string;
  duracion?: string;
  precio?: number;
}

const inputBase =
  'w-full h-10 px-3 rounded-md border border-[var(--neutral-300)] bg-white text-sm text-[var(--neutral-800)] placeholder:text-[var(--neutral-400)] focus:outline-none focus:border-[var(--brand-morena)] focus:ring-[3px] focus:ring-[rgba(117,76,36,0.12)] transition-colors';
const textareaBase =
  'w-full px-3 py-2.5 rounded-md border border-[var(--neutral-300)] bg-white text-sm text-[var(--neutral-800)] placeholder:text-[var(--neutral-400)] focus:outline-none focus:border-[var(--brand-morena)] focus:ring-[3px] focus:ring-[rgba(117,76,36,0.12)] transition-colors resize-none';

function NuevaRecetaConsultaContent() {
  const params = useParams();
  const router = useRouter();
  const { usuario } = useAuth();
  const pacienteId = params.id as string;
  const consultaId = params.consultaId as string;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [indicaciones, setIndicaciones] = useState('');
  const [items, setItems] = useState<Item[]>([]);

  const [nuevoItem, setNuevoItem] = useState<Item>({
    tipo: 'MEDICAMENTO',
    itemId: '',
    nombre: '',
    cantidad: 1,
    dosis: '',
    frecuencia: '',
    duracion: '',
  });

  const agregarItem = () => {
    if (!nuevoItem.nombre || nuevoItem.cantidad <= 0) {
      setError('Complete el nombre y cantidad del item');
      return;
    }
    setItems([...items, { ...nuevoItem, itemId: crypto.randomUUID() }]);
    setNuevoItem({ tipo: 'MEDICAMENTO', itemId: '', nombre: '', cantidad: 1, dosis: '', frecuencia: '', duracion: '' });
    setError('');
  };

  const eliminarItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (items.length === 0) { setError('Debe agregar al menos un item a la receta'); return; }
    if (!usuario?.id) { setError('Usuario no identificado'); return; }
    setIsLoading(true);
    try {
      await api.post('/recetas', {
        pacienteId,
        consultaId,
        usuarioId: usuario.id,
        indicaciones: indicaciones || undefined,
        items,
      });
      router.push(`/pacientes/${pacienteId}/historia`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl">
      <PageHeader
        overline="Historia clínica"
        title="Nueva receta"
        subtitle="Agregar medicamentos e insumos a la consulta"
        backHref={`/pacientes/${pacienteId}/historia`}
      />

      {error && (
        <div className="mb-5 rounded-md border border-[rgba(181,58,58,0.2)] bg-[var(--semantic-danger-bg)] px-4 py-3 text-sm text-[var(--semantic-danger)]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <FormSection title="Agregar item" description="Completa los campos y pulsa Agregar para sumar a la lista">
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12 md:col-span-2">
              <FormField label="Tipo">
                <select
                  value={nuevoItem.tipo}
                  onChange={(e) => setNuevoItem({ ...nuevoItem, tipo: e.target.value as Item['tipo'] })}
                  className={inputBase}
                >
                  <option value="MEDICAMENTO">Medicamento</option>
                  <option value="INSUMO">Insumo</option>
                </select>
              </FormField>
            </div>
            <div className="col-span-12 md:col-span-3">
              <FormField label="Nombre">
                <input
                  type="text"
                  value={nuevoItem.nombre}
                  onChange={(e) => setNuevoItem({ ...nuevoItem, nombre: e.target.value })}
                  placeholder="Nombre del item"
                  className={inputBase}
                />
              </FormField>
            </div>
            <div className="col-span-4 md:col-span-1">
              <FormField label="Cant.">
                <input
                  type="number"
                  min={1}
                  value={nuevoItem.cantidad}
                  onChange={(e) => setNuevoItem({ ...nuevoItem, cantidad: parseInt(e.target.value) || 0 })}
                  className={inputBase}
                />
              </FormField>
            </div>
            <div className="col-span-8 md:col-span-2">
              <FormField label="Dosis">
                <input
                  type="text"
                  value={nuevoItem.dosis}
                  onChange={(e) => setNuevoItem({ ...nuevoItem, dosis: e.target.value })}
                  placeholder="Ej: 500mg"
                  className={inputBase}
                />
              </FormField>
            </div>
            <div className="col-span-7 md:col-span-2">
              <FormField label="Frecuencia">
                <input
                  type="text"
                  value={nuevoItem.frecuencia}
                  onChange={(e) => setNuevoItem({ ...nuevoItem, frecuencia: e.target.value })}
                  placeholder="Cada 8 horas"
                  className={inputBase}
                />
              </FormField>
            </div>
            <div className="col-span-5 md:col-span-2">
              <FormField label="Duración">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nuevoItem.duracion}
                    onChange={(e) => setNuevoItem({ ...nuevoItem, duracion: e.target.value })}
                    placeholder="7 días"
                    className={inputBase}
                  />
                  <button
                    type="button"
                    onClick={agregarItem}
                    className="shrink-0 inline-flex items-center justify-center h-10 px-3 rounded-md bg-[var(--brand-morena)] text-white text-sm font-medium hover:bg-[var(--brand-morena-dark)] transition-colors"
                  >
                    Agregar
                  </button>
                </div>
              </FormField>
            </div>
          </div>
        </FormSection>

        <section className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--neutral-100)] flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--neutral-500)]">
              Items de la receta
            </p>
            <span className="text-xs text-[var(--neutral-500)] tabular-nums">
              {items.length} item{items.length === 1 ? '' : 's'}
            </span>
          </div>
          {items.length > 0 ? (
            <table className="w-full">
              <thead className="bg-[var(--neutral-50)] border-b border-[var(--neutral-100)]">
                <tr>
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--neutral-600)]">Tipo</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--neutral-600)]">Nombre</th>
                  <th className="px-4 py-2.5 text-center text-[11px] font-medium uppercase tracking-wider text-[var(--neutral-600)]">Cant.</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--neutral-600)]">Dosis</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--neutral-600)]">Frecuencia</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--neutral-600)]">Duración</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--neutral-100)]">
                {items.map((item, index) => (
                  <tr key={item.itemId}>
                    <td className="px-4 py-3 text-sm text-[var(--neutral-700)]">{item.tipo}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[var(--neutral-900)]">{item.nombre}</td>
                    <td className="px-4 py-3 text-sm text-[var(--neutral-700)] text-center tabular-nums">{item.cantidad}</td>
                    <td className="px-4 py-3 text-sm text-[var(--neutral-600)]">{item.dosis || '—'}</td>
                    <td className="px-4 py-3 text-sm text-[var(--neutral-600)]">{item.frecuencia || '—'}</td>
                    <td className="px-4 py-3 text-sm text-[var(--neutral-600)]">{item.duracion || '—'}</td>
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
          ) : (
            <div className="px-6 py-10 text-center text-sm text-[var(--neutral-500)]">
              No hay items agregados. Agrega al menos uno para continuar.
            </div>
          )}
        </section>

        <FormSection title="Indicaciones generales">
          <FormField label="Instrucciones adicionales para el paciente">
            <textarea
              value={indicaciones}
              onChange={(e) => setIndicaciones(e.target.value)}
              rows={4}
              className={textareaBase}
              placeholder="Información complementaria, recomendaciones..."
            />
          </FormField>
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
            disabled={isLoading || items.length === 0}
            className="inline-flex items-center h-10 px-5 rounded-md bg-[var(--brand-morena)] text-white text-sm font-medium hover:bg-[var(--brand-morena-dark)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Guardando...' : 'Guardar receta'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NuevaRecetaConsultaPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <NuevaRecetaConsultaContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
