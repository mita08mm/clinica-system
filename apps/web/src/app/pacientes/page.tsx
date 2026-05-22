'use client';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { apiEndpoint } from '@/lib/config';
import EditIcon from '@/components/icons/EditIcon';
import ClipboardIcon from '@/components/icons/ClipboardIcon';

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  documento: string;
  tipoDocumento: string;
  telefono: string;
  email?: string;
  estado: string;
  fechaNacimiento: string;
}

// ─── Hook de debounce: espera X ms después de que el usuario deja de escribir ──
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);  // cancela si el usuario sigue escribiendo
  }, [value, delay]);
  return debounced;
}

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');  // ← estado del buscador
  const { token } = useAuth();

  // Espera 200ms después de la última tecla antes de filtrar
  const debouncedQuery = useDebounce(searchQuery, 200);

  useEffect(() => {
    if (!token) return;
    const fetchPacientes = async () => {
      try {
        const response = await fetch(apiEndpoint('/pacientes'), {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Error al obtener pacientes');
        const data = await response.json();
        setPacientes(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPacientes();
  }, [token]);

  // ─── Filtrado con useMemo: solo recalcula cuando cambia la query o la lista ──
  const pacientesFiltrados = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return pacientes;  // sin query → devuelve todo sin calcular nada

    return pacientes.filter((p) => {
      const nombreCompleto = `${p.nombre} ${p.apellido}`.toLowerCase();
      const apellidoNombre = `${p.apellido} ${p.nombre}`.toLowerCase(); // busca "García Ana" también
      return (
        nombreCompleto.includes(q) ||
        apellidoNombre.includes(q) ||
        p.documento.toLowerCase().includes(q) ||
        p.telefono.includes(q) ||
        (p.email?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [pacientes, debouncedQuery]);

  const calcularEdad = (fechaNacimiento: string) => {
    const hoy = new Date();
    const fecha = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - fecha.getFullYear();
    const mes = hoy.getMonth() - fecha.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) edad--;
    return edad;
  };

  const hayBusqueda = debouncedQuery.trim().length > 0;

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* ENCABEZADO */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-heading font-bold text-concreto">Pacientes</h1>
              <p className="text-marengo mt-1">Gestión de pacientes y fichas clínicas</p>
            </div>
            <Link href="/pacientes/nuevo" className="btn-primary-prominent">
              Nuevo Paciente
            </Link>
          </div>

          {/* ─── BUSCADOR ─────────────────────────────────────────────────── */}
          <div className="relative">
            {/* Ícono lupa */}
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-marengo pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, apellido, documento o teléfono..."
              className="w-full pl-12 pr-12 py-3 rounded-lg border border-[#D7C5B9]
                         focus:border-morena focus:ring-2 focus:ring-piel/20
                         transition-all outline-none bg-white text-concreto"
            />

            {/* Botón limpiar — solo aparece si hay texto */}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2
                           text-marengo hover:text-concreto transition-colors"
                aria-label="Limpiar búsqueda"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Contador de resultados — solo cuando hay búsqueda activa */}
          {hayBusqueda && !isLoading && (
            <p className="text-sm text-marengo -mt-2">
              {pacientesFiltrados.length === 0
                ? 'No se encontraron pacientes'
                : `${pacientesFiltrados.length} paciente${pacientesFiltrados.length !== 1 ? 's' : ''} encontrado${pacientesFiltrados.length !== 1 ? 's' : ''}`}
            </p>
          )}
          {/* ──────────────────────────────────────────────────────────────── */}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="card p-8 text-center">
              <div className="w-16 h-16 border-4 border-piel border-t-morena rounded-lg animate-spin mx-auto" />
              <p className="text-marengo mt-4">Cargando pacientes...</p>
            </div>

          ) : pacientesFiltrados.length === 0 ? (
            <div className="card p-8 text-center">
              {hayBusqueda ? (
                // Sin resultados de búsqueda
                <>
                  <p className="text-marengo">
                    No hay pacientes que coincidan con{' '}
                    <span className="font-medium text-concreto">"{debouncedQuery}"</span>
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="inline-block mt-4 px-6 py-2 border border-[#D7C5B9]
                               text-marengo rounded-lg hover:bg-piel/10 transition-all"
                  >
                    Limpiar búsqueda
                  </button>
                </>
              ) : (
                // Lista vacía (sin pacientes registrados)
                <>
                  <p className="text-marengo">No hay pacientes registrados</p>
                  <Link
                    href="/pacientes/nuevo"
                    className="inline-block mt-4 px-6 py-2 bg-morena text-white
                               rounded-lg hover:bg-morena/90 transition-all"
                  >
                    Crear primer paciente
                  </Link>
                </>
              )}
            </div>

          ) : (
            <div className="card card-no-padding overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-marengo uppercase tracking-wider">Paciente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-marengo uppercase tracking-wider">Documento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-marengo uppercase tracking-wider">Edad</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-marengo uppercase tracking-wider">Teléfono</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-marengo uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-marengo uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pacientesFiltrados.map((paciente) => (
                    <tr key={paciente.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-lg bg-piel/20 flex items-center justify-center">
                            <span className="text-morena font-medium">
                              {paciente.nombre[0]}{paciente.apellido[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-concreto">
                              {paciente.nombre} {paciente.apellido}
                            </div>
                            {paciente.email && (
                              <div className="text-sm text-marengo">{paciente.email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-concreto">{paciente.tipoDocumento}</div>
                        <div className="text-sm text-marengo">{paciente.documento}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-concreto">
                        {calcularEdad(paciente.fechaNacimiento)} años
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-marengo">
                        {paciente.telefono}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-lg text-sm ${
                          paciente.estado === 'ACTIVO'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {paciente.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/pacientes/${paciente.id}/historia`}
                            className="w-12 h-12 rounded-full bg-[#FEF4E4]
                                      flex items-center justify-center
                                      hover:scale-105 transition-all"
                          >
                            <ClipboardIcon
                              color="#5A350F"
                              className="w-6 h-6"
                            />
                          </Link>
                          <Link
                            href={`/pacientes/${paciente.id}`}
                            className="w-12 h-12 rounded-full bg-[#EEEAE7]
                                      flex items-center justify-center
                                      hover:scale-105 transition-all"
                          >
                            <EditIcon />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}