'use client';
import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
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

function toMinutes(hora: string): number {
  if (!hora) return 0;
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}
function hayConflicto(ni: string, nf: string, ei: string, ef: string): boolean {
  return toMinutes(ni) < toMinutes(ef) && toMinutes(nf) > toMinutes(ei);
}

function FormularioEditarCita() {
  const router = useRouter();
  const params = useParams();
  const citaId = params.id as string;
  const { token } = useAuth();

  const [isFetching, setIsFetching] = useState(true);  // carga inicial
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loadingPacientes, setLoadingPacientes] = useState(true);
  const [fechaLabel, setFechaLabel] = useState('');
  const [citasDelDia, setCitasDelDia] = useState<CitaDelDia[]>([]);
  const [loadingCitas, setLoadingCitas] = useState(false);
  const [conflicto, setConflicto] = useState<CitaDelDia | null>(null);
  const initialized = useRef(false);

  const [formData, setFormData] = useState({
    pacienteId: '',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    motivo: '',
    estado: 'PROGRAMADA',
    notas: '',
  });

  // ── 1. Cargar datos de la cita ───────────────────────────────────────────
  useEffect(() => {
    if (!token || !citaId) return;
    const loadCita = async () => {
      try {
        const response = await fetch(apiEndpoint(`/citas/${citaId}`), {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('No se pudo cargar la cita');
        const data = await response.json();
        const c = data.data ?? data;
        setFormData({
          pacienteId:  c.pacienteId ?? '',
          fecha:       c.fecha?.split('T')[0] ?? '',
          horaInicio:  c.horaInicio?.slice(0, 5) ?? '',
          horaFin:     c.horaFin?.slice(0, 5) ?? '',
          motivo:      c.motivo ?? '',
          estado:      c.estado ?? 'PROGRAMADA',
          notas:       c.notas ?? '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar la cita');
      } finally {
        setIsFetching(false);
      }
    };
    loadCita();
  }, [token, citaId]);

  // ── 2. Cargar pacientes ──────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    const fetchPacientes = async () => {
      try {
        const response = await fetch(apiEndpoint('/pacientes'), {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error();
        const data = await response.json();
        setPacientes(data.data.filter((p: Paciente) => p.estado === 'ACTIVO'));
      } catch { /* silencioso */ }
      finally { setLoadingPacientes(false); }
    };
    fetchPacientes();
  }, [token]);

  // ── 3. Cargar citas del día (excluyendo la que estamos editando) ─────────
  useEffect(() => {
    if (!token || !formData.fecha) return;
    const fetchCitasDelDia = async () => {
      setLoadingCitas(true);
      try {
        const response = await fetch(apiEndpoint(`/citas?fecha=${formData.fecha}`), {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error();
        const data = await response.json();
        const citasValidas = (data.data as CitaDelDia[]).filter(
          c => c.estado !== 'CANCELADA' &&
               toMinutes(c.horaInicio) >= 6 * 60 &&
               c.id !== citaId  // ← excluye la cita actual del detector
        );
        setCitasDelDia(citasValidas);
      } catch { setCitasDelDia([]); }
      finally { setLoadingCitas(false); }
    };
    fetchCitasDelDia();
  }, [token, formData.fecha, citaId]);

  const actualizarFechaLabel = useCallback((fechaString: string) => {
    if (!fechaString) { setFechaLabel(''); return; }
    const [y, m, d] = fechaString.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (!isNaN(dateObj.getTime())) setFechaLabel(DIAS_SEMANA[dateObj.getDay()]);
    else setFechaLabel('');
  }, []);

  useEffect(() => {
    if (!initialized.current && formData.fecha) {
      actualizarFechaLabel(formData.fecha);
      initialized.current = true;
    }
  }, [formData.fecha, actualizarFechaLabel]);

  // Detector de conflicto en tiempo real
  useEffect(() => {
    if (!formData.horaInicio || !formData.horaFin || citasDelDia.length === 0) {
      setConflicto(null);
      return;
    }
    const cita = citasDelDia.find(c =>
      hayConflicto(formData.horaInicio, formData.horaFin, c.horaInicio, c.horaFin)
    );
    setConflicto(cita || null);
  }, [formData.horaInicio, formData.horaFin, citasDelDia]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setError('');
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'fecha') actualizarFechaLabel(value);
  };

  // ── 4. Submit usa PUT ────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (conflicto) return;
    setError('');
    setIsLoading(true);
    try {
      const response = await fetch(apiEndpoint(`/citas/${citaId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          horaInicio: formData.horaInicio.slice(0, 5),
          horaFin: formData.horaFin.slice(0, 5),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.message || 'Error al actualizar la cita');
      router.push('/citas');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  // Spinner mientras carga la cita
  if (isFetching) {
    return (
      <div className="card p-8 text-center max-w-3xl">
        <div className="w-12 h-12 border-4 border-piel border-t-morena rounded-lg animate-spin mx-auto" />
        <p className="text-marengo mt-4">Cargando datos de la cita...</p>
      </div>
    );
  }

  const TIMELINE_START = 7 * 60;
  const TIMELINE_END   = 21 * 60;
  const TIMELINE_TOTAL = TIMELINE_END - TIMELINE_START;
  const pct = (min: number) => Math.max(0, Math.min(100, ((min - TIMELINE_START) / TIMELINE_TOTAL) * 100));
  const nuevaInicioMin = toMinutes(formData.horaInicio);
  const nuevaFinMin    = toMinutes(formData.horaFin);
  const nuevaValida    = formData.horaInicio && formData.horaFin && nuevaFinMin > nuevaInicioMin;

  const ESTADO_OPTIONS = [
    { value: 'PROGRAMADA', label: 'Pendiente' },
    { value: 'CONFIRMADA', label: 'Confirmada' },
    { value: 'EN_CURSO',   label: 'En curso' },
    { value: 'COMPLETADA', label: 'Completada' },
    { value: 'CANCELADA',  label: 'Cancelada' },
    { value: 'NO_ASISTIO', label: 'No asistió' },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/citas" className="text-marengo hover:text-concreto">← Volver</Link>
        <div>
          <h1 className="text-3xl font-heading font-bold text-concreto">Editar Cita</h1>
          <p className="text-marengo mt-1">Modifica los datos de la cita</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {conflicto && (
        <div className="relative overflow-hidden rounded-xl border-2 border-amber-400 bg-amber-50 p-5">
          <div className="absolute left-0 top-0 h-full w-1.5 bg-amber-400" />
          <div className="pl-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⚠️</span>
              <p className="text-sm font-bold text-amber-800">Horario ocupado</p>
            </div>
            <p className="text-sm text-amber-700">
              Ya existe una cita de <strong>{conflicto.horaInicio} a {conflicto.horaFin}</strong> con{' '}
              <strong>{conflicto.paciente?.nombre} {conflicto.paciente?.apellido}</strong>{' '}
              por: <em>{conflicto.motivo}</em>.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-8 space-y-6">
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
              {pacientes.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nombre} {p.apellido} – {p.tipoDocumento}: {p.documento}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Estado — extra que no tiene el formulario de nueva */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-concreto">Estado de la cita</label>
          <select
            name="estado"
            value={formData.estado}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-marengo/30 focus:border-morena focus:ring-2 focus:ring-piel/20 transition-all outline-none"
            disabled={isLoading}
          >
            {ESTADO_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
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
              className={`w-full px-4 py-3 rounded-lg border transition-all outline-none ${
                conflicto ? 'border-amber-400 bg-amber-50' : 'border-marengo/30 focus:border-morena focus:ring-2 focus:ring-piel/20'
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
              className={`w-full px-4 py-3 rounded-lg border transition-all outline-none ${
                conflicto ? 'border-amber-400 bg-amber-50' : 'border-marengo/30 focus:border-morena focus:ring-2 focus:ring-piel/20'
              }`}
              required
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Línea de tiempo */}
        {formData.fecha && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-concreto">Disponibilidad del día</label>
              {loadingCitas && <span className="text-xs text-marengo animate-pulse">Cargando horarios...</span>}
              {!loadingCitas && citasDelDia.length === 0 && (
                <span className="text-xs text-green-600 font-medium">✓ Día libre</span>
              )}
            </div>
            <div className="relative rounded-lg bg-green-50 border border-gray-200 overflow-hidden" style={{ height: '48px' }}>
              {citasDelDia.map(cita => {
                const left  = pct(toMinutes(cita.horaInicio));
                const width = pct(toMinutes(cita.horaFin)) - left;
                return (
                  <div
                    key={cita.id}
                    title={`${cita.horaInicio}–${cita.horaFin}: ${cita.paciente?.nombre}`}
                    className="absolute top-0 h-full bg-red-200 border-l-2 border-red-400 flex items-center overflow-hidden"
                    style={{ left: `${left}%`, width: `${Math.max(width, 1)}%` }}
                  >
                    <span className="px-1 text-[9px] font-semibold text-red-700 truncate">{cita.horaInicio}</span>
                  </div>
                );
              })}
              {nuevaValida && (
                <div
                  className={`absolute top-0 h-full border-l-2 flex items-center ${
                    conflicto ? 'bg-amber-300/70 border-amber-500' : 'bg-[#60412B]/20 border-[#60412B]'
                  }`}
                  style={{ left: `${pct(nuevaInicioMin)}%`, width: `${Math.max(pct(nuevaFinMin) - pct(nuevaInicioMin), 1)}%` }}
                >
                  <span className={`px-1 text-[9px] font-bold ${conflicto ? 'text-amber-800' : 'text-[#60412B]'}`}>
                    Editando
                  </span>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
                {[7, 9, 11, 13, 15, 17, 19, 21].map(h => (
                  <span key={h} className="text-[8px] text-gray-400 font-mono">{h}:00</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Motivo */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-concreto">Motivo *</label>
          <input
            type="text"
            name="motivo"
            value={formData.motivo}
            onChange={handleChange}
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
            className="w-full px-4 py-3 rounded-lg border border-marengo/30 focus:border-morena focus:ring-2 focus:ring-piel/20 transition-all outline-none resize-none"
            disabled={isLoading}
          />
        </div>

        {/* Botones */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isLoading || !!conflicto}
            className={`btn-primary transition-all ${conflicto ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Actualizando...' : 'Actualizar Cita'}  {/* ← texto diferente */}
          </button>
          <Link href="/citas" className="btn-secondary">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}

export default function EditarCitaPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Suspense fallback={<div className="text-sm text-marengo">Cargando...</div>}>
          <FormularioEditarCita />
        </Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  );
}