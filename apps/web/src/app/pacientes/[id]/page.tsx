'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { FormSection, FormField } from '@/components/forms/FormSection';
import DatePicker from '@/components/ui/DatePicker';
import { api, ApiError } from '@/lib/api';

const inputBase =
  'w-full h-10 px-3 rounded-md border border-[var(--neutral-300)] bg-white text-sm text-[var(--neutral-800)] placeholder:text-[var(--neutral-400)] focus:outline-none focus:border-[var(--brand-morena)] focus:ring-[3px] focus:ring-[rgba(117,76,36,0.12)] transition-colors disabled:bg-[var(--neutral-50)] disabled:text-[var(--neutral-500)]';
const textareaBase =
  'w-full px-3 py-2.5 rounded-md border border-[var(--neutral-300)] bg-white text-sm text-[var(--neutral-800)] placeholder:text-[var(--neutral-400)] focus:outline-none focus:border-[var(--brand-morena)] focus:ring-[3px] focus:ring-[rgba(117,76,36,0.12)] transition-colors resize-none disabled:bg-[var(--neutral-50)]';

export default function EditarPacientePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    tipoDocumento: 'DNI',
    documento: '',
    fechaNacimiento: '',
    telefono: '',
    email: '',
    direccion: '',
    sexo: '',
    objetivoEstetico: '',
    alergias: '',
    condicionesMedicas: '',
    medicacionActual: '',
    embarazoLactancia: false,
    contactoEmergenciaNombre: '',
    contactoEmergenciaTelefono: '',
  });

  useEffect(() => {
    if (!id) return;
    const loadPatient = async () => {
      try {
        const p = await api.get<Record<string, unknown> & { fechaNacimiento?: string }>(`/pacientes/${id}`);
        setFormData({
          nombre: (p.nombre as string) ?? '',
          apellido: (p.apellido as string) ?? '',
          tipoDocumento: (p.tipoDocumento as string) ?? 'DNI',
          documento: (p.documento as string) ?? '',
          fechaNacimiento: p.fechaNacimiento?.slice(0, 10) ?? '',
          telefono: (p.telefono as string) ?? '',
          email: (p.email as string) ?? '',
          direccion: (p.direccion as string) ?? '',
          sexo: (p.sexo as string) ?? '',
          objetivoEstetico: (p.objetivoEstetico as string) ?? '',
          alergias: (p.alergias as string) ?? '',
          condicionesMedicas: (p.condicionesMedicas as string) ?? '',
          medicacionActual: (p.medicacionActual as string) ?? '',
          embarazoLactancia: (p.embarazoLactancia as boolean) ?? false,
          contactoEmergenciaNombre: (p.contactoEmergenciaNombre as string) ?? '',
          contactoEmergenciaTelefono: (p.contactoEmergenciaTelefono as string) ?? '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsFetching(false);
      }
    };
    loadPatient();
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'sexo' && value !== 'FEMENINO') {
      setFormData({ ...formData, [name]: value, embarazoLactancia: false });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const calcularEdad = () => {
    if (!formData.fechaNacimiento) return '—';
    const hoy = new Date();
    const nac = new Date(formData.fechaNacimiento);
    const edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    const final = m < 0 || (m === 0 && hoy.getDate() < nac.getDate()) ? edad - 1 : edad;
    return `${final} años`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await api.put(`/pacientes/${id}`, formData);
      router.push('/pacientes');
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Error al actualizar paciente'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex justify-center items-center min-h-[400px] text-sm text-[var(--neutral-500)]">
            Cargando datos del paciente...
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-4xl">
          <PageHeader
            overline="Pacientes"
            title="Editar paciente"
            subtitle={`${formData.nombre} ${formData.apellido}`.trim() || 'Modificar datos del paciente'}
            backHref="/pacientes"
          />

          {error && (
            <div className="mb-5 rounded-md border border-[rgba(181,58,58,0.2)] bg-[var(--semantic-danger-bg)] px-4 py-3 text-sm text-[var(--semantic-danger)]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <FormSection title="Datos personales">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="Nombre" required>
                  <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} className={inputBase} required disabled={isLoading} />
                </FormField>
                <FormField label="Apellido" required>
                  <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} className={inputBase} required disabled={isLoading} />
                </FormField>
                <FormField label="Tipo de documento" required>
                  <select name="tipoDocumento" value={formData.tipoDocumento} onChange={handleChange} className={inputBase} required disabled={isLoading}>
                    <option value="DNI">CI (Cédula de identidad)</option>
                    <option value="PASAPORTE">Pasaporte (Extranjero)</option>
                  </select>
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="Número de documento" required>
                  <input type="text" name="documento" value={formData.documento} onChange={handleChange} className={inputBase} required disabled={isLoading} />
                </FormField>
                <DatePicker
                  label="Fecha de nacimiento"
                  name="fechaNacimiento"
                  value={formData.fechaNacimiento}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  maxDate={new Date()}
                />
                <FormField label="Edad">
                  <input type="text" value={calcularEdad()} className={inputBase} disabled readOnly />
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Teléfono" required>
                  <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} className={inputBase} required disabled={isLoading} />
                </FormField>
                <FormField label="Email">
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputBase} disabled={isLoading} />
                </FormField>
              </div>

              <FormField label="Dirección">
                <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} className={inputBase} disabled={isLoading} />
              </FormField>
            </FormSection>

            <FormSection title="Datos clínicos" description="Información clínica relevante del paciente">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Sexo / género" required>
                  <select name="sexo" value={formData.sexo} onChange={handleChange} className={inputBase} required disabled={isLoading}>
                    <option value="">Seleccionar</option>
                    <option value="MASCULINO">Masculino</option>
                    <option value="FEMENINO">Femenino</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </FormField>
                <FormField label="Objetivo principal">
                  <input type="text" name="objetivoEstetico" value={formData.objetivoEstetico} onChange={handleChange} className={inputBase} disabled={isLoading} />
                </FormField>
              </div>

              <FormField label="Alergias conocidas">
                <textarea name="alergias" value={formData.alergias} onChange={handleChange} className={textareaBase} rows={2} disabled={isLoading} />
              </FormField>
              <FormField label="Condiciones médicas relevantes">
                <textarea name="condicionesMedicas" value={formData.condicionesMedicas} onChange={handleChange} className={textareaBase} rows={2} disabled={isLoading} />
              </FormField>
              <FormField label="Medicación actual">
                <textarea name="medicacionActual" value={formData.medicacionActual} onChange={handleChange} className={textareaBase} rows={2} disabled={isLoading} />
              </FormField>

              {formData.sexo === 'FEMENINO' && (
                <label className="flex items-center gap-3 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    name="embarazoLactancia"
                    checked={formData.embarazoLactancia}
                    onChange={(e) => setFormData({ ...formData, embarazoLactancia: e.target.checked })}
                    className="h-4 w-4 rounded border-[var(--neutral-300)] accent-[var(--brand-morena)]"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-[var(--neutral-700)]">¿Embarazo o lactancia?</span>
                </label>
              )}
            </FormSection>

            <FormSection title="Contacto de emergencia">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Nombre completo">
                  <input type="text" name="contactoEmergenciaNombre" value={formData.contactoEmergenciaNombre} onChange={handleChange} className={inputBase} disabled={isLoading} />
                </FormField>
                <FormField label="Teléfono">
                  <input type="tel" name="contactoEmergenciaTelefono" value={formData.contactoEmergenciaTelefono} onChange={handleChange} className={inputBase} disabled={isLoading} />
                </FormField>
              </div>
            </FormSection>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                href="/pacientes"
                className="inline-flex items-center h-10 px-4 rounded-md border border-[var(--neutral-300)] bg-white text-sm font-medium text-[var(--neutral-700)] hover:bg-[var(--neutral-50)] transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center h-10 px-5 rounded-md bg-[var(--brand-morena)] text-white text-sm font-medium hover:bg-[var(--brand-morena-dark)] transition-colors shadow-[var(--shadow-xs)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Actualizando...' : 'Actualizar paciente'}
              </button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
