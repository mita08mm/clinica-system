'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { apiEndpoint } from '@/lib/config';

export default function NuevoPacientePage() {
  const router = useRouter();
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
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
    grupoSanguineo: '',
    peso: '',
    altura: '',
    alergias: '',
    obraSocial: '',
    contactoEmergenciaNombre: '',
    contactoEmergenciaTelefono: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, max } = e.target;
    if (max && parseFloat(value) > parseFloat(max)) return;
    setFormData({ ...formData, [name]: value });
  };

  const calcularEdad = () => {
    if (!formData.fechaNacimiento) return '--';
    const hoy = new Date();
    const nac = new Date(formData.fechaNacimiento);
    const edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    return m < 0 || (m === 0 && hoy.getDate() < nac.getDate()) ? `${edad - 1} años` : `${edad} años`;
  };

  const calcularIMC = () => {
    const peso = parseFloat(formData.peso);
    const altura = parseFloat(formData.altura) / 100;
    if (!peso || !altura) return '--';
    return (peso / (altura * altura)).toFixed(1);
  };

  const inputClass = "w-full px-4 py-3 rounded-lg border border-[#D7C5B9] focus:border-morena focus:ring-2 focus:ring-piel/20 transition-all outline-none bg-white";
  const disabledClass = "w-full px-4 py-3 rounded-lg border border-[#D7C5B9] bg-[#F5F0EB] text-marengo outline-none";
  const labelClass = "block text-xs font-medium text-concreto uppercase tracking-wider mb-2";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await fetch(apiEndpoint('/pacientes'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          peso: formData.peso ? parseFloat(formData.peso) : undefined,
          altura: formData.altura ? parseFloat(formData.altura) : undefined,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al crear paciente');
      }
      router.push('/pacientes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-4xl space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/pacientes" className="text-marengo hover:text-concreto">← Volver</Link>
            <div>
              <h1 className="text-3xl font-heading font-bold text-concreto">Nuevo Paciente</h1>
              <p className="text-marengo mt-1">Registra un nuevo paciente en el sistema</p>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">

            {/* DATOS PERSONALES */}
            <div className="bg-white rounded-xl shadow-sm p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-heading text-morena">Datos Personales</h2>
                <hr className="mt-2 border-[#D7C5B9]" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={labelClass}>Nombre *</label>
                  <input type="text" name="nombre" value={formData.nombre} onChange={handleChange}
                    placeholder="Ej. Ana" className={inputClass} required disabled={isLoading} />
                </div>
                <div>
                  <label className={labelClass}>Apellido *</label>
                  <input type="text" name="apellido" value={formData.apellido} onChange={handleChange}
                    placeholder="Ej. García" className={inputClass} required disabled={isLoading} />
                </div>
                <div>
                  <label className={labelClass}>Tipo de Documento *</label>
                  <select name="tipoDocumento" value={formData.tipoDocumento} onChange={handleChange}
                    className={inputClass} required disabled={isLoading}>
                    <option value="DNI">DNI</option>
                    <option value="PASAPORTE">Pasaporte</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className={labelClass}>Número de Documento *</label>
                  <input type="text" name="documento" value={formData.documento} onChange={handleChange}
                    placeholder="00000000X" className={inputClass} required disabled={isLoading} />
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
                    placeholder="+34..." className={inputClass} required disabled={isLoading} />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange}
                    placeholder="ejemplo@mail.com" className={inputClass} disabled={isLoading} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Dirección</label>
                <input type="text" name="direccion" value={formData.direccion} onChange={handleChange}
                  placeholder="Calle, Ciudad, Provincia" className={inputClass} disabled={isLoading} />
              </div>
            </div>

            {/* DATOS CLÍNICOS */}
            <div className="bg-white rounded-xl shadow-sm p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-heading text-morena">Datos Clínicos</h2>
                <hr className="mt-2 border-[#D7C5B9]" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <label className={labelClass}>Sexo/Género *</label>
                  <select name="sexo" value={formData.sexo} onChange={handleChange}
                    className={inputClass} disabled={isLoading}>
                    <option value="">Seleccionar</option>
                    <option value="MASCULINO">Masculino</option>
                    <option value="FEMENINO">Femenino</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Grupo Sanguíneo</label>
                  <select name="grupoSanguineo" value={formData.grupoSanguineo} onChange={handleChange}
                    className={inputClass} disabled={isLoading}>
                    <option value="">--</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Peso (kg)</label>
                  <input type="number" name="peso" min={1} max={300} value={formData.peso} onChange={handleNumberChange}
                    placeholder="70" className={inputClass} disabled={isLoading} />
                </div>
                <div>
                  <label className={labelClass}>Altura (cm)</label>
                  <input type="number" name="altura" min={1} max={250} value={formData.altura} onChange={handleNumberChange}
                    placeholder="170" className={inputClass} disabled={isLoading} />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <label className={labelClass}>IMC (Auto)</label>
                  <input type="text" value={calcularIMC()} className={disabledClass} disabled readOnly />
                </div>
                <div className="col-span-3">
                  <label className={labelClass}>Alergias Conocidas</label>
                  <textarea name="alergias" value={formData.alergias} onChange={handleChange}
                    placeholder="Describa alergias o escriba 'Ninguna'"
                    className={inputClass + " resize-none"} rows={3} disabled={isLoading} />
                </div>
              </div>
            </div>

            {/* SEGURO Y EMERGENCIA */}
            <div className="bg-white rounded-xl shadow-sm p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-heading text-morena">Seguro y Emergencia</h2>
                <hr className="mt-2 border-[#D7C5B9]" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Contacto Emergencia - Nombre *</label>
                  <input type="text" name="contactoEmergenciaNombre" value={formData.contactoEmergenciaNombre}
                    onChange={handleChange} placeholder="Nombre completo"
                    className={inputClass} disabled={isLoading} />
                </div>
                <div>
                  <label className={labelClass}>Contacto Emergencia - Teléfono *</label>
                  <input type="tel" name="contactoEmergenciaTelefono" value={formData.contactoEmergenciaTelefono}
                    onChange={handleChange} placeholder="+34..."
                    className={inputClass} disabled={isLoading} />
                </div>
              </div>

              <hr className="border-[#D7C5B9]" />

              <div className="flex justify-end gap-4">
                <Link href="/pacientes" className="btn-secondary">Cancelar</Link>
                <button type="submit" disabled={isLoading} className="btn-primary">
                  {isLoading ? 'Guardando...' : 'Guardar paciente →'}
                </button>
              </div>
            </div>

          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}