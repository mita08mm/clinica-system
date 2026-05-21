'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  estado: string;
}

interface CitaDelDia {
  id: string;
  horaInicio: string;
  horaFin: string;
  motivo: string;
  estado: string;
  paciente: { nombre: string; apellido: string };
}

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Convierte "HH:MM" a minutos desde medianoche
function toMinutes(hora: string): number {
  if (!hora) return 0;
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

// Verifica si dos rangos de tiempo se solapan
function hayConflicto(
  nuevaInicio: string,
  nuevaFin: string,
  existenteInicio: string,
  existenteFin: string
): boolean {
  const ni = toMinutes(nuevaInicio);
  const nf = toMinutes(nuevaFin);
  const ei = toMinutes(existenteInicio);
  const ef = toMinutes(existenteFin);
  return ni < ef && nf > ei;
}

function FormularioNuevaCita() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loadingPacientes, setLoadingPacientes] = useState(true);
  const [fechaLabel, setFechaLabel] = useState('');
  const [citasDelDia, setCitasDelDia] = useState<CitaDelDia[]>([]);
  const [loadingCitas, setLoadingCitas] = useState(false);
  const [conflicto, setConflicto] = useState<CitaDelDia | null>(null);

  const [formData, setFormData] = useState({
    pacienteId: '',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    motivo: '',
    notas: '',
  });

  // Cargar parámetros de URL
  useEffect(() => {
    const fechaParam = searchParams.get('fecha');
    const horaParam = searchParams.get('hora');

    let inicialHoraInicio = '';
    let inicialHoraFin = '';

    if (horaParam) {
      inicialHoraInicio = horaParam.slice(0, 5);
      const [h, m] = inicialHoraInicio.split(':').map(Number);
      inicialHoraFin = `${String((h + 1) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    setFormData((prev) => ({
      ...prev,
      fecha: fechaParam || prev.fecha,
      horaInicio: inicialHoraInicio || prev.horaInicio,
      horaFin: inicialHoraFin || prev.horaFin,
    }));

    if (fechaParam) actualizarFechaLabel(fechaParam);
  }, [searchParams]);

  // Cargar pacientes
  useEffect(() => {
    if (!token) return;
    const fetchPacientes = async () => {
      try {
        const response = await fetch(apiEndpoint('/pacientes'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Error al cargar pacientes');
        const data = await response.json();
        setPacientes(data.data.filter((p: Paciente) => p.estado === 'ACTIVO'));
      } catch (err) {
        console.error('Error cargando pacientes:', err);
      } finally {
        setLoadingPacientes(false);
      }
    };
    fetchPacientes();
  }, [token]);

  // Cargar citas del día cuando cambia la fecha
  useEffect(() => {
    if (!token || !formData.fecha) {
      setCitasDelDia([]);
      return;
    }
    const fetchCitasDelDia = async () => {
      setLoadingCitas(true);
      try {
        const response = await fetch(apiEndpoint(`/citas?fecha=${formData.fecha}`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Error al cargar citas');
        const data = await response.json();
        // Filtrar citas válidas (no canceladas, horas normales)
        const citasValidas = (data.data as CitaDelDia[]).filter(
          (c) => c.estado !== 'CANCELADA' && toMinutes(c.horaInicio) >= 6 * 60
        );
        setCitasDelDia(citasValidas);
      } catch (err) {
        console.error('Error cargando citas del día:', err);
        setCitasDelDia([]);
      } finally {
        setLoadingCitas(false);
      }
    };
    fetchCitasDelDia();
  }, [token, formData.fecha]);

  // Detectar conflicto en tiempo real
  useEffect(() => {
    if (!formData.horaInicio || !formData.horaFin || citasDelDia.length === 0) {
      setConflicto(null);
      return;
    }
    const citaConflicto = citasDelDia.find((c) =>
      hayConflicto(formData.horaInicio, formData.horaFin, c.horaInicio, c.horaFin)
    );
    setConflicto(citaConflicto || null);
  }, [formData.horaInicio, formData.horaFin, citasDelDia]);

  const actualizarFechaLabel = (fechaString: string) => {
    if (!fechaString) { setFechaLabel(''); return; }
    const [year, month, day] = fechaString.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    if (!isNaN(dateObj.getTime())) setFechaLabel(DIAS_SEMANA[dateObj.getDay()]);
    else setFechaLabel('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setError('');
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'fecha') actualizarFechaLabel(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (conflicto) return; // doble seguro
    setError('');
    setIsLoading(true);

    const payload = {
      ...formData,
      horaInicio: formData.horaInicio.slice(0, 5),
      horaFin: formData.horaFin.slice(0, 5),
    };

    try {
      const response = await fetch(apiEndpoint('/citas'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.message || 'Error al procesar la cita.');
      router.push('/citas');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido.');
    } finally {
      setIsLoading(false);
    }
  };

  const localDate = new Date();
  const hoyStr = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;

  // Para la visualización de línea de tiempo (7am - 9pm = 840 minutos total)
  const TIMELINE_START = 7 * 60;  // 7:00
  const TIMELINE_END = 21 * 60;   // 21:00
  const TIMELINE_TOTAL = TIMELINE_END - TIMELINE_START;

  function pct(minutos: number) {
    return Math.max(0, Math.min(100, ((minutos - TIMELINE_START) / TIMELINE_TOTAL) * 100));
  }

  const mostrarTimeline = formData.fecha && citasDelDia.length > 0;
  const nuevaInicioMin = toMinutes(formData.horaInicio);
  const nuevaFinMin = toMinutes(formData.horaFin);
  const nuevaValida = formData.horaInicio && formData.horaFin && nuevaFinMin > nuevaInicioMin;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/citas" className="text-marengo hover:text-concreto">← Volver</Link>
        <div>
          <h1 className="text-3xl font-heading font-bold text-concreto">Nueva Cita</h1>
          <p className="text-marengo mt-1">Programa una nueva cita médica</p>
        </div>
      </div>

      {/* Error genérico del servidor */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* ── ADVERTENCIA DE CONFLICTO ── */}
      {conflicto && (
        <div className="relative overflow-hidden rounded-xl border-2 border-amber-400 bg-amber-50 p-5">
          {/* franja decorativa */}
          <div className="absolute left-0 top-0 h-full w-1.5 bg-amber-400" />
          <div className="pl-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⚠️</span>
              <p className="text-sm font-bold text-amber-800">Horario ocupado</p>
            </div>
            <p className="text-sm text-amber-700">
              Ya existe una cita de{' '}
              <strong>{conflicto.horaInicio} a {conflicto.horaFin}</strong>{' '}
              con <strong>{conflicto.paciente?.nombre} {conflicto.paciente?.apellido}</strong>{' '}
              por: <em>{conflicto.motivo}</em>.
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Elige otro horario para continuar.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-8 space-y-6">

        {/* Paciente */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-concreto">Paciente *</label>
          {loadingPacientes ? (
            <div className="text-sm text-marengo">Cargando pacientes...</div>
          ) : (
            <select
              name="pacienteId"
              value={formData.pacienteId}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-marengo/30 focus:border-morena focus:ring-2 focus:ring-piel/20 transition-all outline-none"
              required
              disabled={isLoading}
            >
              <option value="">Seleccione un paciente</option>
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} {p.apellido} - {p.tipoDocumento}: {p.documento}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Fecha + Horas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-concreto">Fecha *</label>
              {fechaLabel && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#FBF7F4] text-[#60412B] border border-[#60412B]/20">
                  {fechaLabel}
                </span>
              )}
            </div>
            <input
              type="date"
              name="fecha"
              value={formData.fecha}
              onChange={handleChange}
              min={hoyStr}
              className="w-full px-4 py-3 rounded-lg border border-marengo/30 focus:border-morena focus:ring-2 focus:ring-piel/20 transition-all outline-none"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-concreto">Hora de Inicio *</label>
            <input
              type="time"
              name="horaInicio"
              value={formData.horaInicio}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-lg border transition-all outline-none
                ${conflicto
                  ? 'border-amber-400 bg-amber-50 focus:ring-2 focus:ring-amber-200'
                  : 'border-marengo/30 focus:border-morena focus:ring-2 focus:ring-piel/20'
                }`}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-concreto">Hora de Fin *</label>
            <input
              type="time"
              name="horaFin"
              value={formData.horaFin}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-lg border transition-all outline-none
                ${conflicto
                  ? 'border-amber-400 bg-amber-50 focus:ring-2 focus:ring-amber-200'
                  : 'border-marengo/30 focus:border-morena focus:ring-2 focus:ring-piel/20'
                }`}
              required
              disabled={isLoading}
            />
          </div>
        </div>

        {/* ── LÍNEA DE TIEMPO DEL DÍA ── */}
        {formData.fecha && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-concreto">
                Disponibilidad del día
              </label>
              {loadingCitas && (
                <span className="text-xs text-marengo animate-pulse">Cargando horarios...</span>
              )}
              {!loadingCitas && citasDelDia.length === 0 && (
                <span className="text-xs text-green-600 font-medium">✓ Día libre</span>
              )}
              {!loadingCitas && citasDelDia.length > 0 && (
                <span className="text-xs text-amber-600 font-medium">
                  {citasDelDia.length} cita{citasDelDia.length > 1 ? 's' : ''} agendada{citasDelDia.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="relative rounded-lg bg-gray-50 border border-gray-200 overflow-hidden" style={{ height: '48px' }}>
              {/* Fondo libre */}
              <div className="absolute inset-0 bg-green-50" />

              {/* Bloques de citas existentes */}
              {citasDelDia.map((cita) => {
                const inicioMin = toMinutes(cita.horaInicio);
                const finMin = toMinutes(cita.horaFin);
                if (inicioMin < TIMELINE_START || finMin > TIMELINE_END) return null;
                const left = pct(inicioMin);
                const width = pct(finMin) - left;
                return (
                  <div
                    key={cita.id}
                    title={`${cita.horaInicio}–${cita.horaFin}: ${cita.paciente?.nombre} (${cita.motivo})`}
                    className="absolute top-0 h-full bg-red-200 border-l-2 border-red-400 flex items-center overflow-hidden group cursor-default"
                    style={{ left: `${left}%`, width: `${Math.max(width, 1)}%` }}
                  >
                    <span className="px-1 text-[9px] font-semibold text-red-700 truncate whitespace-nowrap hidden group-hover:block">
                      {cita.horaInicio} {cita.paciente?.nombre}
                    </span>
                    <span className="px-1 text-[9px] font-semibold text-red-700 truncate whitespace-nowrap group-hover:hidden">
                      {cita.horaInicio}
                    </span>
                  </div>
                );
              })}

              {/* Bloque de la nueva cita (si está definida) */}
              {nuevaValida && (() => {
                const left = pct(nuevaInicioMin);
                const width = pct(nuevaFinMin) - left;
                return (
                  <div
                    className={`absolute top-0 h-full border-l-2 flex items-center overflow-hidden transition-all ${
                      conflicto
                        ? 'bg-amber-300/70 border-amber-500'
                        : 'bg-[#60412B]/20 border-[#60412B]'
                    }`}
                    style={{ left: `${left}%`, width: `${Math.max(width, 1)}%` }}
                  >
                    <span className={`px-1 text-[9px] font-bold truncate ${conflicto ? 'text-amber-800' : 'text-[#60412B]'}`}>
                      Nueva
                    </span>
                  </div>
                );
              })()}

              {/* Etiquetas de hora */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
                {[7, 9, 11, 13, 15, 17, 19, 21].map((h) => (
                  <span key={h} className="text-[8px] text-gray-400 font-mono">{h}:00</span>
                ))}
              </div>
            </div>

            {/* Lista de citas del día */}
            {!loadingCitas && citasDelDia.length > 0 && (
              <div className="space-y-1 mt-1">
                {citasDelDia.map((cita) => (
                  <div
                    key={cita.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                    <span className="font-mono font-semibold text-gray-700">
                      {cita.horaInicio} – {cita.horaFin}
                    </span>
                    <span className="text-gray-500">
                      {cita.paciente?.nombre} {cita.paciente?.apellido}
                    </span>
                    <span className="text-gray-400 truncate">· {cita.motivo}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Motivo */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-concreto">Motivo de la Cita *</label>
          <input
            type="text"
            name="motivo"
            value={formData.motivo}
            onChange={handleChange}
            placeholder="Ej: Consulta general..."
            className="w-full px-4 py-3 rounded-lg border border-marengo/30 focus:border-morena focus:ring-2 focus:ring-piel/20 transition-all outline-none"
            required
            disabled={isLoading}
          />
        </div>

        {/* Notas */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-concreto">Notas / Observaciones</label>
          <textarea
            name="notas"
            value={formData.notas}
            onChange={handleChange}
            rows={3}
            placeholder="Información adicional..."
            className="w-full px-4 py-3 rounded-lg border border-marengo/30 focus:border-morena focus:ring-2 focus:ring-piel/20 transition-all outline-none resize-none"
            disabled={isLoading}
          />
        </div>

        {/* Botones */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isLoading || pacientes.length === 0 || !!conflicto}
            className={`btn-primary transition-all ${
              conflicto
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
          >
            {isLoading ? 'Guardando...' : 'Agendar Cita'}
          </button>
          <Link href="/citas" className="btn-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}

export default function NuevaCitaPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Suspense fallback={<div className="text-sm text-marengo">Cargando parámetros...</div>}>
          <FormularioNuevaCita />
        </Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  );
}