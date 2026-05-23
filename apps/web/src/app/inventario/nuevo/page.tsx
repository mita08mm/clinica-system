'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { FormSection, FormField } from '@/components/forms/FormSection';
import { api } from '@/lib/api';
import Link from 'next/link';

const inputBase =
  'w-full h-10 px-3 rounded-md border border-[var(--neutral-300)] bg-white text-sm text-[var(--neutral-800)] placeholder:text-[var(--neutral-400)] focus:outline-none focus:border-[var(--brand-morena)] focus:ring-[3px] focus:ring-[rgba(117,76,36,0.12)] transition-colors disabled:bg-[var(--neutral-50)]';
const textareaBase =
  'w-full px-3 py-2.5 rounded-md border border-[var(--neutral-300)] bg-white text-sm text-[var(--neutral-800)] placeholder:text-[var(--neutral-400)] focus:outline-none focus:border-[var(--brand-morena)] focus:ring-[3px] focus:ring-[rgba(117,76,36,0.12)] transition-colors resize-none';

export default function NuevoProductoPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'COSMECEUTICO' as 'COSMECEUTICO' | 'DERMOCOSMETICO' | 'EQUIPO' | 'INSUMO',
    precio: '',
    stock: '',
    stockMinimo: '',
    unidad: 'unidad',
    descripcion: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.nombre || !formData.precio || !formData.stock || !formData.stockMinimo) {
      setError('Complete todos los campos obligatorios');
      return;
    }

    const precio = parseFloat(formData.precio);
    const stock = parseInt(formData.stock);
    const stockMinimo = parseInt(formData.stockMinimo);

    if (isNaN(precio) || precio <= 0) {
      setError('El precio debe ser un número mayor a 0');
      return;
    }

    if (isNaN(stock) || stock < 0) {
      setError('El stock debe ser un número mayor o igual a 0');
      return;
    }

    if (isNaN(stockMinimo) || stockMinimo < 0) {
      setError('El stock mínimo debe ser un número mayor o igual a 0');
      return;
    }

    try {
      setIsLoading(true);

      const payload = {
        nombre: formData.nombre.trim(),
        tipo: formData.tipo,
        precio,
        stock,
        stockMinimo,
        unidad: formData.unidad,
        descripcion: formData.descripcion.trim() || undefined,
      };

      await api.post('/productos', payload);
      router.push('/inventario');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';
  const inputClass = 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-marengo focus:border-transparent';

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-3xl">
          <PageHeader
            overline="Inventario"
            title="Nuevo producto"
            subtitle="Agrega un producto al inventario con su stock inicial y alerta de reposición"
            backHref="/inventario"
          />

          {error && (
            <div className="mb-5 rounded-md border border-[rgba(181,58,58,0.2)] bg-[var(--semantic-danger-bg)] px-4 py-3 text-sm text-[var(--semantic-danger)]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <FormSection title="Información del producto">
              <FormField label="Nombre del producto" required>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className={inputBase}
                  placeholder="Ej. Ácido hialurónico 2%"
                  required
                />
              </FormField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Tipo de producto" required>
                  <select
                    name="tipo"
                    value={formData.tipo}
                    onChange={handleChange}
                    className={inputBase}
                    required
                  >
                    <option value="COSMECEUTICO">Cosmecéutico</option>
                    <option value="DERMOCOSMETICO">Dermocosmético</option>
                    <option value="EQUIPO">Equipo</option>
                    <option value="INSUMO">Insumo</option>
                  </select>
                </FormField>

                <FormField label="Unidad de medida" required>
                  <select
                    name="unidad"
                    value={formData.unidad}
                    onChange={handleChange}
                    className={inputBase}
                    required
                  >
                    <option value="unidad">Unidad</option>
                    <option value="ml">Mililitro (ml)</option>
                    <option value="gr">Gramo (gr)</option>
                    <option value="ampolla">Ampolla</option>
                    <option value="vial">Vial</option>
                    <option value="caja">Caja</option>
                    <option value="paquete">Paquete</option>
                  </select>
                </FormField>
              </div>

              <FormField label="Descripción">
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  className={textareaBase}
                  rows={3}
                  placeholder="Información adicional del producto..."
                />
              </FormField>
            </FormSection>

            <FormSection title="Precio y stock">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="Precio unitario (Bs.)" required>
                  <input
                    type="number"
                    name="precio"
                    value={formData.precio}
                    onChange={handleChange}
                    className={inputBase}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </FormField>

                <FormField label="Stock inicial" required>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    className={inputBase}
                    placeholder="0"
                    min="0"
                    required
                  />
                </FormField>

                <FormField
                  label="Stock mínimo"
                  required
                  hint="Recibirás una alerta cuando el stock llegue a este valor"
                >
                  <input
                    type="number"
                    name="stockMinimo"
                    value={formData.stockMinimo}
                    onChange={handleChange}
                    className={inputBase}
                    placeholder="5"
                    min="0"
                    required
                  />
                </FormField>
              </div>
            </FormSection>

            <div className="flex items-center justify-end gap-3">
              <Link
                href="/inventario"
                className="h-10 px-4 inline-flex items-center rounded-md border border-[var(--neutral-300)] text-sm font-medium text-[var(--neutral-700)] hover:bg-[var(--neutral-50)] transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="h-10 px-5 inline-flex items-center rounded-md bg-[var(--brand-morena)] text-sm font-medium text-white hover:bg-[var(--brand-morena-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Guardando...' : 'Guardar producto'}
              </button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
