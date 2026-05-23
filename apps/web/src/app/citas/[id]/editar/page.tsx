'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { FormSection, FormField } from '@/components/forms/FormSection';
import { api } from '@/lib/api';
import DatePicker from '@/components/ui/DatePicker';

const inputBase =
  'w-full h-10 px-3 rounded-md border border-[var(--neutral-300)] bg-white text-sm text-[var(--neutral-800)] focus:outline-none focus:border-[var(--brand-morena)] focus:ring-[3px] focus:ring-[rgba(117,76,36,0.12)] transition-colors disabled:bg-[var(--neutral-50)]';
const textareaBase =
  'w-full px-3 py-2.5 rounded-md border border-[var(--neutral-300)] bg-white text-sm text-[var(--neutral-800)] focus:outline-none focus:border-[var(--brand-morena)] focus:ring-[3px] focus:ring-[rgba(117,76,36,0.12)] transition-colors resize-none disabled:bg-[var(--neutral-50)]';
const inputConflict =
  'w-full h-10 px-3 rounded-md border border-[var(--semantic-warning)] bg-[var(--semantic-warning-bg)] text-sm text-[var(--neutral-800)] focus:outline-none focus:ring-[3px] focus:ring-[rgba(196,135,40,0.18)] transition-colors';

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

const ESTADO_OPTIONS = [
  { value: 'PROGRAMADA', label: 'Programada' },
  { value: 'CONFIRMADA', label: 'Confirmada' },
  { value: 'EN_CURSO', label: 'En curso' },
  { value: 'COMPLETADA', label: 'Completada' },
  { value: 'CANCELADA', label: 'Cancelada' },
  { value: 'NO_ASISTIO', label: 'No asistió' },
];

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

  const [isFetching, setIsFetching] = useState(true);
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

  useEffect(() => {
    if (!citaId) return;
    const loadCita = async () => {
      try {
        const c = await api.get<Record<string, string>>(`/citas/${citaId}`);
        setFormData({
          pacienteId: c.pacienteId ?? '',
          fecha: c.fecha?.split('T')[0] ?? '',
          horaInicio: c.horaInicio?.slice(0, 5) ?? '',
          horaFin: c.horaFin?.slice(0, 5) ?? '',
          motivo: c.motivo ?? '',
          estado: c.estado ?? 'PROGRAMADA',
          notas: c.notas ?? '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar la cita');
      } finally {
        setIsFetching(false);
      }
    };
    loadCita();
  }, [citaId]);

  useEffect(() => {
    const fetchPacientes = async () => {
      try {
        const data = await api.get<Paciente[]>('/pacientes');
        setPacientes(data.filter((p) => p.estado === 'ACTIVO'));
      } catch { /* noop */ }
      finally { setLoadingPacientes(false); }
    };
    fetchPacientes();
  }, []);

  useEffect(() => {
    if (!formData.fecha) return;
    const fetchCitasDelDia = async () => {
      setLoadingCitas(true);
      try {
        const data = await api.get<CitaDelDia[]>('/citas', { params: { fecha: formData.fecha } });
        const citasValidas = data.filter(
          (c) => c.estado !== 'CANCELADA' && toMinutes(c.horaInicio) >= 6 * 60 && c.id !== citaId
        );
        setCitasDelDia(citasValidas);
      } catch { setCitasDelDia([]); }
      finally { setLoadingCitas(false); }
    };
    fetchCitasDelDia();
  }, [formData.fecha, citaId]);

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

  useEffect(() => {
    if (!formData.horaInicio || !formData.horaFin || citasDelDia.length === 0) {
      setConflicto(null);
      return;
    }
    const cita = citasDelDia.find((c) =>
      hayConflicto(formData.horaInicio, formData.horaFin, c.horaInicio, c.horaFin)
    );
    setConflicto(cita || null);
  }, [formData.horaInicio, formData.horaFin, citasDelDia]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setError('');
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'fecha') actualizarFechaLabel(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (conflicto) return;
    setError('');
    setIsLoading(true);
    try {
      await api.put(`/citas/${citaId}`, {
        ...formData,
        horaInicio: formData.horaInicio.slice(0, 5),
        horaFin: formData.horaFin.slice(0, 5),
      });
      router.push('/citas');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-sm text-[var(--neutral-500)]">
        Cargando datos de la cita...
      </div>
    );
  }

  const TIMELINE_START = 7 * 60;
  const TIMELINE_END = 21 * 60;
  const TIMELINE_TOTAL = TIMELINE_END - TIMELINE_START;
  const pct = (min: number) => Math.max(0, Math.min(100, ((min - TIMELINE_START) / TIMELINE_TOTAL) * 100));
  const nuevaInicioMin = toMinutes(formData.horaInicio);
  const nuevaFinMin = toMinutes(formData.horaFin);
  const nuevaValida = formData.horaInicio && formData.horaFin && nuevaFinMin > nuevaInicioMin;

  return (
    <div className="max-w-4xl">
      <PageHeader
        overline="Citas"
        title="Editar cita"
        subtitle="Modifica los datos de la cita verificando disponibilidad"
        backHref="/citas"
      />

      {error && (
        <div className="mb-5 rounded-md border border-[rgba(181,58,58,0.2)] bg-[var(--semantic-danger-bg)] px-4 py-3 text-sm text-[var(--semantic-danger)]">
          {error}
        </div>
      )}

      {conflicto && (
        <div className="mb-5 rounded-md border border-[var(--semantic-warning)] bg-[var(--semantic-warning-bg)] px-4 py-3">
          <p className="text-sm font-medium text-[var(--neutral-900)]">Horario ocupado</p>
          <p className="mt-1 text-sm text-[var(--neutral-700)]">
            Ya existe una cita de <strong>{conflicto.horaInicio} a {conflicto.horaFin}</strong>{' '}
            con <strong>{conflicto.paciente?.nombre} {conflicto.paciente?.apellido}</strong> · {conflicto.motivo}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <FormSection title="Datos de la cita">
          <FormField label="Paciente" required>
            {loadingPacientes ? (
              <div className="text-sm text-[var(--neutral-500)]">Cargando pacientes...</div>
            ) : (
              <select
                name="pacienteId"
                value={formData.pacienteId}
                onChange={handleChange}
                className={inputBase}
                required
                disabled={isLoading}
              >
                <option value="">Seleccione un paciente</option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} {p.apellido} — {p.tipoDocumento}: {p.documento}
                  </option>
                ))}
              </select>
            )}
          </FormField>

          <FormField label="Estado de la cita">
            <select
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              className={inputBase}
              disabled={isLoading}
            >
              {ESTADO_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="Fecha" required hint={fechaLabel || undefined}>
              <DatePicker
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </FormField>
            <FormField label="Hora inicio" required>
              <input
                type="time"
                name="horaInicio"
                value={formData.horaInicio}
                onChange={handleChange}
                className={conflicto ? inputConflict : inputBase}
                required
                disabled={isLoading}
              />
            </FormField>
            <FormField label="Hora fin" required>
              <input
                type="time"
                name="horaFin"
                value={formData.horaFin}
                onChange={handleChange}
                className={conflicto ? inputConflict : inputBase}
                required
                disabled={isLoading}
              />
            </FormField>
          </div>

          {formData.fecha && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[var(--neutral-700)]">Disponibilidad del día</span>
                {loadingCitas && <span className="text-xs text-[var(--neutral-500)]">Cargando...</span>}
                {!loadingCitas && citasDelDia.length === 0 && (
                  <span className="text-xs font-medium text-[var(--semantic-success)]">Día libre</span>
                )}
                {!loadingCitas && citasDelDia.length > 0 && (
                  <span className="text-xs font-medium text-[var(--neutral-600)]">
                    {citasDelDia.length} cita{citasDelDia.length > 1 ? 's' : ''} agendada{citasDelDia.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="relative rounded-md border border-[var(--neutral-200)] overflow-hidden" style={{ height: '40px' }}>
                <div className="absolute inset-0 bg-[var(--neutral-50)]" />
                {citasDelDia.map((cita) => {
                  const inicioMin = toMinutes(cita.horaInicio);
                  const finMin = toMinutes(cita.horaFin);
                  if (inicioMin < TIMELINE_START || finMin > TIMELINE_END) return null;
                  const left = pct(inicioMin);
                  const width = pct(finMin) - left;
                  return (
                    <div
                      key={cita.id}
                      title={`${cita.horaInicio}–${cita.horaFin}: ${cita.paciente?.nombre}`}
                      className="absolute top-0 h-full bg-[var(--neutral-300)] border-l-2 border-[var(--neutral-500)] flex items-center overflow-hidden"
                      style={{ left: `${left}%`, width: `${Math.max(width, 1)}%` }}
                    >
                      <span className="px-1 text-[9px] font-medium text-[var(--neutral-700)] truncate">{cita.horaInicio}</span>
                    </div>
                  );
                })}
                {nuevaValida && (() => {
                  const left = pct(nuevaInicioMin);
                  const width = pct(nuevaFinMin) - left;
                  return (
                    <div
                      className={`absolute top-0 h-full border-l-2 flex items-center overflow-hidden transition-all ${
                        conflicto
                          ? 'bg-[var(--semantic-warning-bg)] border-[var(--semantic-warning)]'
                          : 'bg-[rgba(117,76,36,0.18)] border-[var(--brand-morena)]'
                      }`}
                      style={{ left: `${left}%`, width: `${Math.max(width, 1)}%` }}
                    >
                      <span className={`px-1 text-[9px] font-semibold truncate ${conflicto ? 'text-[var(--neutral-900)]' : 'text-[var(--brand-morena-dark)]'}`}>
                        Editando
                      </span>
                    </div>
                  );
                })()}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
                  {[7, 9, 11, 13, 15, 17, 19, 21].map((h) => (
                    <span key={h} className="text-[8px] text-[var(--neutral-400)] font-mono">{h}:00</span>
                  ))}
                </div>
              </div>
              {!loadingCitas && citasDelDia.length > 0 && (
                <div className="mt-2 space-y-1">
                  {citasDelDia.map((cita) => (
                    <div
                      key={cita.id}
                      className="flex items-center gap-3 px-3 py-1.5 rounded-md bg-[var(--neutral-50)] border border-[var(--neutral-100)] text-xs"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--neutral-500)] flex-shrink-0" />
                      <span className="font-mono font-medium text-[var(--neutral-700)]">
                        {cita.horaInicio} – {cita.horaFin}
                      </span>
                      <span className="text-[var(--neutral-600)]">
                        {cita.paciente?.nombre} {cita.paciente?.apellido}
                      </span>
                      <span className="text-[var(--neutral-400)] truncate">· {cita.motivo}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </FormSection>

        <FormSection title="Detalles">
          <FormField label="Motivo de la cita" required>
            <input
              type="text"
              name="motivo"
              value={formData.motivo}
              onChange={handleChange}
              className={inputBase}
              required
              disabled={isLoading}
            />
          </FormField>
          <FormField label="Notas u observaciones">
            <textarea
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              rows={3}
              className={textareaBase}
              disabled={isLoading}
            />
          </FormField>
        </FormSection>

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/citas"
            className="h-10 px-4 inline-flex items-center rounded-md border border-[var(--neutral-300)] text-sm font-medium text-[var(--neutral-700)] hover:bg-[var(--neutral-50)] transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isLoading || !!conflicto}
            className="h-10 px-5 inline-flex items-center rounded-md bg-[var(--brand-morena)] text-sm font-medium text-white hover:bg-[var(--brand-morena-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Actualizando...' : 'Actualizar cita'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function EditarCitaPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Suspense fallback={<div className="text-sm text-[var(--neutral-500)]">Cargando...</div>}>
          <FormularioEditarCita />
        </Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
