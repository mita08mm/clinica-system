'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/shared/layout/PageHeader';
import { FormSection, FormField } from '@/shared/forms/FormSection';
import DatePicker from '@/shared/ui/DatePicker';
import {
  inputBase,
  textareaBase,
  inputConflict,
  alertError,
  alertWarning,
  Button,
  LinkButton,
} from '@/shared/ui';
import { api } from '@/shared/api';
import { diaSemanaLabel, hayConflicto, toMinutes } from '../lib/horario';
import { DisponibilidadTimeline, type CitaDelDia } from './DisponibilidadTimeline';
import { TimePicker, addOneHour } from '@/shared/ui/TimePicker';

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  documento: string;
  tipoDocumento: string;
  estado: string;
}

const ESTADO_OPTIONS = [
  { value: 'PROGRAMADA', label: 'Programada' },
  { value: 'CONFIRMADA', label: 'Confirmada' },
  { value: 'EN_CURSO', label: 'En curso' },
  { value: 'COMPLETADA', label: 'Completada' },
  { value: 'CANCELADA', label: 'Cancelada' },
  { value: 'NO_ASISTIO', label: 'No asistió' },
];

interface Props {
  mode: 'create' | 'edit';
  citaId?: string;
}

export function CitaForm({ mode, citaId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEdit = mode === 'edit';

  const [isFetching, setIsFetching] = useState(isEdit);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loadingPacientes, setLoadingPacientes] = useState(true);
  const [fechaLabel, setFechaLabel] = useState('');
  const [citasDelDia, setCitasDelDia] = useState<CitaDelDia[]>([]);
  const [loadingCitas, setLoadingCitas] = useState(false);
  const [conflicto, setConflicto] = useState<CitaDelDia | null>(null);
  const initialized = useRef(false);

  const [formData, setFormData] = useState(() => {
    if (isEdit) {
      return {
        pacienteId: searchParams.get('pacienteId') || '',
        fecha: '',
        horaInicio: '',
        horaFin: '',
        motivo: '',
        estado: 'PROGRAMADA',
        notas: '',
      };
    }
    const fechaParam = searchParams.get('fecha') || '';
    const horaParam = searchParams.get('hora');
    let horaInicio = '';
    let horaFin = '';
    if (horaParam) {
      horaInicio = horaParam.slice(0, 5);
      horaFin = addOneHour(horaInicio);
    }
    return {
      pacienteId: '',
      fecha: fechaParam,
      horaInicio,
      horaFin,
      motivo: '',
      estado: 'PROGRAMADA',
      notas: '',
    };
  });

  // Cargar cita en modo edición
  useEffect(() => {
    if (!isEdit || !citaId) return;
    (async () => {
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
    })();
  }, [isEdit, citaId]);

  // Cargar lista de pacientes activos
  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<Paciente[]>('/pacientes');
        setPacientes(data.filter((p) => p.estado === 'ACTIVO'));
      } catch {
        /* noop */
      } finally {
        setLoadingPacientes(false);
      }
    })();
  }, []);

  // Cargar citas del día seleccionado
  useEffect(() => {
    if (!formData.fecha) return;
    (async () => {
      setLoadingCitas(true);
      try {
        const data = await api.get<CitaDelDia[]>('/citas', { params: { fecha: formData.fecha } });
        const validas = data.filter(
          (c) => c.estado !== 'CANCELADA' && toMinutes(c.horaInicio) >= 6 * 60 && c.id !== citaId,
        );
        setCitasDelDia(validas);
      } catch {
        setCitasDelDia([]);
      } finally {
        setLoadingCitas(false);
      }
    })();
  }, [formData.fecha, citaId]);

  const actualizarFechaLabel = useCallback((fecha: string) => {
    setFechaLabel(diaSemanaLabel(fecha));
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
    const c = citasDelDia.find((x) =>
      hayConflicto(formData.horaInicio, formData.horaFin, x.horaInicio, x.horaFin),
    );
    setConflicto(c || null);
  }, [formData.horaInicio, formData.horaFin, citasDelDia]);

  useEffect(() => {
    const paramId = searchParams.get('pacienteId');
    if (paramId && !isEdit && pacientes.length > 0) {
      setFormData((prev) => ({ ...prev, pacienteId: paramId }));
    }
  }, [pacientes]);

  // handleChange unificado — también auto-calcula horaFin cuando cambia horaInicio
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setError('');
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'horaInicio') next.horaFin = addOneHour(value);
      return next;
    });
    if (name === 'fecha') actualizarFechaLabel(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (conflicto) return;
    setError('');
    setIsLoading(true);
    const payload = {
      ...formData,
      horaInicio: formData.horaInicio.slice(0, 5),
      horaFin: formData.horaFin.slice(0, 5),
    };
    try {
      if (isEdit && citaId) await api.put(`/citas/${citaId}`, payload);
      else await api.post('/citas', payload);
      router.push('/citas');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="subtitle flex min-h-[400px] items-center justify-center">
        Cargando datos de la cita...
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        overline="Citas"
        title={isEdit ? 'Editar cita' : 'Nueva cita'}
        subtitle={
          isEdit
            ? 'Modifica los datos de la cita verificando disponibilidad'
            : 'Programa una cita verificando disponibilidad del día'
        }
        backHref="/citas"
      />

      {error && <div className={`mb-5 ${alertError}`}>{error}</div>}

      {conflicto && (
        <div className={`mb-5 ${alertWarning}`}>
          <p className="body-strong text-neutral-900">Horario ocupado</p>
          <p className="body mt-1">
            Ya existe una cita de{' '}
            <strong>
              {conflicto.horaInicio} a {conflicto.horaFin}
            </strong>{' '}
            con{' '}
            <strong>
              {conflicto.paciente?.nombre} {conflicto.paciente?.apellido}
            </strong>{' '}
            · {conflicto.motivo}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <FormSection title="Datos de la cita">
          <FormField label="Paciente" required>
            {loadingPacientes ? (
              <div className="subtitle">Cargando pacientes...</div>
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

          {isEdit && (
            <FormField label="Estado de la cita">
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className={inputBase}
                disabled={isLoading}
              >
                {ESTADO_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </FormField>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField label="Fecha" required hint={fechaLabel || undefined}>
              <DatePicker
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                required
                disabled={isLoading}
                minDate={isEdit ? undefined : new Date()}
              />
            </FormField>

            <TimePicker
              label="Hora inicio"
              value={formData.horaInicio}
              onChange={(v) =>
                handleChange({ target: { name: 'horaInicio', value: v } } as React.ChangeEvent<HTMLInputElement>)
              }
              required
              disabled={isLoading}
              hasConflict={!!conflicto}
            />

            <TimePicker
              label="Hora fin"
              value={formData.horaFin}
              onChange={(v) =>
                handleChange({ target: { name: 'horaFin', value: v } } as React.ChangeEvent<HTMLInputElement>)
              }
              required
              disabled={isLoading}
              hasConflict={!!conflicto}
            />
          </div>

          {formData.fecha && (
            <DisponibilidadTimeline
              citas={citasDelDia}
              loading={loadingCitas}
              nuevaInicio={formData.horaInicio}
              nuevaFin={formData.horaFin}
              conflicto={!!conflicto}
              selectionLabel={isEdit ? 'Editando' : 'Nueva'}
            />
          )}
        </FormSection>

        <FormSection title="Detalles">
          <FormField label="Motivo de la cita" required>
            <input
              type="text"
              name="motivo"
              value={formData.motivo}
              onChange={handleChange}
              placeholder="Ej: Consulta general, control..."
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
              placeholder="Información adicional..."
              className={textareaBase}
              disabled={isLoading}
            />
          </FormField>
        </FormSection>

        <div className="flex items-center justify-end gap-3">
          <LinkButton href="/citas" variant="secondary" size="sm">
            Cancelar
          </LinkButton>
          <Button
            type="submit"
            disabled={isLoading || (!isEdit && pacientes.length === 0) || !!conflicto}
            variant="primary"
            size="sm"
          >
            {isLoading
              ? isEdit
                ? 'Actualizando...'
                : 'Guardando...'
              : isEdit
                ? 'Actualizar cita'
                : 'Agendar cita'}
          </Button>
        </div>
      </form>
    </div>
  );
}