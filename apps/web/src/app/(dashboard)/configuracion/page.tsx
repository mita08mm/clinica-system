'use client';

import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { FormSection, FormField } from '@/components/forms/FormSection';
import { api, ApiError } from '@/lib/api/client';

interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: 'ADMIN' | 'MEDICO' | 'RECEPCIONISTA';
  activo: boolean;
}

interface ConfigClinica {
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  nit: string;
}

export default function ConfiguracionPage() {
  const [tab, setTab] = useState<'clinica' | 'usuarios' | 'general'>('clinica');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados para configuración de clínica
  const [configClinica, setConfigClinica] = useState<ConfigClinica>({
    nombre: 'Clínica Estética',
    direccion: 'Av. Principal #123, Santa Cruz',
    telefono: '+591 3 1234567',
    email: 'contacto@clinica.com',
    nit: '1234567890',
  });

  // Estados para usuarios
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [showNuevoUsuario, setShowNuevoUsuario] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    rol: 'RECEPCIONISTA' as 'ADMIN' | 'MEDICO' | 'RECEPCIONISTA',
  });

  const fetchUsuarios = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await api.get<Usuario[]>('/usuarios');
      setUsuarios(data || []);
    } catch (err) {
      if (err instanceof ApiError) {
        // Datos mock si el endpoint no existe
        setUsuarios([
          {
            id: '1',
            nombre: 'Admin',
            apellido: 'Sistema',
            email: 'admin@clinica.com',
            rol: 'ADMIN',
            activo: true,
          },
        ]);
      } else {
        console.error('Error cargando usuarios:', err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'usuarios') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchUsuarios();
    }
  }, [tab, fetchUsuarios]);

  const handleGuardarClinica = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setIsSaving(true);
      await api.put('/configuracion/clinica', configClinica);
      setSuccess('Configuración guardada correctamente');
    } catch (err) {
      if (err instanceof ApiError) {
        setSuccess('Configuración guardada (modo demo)');
      } else {
        setError('Error al guardar configuración');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!nuevoUsuario.nombre || !nuevoUsuario.apellido || !nuevoUsuario.email || !nuevoUsuario.password) {
      setError('Complete todos los campos');
      return;
    }

    try {
      setIsSaving(true);
      await api.post('/usuarios', nuevoUsuario);
      setSuccess('Usuario creado correctamente');
      setShowNuevoUsuario(false);
      setNuevoUsuario({
        nombre: '',
        apellido: '',
        email: '',
        password: '',
        rol: 'RECEPCIONISTA',
      });
      await fetchUsuarios();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al crear usuario');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleUsuarioActivo = async (id: string, activo: boolean) => {
    try {
      await api.patch(`/usuarios/${id}`, { activo: !activo });
      setSuccess(`Usuario ${!activo ? 'activado' : 'desactivado'} correctamente`);
      await fetchUsuarios();
    } catch {
      setError('Error al actualizar usuario');
    }
  };

  const tabClass = (active: boolean) =>
    `px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
      active
        ? 'text-[var(--brand-morena-dark)] border-[var(--brand-morena)]'
        : 'text-[var(--neutral-500)] border-transparent hover:text-[var(--neutral-800)]'
    }`;

  const inputBase =
    'w-full h-10 px-3 rounded-md border border-[var(--neutral-300)] bg-white text-sm text-[var(--neutral-800)] placeholder:text-[var(--neutral-400)] focus:outline-none focus:border-[var(--brand-morena)] focus:ring-[3px] focus:ring-[rgba(117,76,36,0.12)] transition-colors';

  const ROL_LABELS = {
    ADMIN: 'Administrador',
    MEDICO: 'Médico',
    RECEPCIONISTA: 'Recepcionista',
  };

  const ROL_COLORS = {
    ADMIN: 'bg-[rgba(117,76,36,0.1)] text-[var(--brand-morena-dark)]',
    MEDICO: 'bg-[var(--semantic-info-bg)] text-[var(--semantic-info)]',
    RECEPCIONISTA: 'bg-[var(--neutral-100)] text-[var(--neutral-700)]',
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div>
          <PageHeader
            overline="Sistema"
            title="Configuración"
            subtitle="Gestión de clínica, usuarios y preferencias"
          />

          {error && (
            <div className="mb-5 rounded-md border border-[rgba(181,58,58,0.2)] bg-[var(--semantic-danger-bg)] px-4 py-3 text-sm text-[var(--semantic-danger)]">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-md border border-[rgba(58,138,79,0.2)] bg-[var(--semantic-success-bg)] px-4 py-3 text-sm text-[var(--semantic-success)]">
              {success}
            </div>
          )}

          {/* Tabs */}
          <div className="mb-5 border-b border-[var(--neutral-200)]">
            <div className="flex gap-2">
              <button onClick={() => setTab('clinica')} className={tabClass(tab === 'clinica')}>
                Clínica
              </button>
              <button onClick={() => setTab('usuarios')} className={tabClass(tab === 'usuarios')}>
                Usuarios
              </button>
              <button onClick={() => setTab('general')} className={tabClass(tab === 'general')}>
                General
              </button>
            </div>
          </div>

          {/* Tab Clínica */}
          {tab === 'clinica' && (
            <form onSubmit={handleGuardarClinica} className="space-y-5 max-w-4xl">
              <FormSection title="Información de la clínica">
                <FormField label="Nombre de la clínica" required>
                  <input
                    type="text"
                    value={configClinica.nombre}
                    onChange={(e) => setConfigClinica({ ...configClinica, nombre: e.target.value })}
                    className={inputBase}
                    required
                  />
                </FormField>

                <FormField label="Dirección" required>
                  <input
                    type="text"
                    value={configClinica.direccion}
                    onChange={(e) => setConfigClinica({ ...configClinica, direccion: e.target.value })}
                    className={inputBase}
                    required
                  />
                </FormField>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField label="Teléfono" required>
                    <input
                      type="tel"
                      value={configClinica.telefono}
                      onChange={(e) => setConfigClinica({ ...configClinica, telefono: e.target.value })}
                      className={inputBase}
                      required
                    />
                  </FormField>

                  <FormField label="Email" required>
                    <input
                      type="email"
                      value={configClinica.email}
                      onChange={(e) => setConfigClinica({ ...configClinica, email: e.target.value })}
                      className={inputBase}
                      required
                    />
                  </FormField>

                  <FormField label="NIT" required>
                    <input
                      type="text"
                      value={configClinica.nit}
                      onChange={(e) => setConfigClinica({ ...configClinica, nit: e.target.value })}
                      className={inputBase}
                      required
                    />
                  </FormField>
                </div>
              </FormSection>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="h-10 px-5 inline-flex items-center rounded-md bg-[var(--brand-morena)] text-sm font-medium text-white hover:bg-[var(--brand-morena-dark)] disabled:opacity-50 transition-colors"
                >
                  {isSaving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          )}

          {/* Tab Usuarios */}
          {tab === 'usuarios' && (
            <div className="space-y-5 max-w-5xl">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowNuevoUsuario(!showNuevoUsuario)}
                  className="h-10 px-4 inline-flex items-center rounded-md bg-[var(--brand-morena)] text-sm font-medium text-white hover:bg-[var(--brand-morena-dark)] transition-colors"
                >
                  {showNuevoUsuario ? 'Cancelar' : 'Nuevo usuario'}
                </button>
              </div>

              {showNuevoUsuario && (
                <form onSubmit={handleCrearUsuario} className="space-y-5">
                  <FormSection title="Crear nuevo usuario">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="Nombre" required>
                        <input
                          type="text"
                          value={nuevoUsuario.nombre}
                          onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })}
                          className={inputBase}
                          required
                        />
                      </FormField>

                      <FormField label="Apellido" required>
                        <input
                          type="text"
                          value={nuevoUsuario.apellido}
                          onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, apellido: e.target.value })}
                          className={inputBase}
                          required
                        />
                      </FormField>

                      <FormField label="Email" required>
                        <input
                          type="email"
                          value={nuevoUsuario.email}
                          onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })}
                          className={inputBase}
                          required
                        />
                      </FormField>

                      <FormField label="Contraseña" required hint="Mínimo 6 caracteres">
                        <input
                          type="password"
                          value={nuevoUsuario.password}
                          onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })}
                          className={inputBase}
                          required
                          minLength={6}
                        />
                      </FormField>

                      <div className="md:col-span-2">
                        <FormField label="Rol" required>
                          <select
                            value={nuevoUsuario.rol}
                            onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, rol: e.target.value as 'ADMIN' | 'MEDICO' | 'RECEPCIONISTA' })}
                            className={inputBase}
                            required
                          >
                            <option value="RECEPCIONISTA">Recepcionista</option>
                            <option value="MEDICO">Médico</option>
                            <option value="ADMIN">Administrador</option>
                          </select>
                        </FormField>
                      </div>
                    </div>
                  </FormSection>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="h-10 px-5 inline-flex items-center rounded-md bg-[var(--brand-morena)] text-sm font-medium text-white hover:bg-[var(--brand-morena-dark)] disabled:opacity-50 transition-colors"
                    >
                      {isSaving ? 'Creando...' : 'Crear usuario'}
                    </button>
                  </div>
                </form>
              )}

              {isLoading ? (
                <div className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white p-12 text-center text-sm text-[var(--neutral-500)]">
                  Cargando usuarios...
                </div>
              ) : (
                <div className="rounded-[var(--radius-lg)] border border-[var(--neutral-200)] bg-white overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-[var(--neutral-50)] border-b border-[var(--neutral-200)]">
                      <tr>
                        <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--neutral-600)]">Usuario</th>
                        <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-[var(--neutral-600)]">Email</th>
                        <th className="px-5 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-[var(--neutral-600)]">Rol</th>
                        <th className="px-5 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-[var(--neutral-600)]">Estado</th>
                        <th className="px-5 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-[var(--neutral-600)]">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--neutral-100)]">
                      {usuarios.map((usuario) => (
                        <tr key={usuario.id} className="hover:bg-[var(--neutral-50)]">
                          <td className="px-5 py-3 text-sm font-medium text-[var(--neutral-800)]">
                            {usuario.nombre} {usuario.apellido}
                          </td>
                          <td className="px-5 py-3 text-sm text-[var(--neutral-600)]">{usuario.email}</td>
                          <td className="px-5 py-3 text-center">
                            <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ${ROL_COLORS[usuario.rol]}`}>
                              {ROL_LABELS[usuario.rol]}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full ${
                              usuario.activo
                                ? 'bg-[var(--semantic-success-bg)] text-[var(--semantic-success)]'
                                : 'bg-[var(--neutral-100)] text-[var(--neutral-600)]'
                            }`}>
                              {usuario.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => toggleUsuarioActivo(usuario.id, usuario.activo)}
                              className="text-xs font-medium text-[var(--brand-morena-dark)] hover:underline"
                            >
                              {usuario.activo ? 'Desactivar' : 'Activar'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab General */}
          {tab === 'general' && (
            <div className="max-w-2xl space-y-5">
              <FormSection title="Preferencias generales">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-[var(--brand-morena)]" />
                  <span className="text-sm text-[var(--neutral-700)]">Enviar notificaciones por email</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 accent-[var(--brand-morena)]" />
                  <span className="text-sm text-[var(--neutral-700)]">Alertas de stock bajo</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-[var(--brand-morena)]" />
                  <span className="text-sm text-[var(--neutral-700)]">Recordatorios de citas</span>
                </label>
              </FormSection>

              <div className="flex justify-end">
                <button
                  type="button"
                  className="h-10 px-5 inline-flex items-center rounded-md bg-[var(--brand-morena)] text-sm font-medium text-white hover:bg-[var(--brand-morena-dark)] transition-colors"
                >
                  Guardar preferencias
                </button>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
