// pacientes/[id]/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { apiEndpoint } from '@/lib/config';
import ArrowIcon from '@/components/icons/ArrowIcon';

export default function EditarPacientePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;          // ← obtiene el id de la URL
  const { token } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true); // ← carga inicial
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

  // ─── 1. Carga los datos del paciente al entrar ───────────────────────────
  useEffect(() => {
    if (!token || !id) return;
    const loadPatient = async () => {
      try {
        const response = await fetch(apiEndpoint(`/pacientes/${id}`), {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('No se pudo cargar el paciente');
        const data = await response.json();
        const p = data.data ?? data; // ajusta según cómo devuelve tu API
        setFormData({
          nombre: p.nombre ?? '',
          apellido: p.apellido ?? '',
          tipoDocumento: p.tipoDocumento ?? 'DNI',
          documento: p.documento ?? '',
          fechaNacimiento: p.fechaNacimiento?.slice(0, 10) ?? '', // formato YYYY-MM-DD
          telefono: p.telefono ?? '',
          email: p.email ?? '',
          direccion: p.direccion ?? '',
          sexo: p.sexo ?? '',
          objetivoEstetico: p.objetivoEstetico ?? '',
          alergias: p.alergias ?? '',
          condicionesMedicas: p.condicionesMedicas ?? '',
          medicacionActual: p.medicacionActual ?? '',
          embarazoLactancia: p.embarazoLactancia ?? false,
          contactoEmergenciaNombre: p.contactoEmergenciaNombre ?? '',
          contactoEmergenciaTelefono: p.contactoEmergenciaTelefono ?? '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsFetching(false);
      }
    };
    loadPatient();
  }, [token, id]);

  // ─── 2. Handlers (idénticos a nuevo/page.tsx) ───────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'sexo' && value !== 'FEMENINO') {
      setFormData({ ...formData, [name]: value, embarazoLactancia: false });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const calcularEdad = () => {
    if (!formData.fechaNacimiento) return '--';
    const hoy = new Date();
    const nac = new Date(formData.fechaNacimiento);
    const edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    return m < 0 || (m === 0 && hoy.getDate() < nac.getDate()) ? `${edad - 1} años` : `${edad} años`;
  };

  // ─── 3. Submit usa PUT al endpoint con id ───────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await fetch(apiEndpoint(`/pacientes/${id}`), {
        method: 'PUT',                           // ← PUT en vez de POST
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
      router.push('/pacientes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-lg border border-[#D7C5B9] focus:border-morena focus:ring-2 focus:ring-piel/20 transition-all outline-none bg-white";
  const disabledClass = "w-full px-4 py-3 rounded-lg border border-[#D7C5B9] bg-[#F5F0EB] text-marengo outline-none";
  const labelClass = "block text-xs font-medium text-concreto uppercase tracking-wider mb-2";

  // ─── 4. Spinner mientras carga los datos iniciales ──────────────────────
  if (isFetching) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="card p-8 text-center">
            <div className="w-16 h-16 border-4 border-piel border-t-morena rounded-lg animate-spin mx-auto"></div>
            <p className="text-marengo mt-4">Cargando datos del paciente...</p>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="relative flex items-center justify-center mb-2">
            <Link href="/pacientes" className="absolute left-0 p-2 rounded-lg hover:bg-piel/20 transition-colors">
              <ArrowIcon className="w-7 h-7" />
            </Link>
            <div className="text-center">
              <h1 className="text-3xl font-heading font-bold text-concreto">Editar Paciente</h1>
              <p className="text-marengo mt-1">Modificá los datos del paciente</p>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* DATOS PERSONALES — igual que nuevo/page.tsx */}
            <div className="card p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-heading text-morena">Datos Personales</h2>
                <hr className="mt-2 border-[#D7C5B9]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={labelClass}>Nombre *</label>
                  <input type="text" name="nombre" value={formData.nombre} onChange={handleChange}
                    className={inputClass} required disabled={isLoading} />
                </div>
                <div>
                  <label className={labelClass}>Apellido *</label>
                  <input type="text" name="apellido" value={formData.apellido} onChange={handleChange}
                    className={inputClass} required disabled={isLoading} />
                </div>
                <div>
                  <label className={labelClass}>Tipo de Documento *</label>
                  <select name="tipoDocumento" value={formData.tipoDocumento} onChange={handleChange}
                    className={inputClass} required disabled={isLoading}>
                    <option value="DNI">CI (Cédula de Identidad)</option>
                    <option value="PASAPORTE">Pasaporte (Extranjero)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={labelClass}>Número de Documento *</label>
                  <input type="text" name="documento" value={formData.documento} onChange={handleChange}
                    className={inputClass} required disabled={isLoading} />
                </div>
                <div>
                  <label className={labelClass}>Fecha de Nacimiento *</label>
                  <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange}
                    className={inputClass} required disabled={isLoading} />
                </div>
                <div>
                  <label className={labelClass}>Edad (Auto)</label>
                  <input type="text" value={calcularEdad()} className={disabledClass} disabled readOnly />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Teléfono *</label>
                  <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange}
                    className={inputClass} required disabled={isLoading} />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange}
                    className={inputClass} disabled={isLoading} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Dirección</label>
                <input type="text" name="direccion" value={formData.direccion} onChange={handleChange}
                  className={inputClass} disabled={isLoading} />
              </div>
            </div>

            {/* DATOS CLÍNICOS */}
            <div className="card p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-heading text-morena">Datos Clínicos</h2>
                <p className="text-sm text-marengo mt-1">Información relevante para tratamientos estéticos</p>
                <hr className="mt-2 border-[#D7C5B9]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Sexo/Género *</label>
                  <select name="sexo" value={formData.sexo} onChange={handleChange}
                    className={inputClass} required disabled={isLoading}>
                    <option value="">Seleccionar</option>
                    <option value="MASCULINO">Masculino</option>
                    <option value="FEMENINO">Femenino</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Objetivo Estético Principal</label>
                  <input type="text" name="objetivoEstetico" value={formData.objetivoEstetico} onChange={handleChange}
                    className={inputClass} disabled={isLoading} />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Alergias Conocidas</label>
                  <textarea name="alergias" value={formData.alergias} onChange={handleChange}
                    className={inputClass + " resize-none"} rows={2} disabled={isLoading} />
                </div>
                <div>
                  <label className={labelClass}>Condiciones Médicas Relevantes</label>
                  <textarea name="condicionesMedicas" value={formData.condicionesMedicas} onChange={handleChange}
                    className={inputClass + " resize-none"} rows={2} disabled={isLoading} />
                </div>
                <div>
                  <label className={labelClass}>Medicación Actual</label>
                  <textarea name="medicacionActual" value={formData.medicacionActual} onChange={handleChange}
                    className={inputClass + " resize-none"} rows={2} disabled={isLoading} />
                </div>
                {formData.sexo === 'FEMENINO' && (
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" name="embarazoLactancia"
                        checked={formData.embarazoLactancia}
                        onChange={(e) => setFormData({ ...formData, embarazoLactancia: e.target.checked })}
                        className="w-5 h-5 rounded border-gray-300 text-morena focus:ring-morena"
                        disabled={isLoading} />
                      <span className={labelClass + " mb-0"}>¿Embarazo o Lactancia?</span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* CONTACTO DE EMERGENCIA */}
            <div className="card p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-heading text-morena">Contacto de Emergencia</h2>
                <hr className="mt-2 border-[#D7C5B9]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Contacto Emergencia - Nombre</label>
                  <input type="text" name="contactoEmergenciaNombre" value={formData.contactoEmergenciaNombre}
                    onChange={handleChange} className={inputClass} disabled={isLoading} />
                </div>
                <div>
                  <label className={labelClass}>Contacto Emergencia - Teléfono</label>
                  <input type="tel" name="contactoEmergenciaTelefono" value={formData.contactoEmergenciaTelefono}
                    onChange={handleChange} className={inputClass} disabled={isLoading} />
                </div>
              </div>
              <hr className="border-[#D7C5B9]" />
              <div className="flex justify-end gap-4">
                <Link href="/pacientes" className="btn-secondary">Cancelar</Link>
                <button type="submit" disabled={isLoading} className="btn-primary">
                  {isLoading ? 'Actualizando...' : 'Actualizar paciente'} {/* ← cambio de texto */}
                </button>
              </div>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}