'use client';

import { useState } from 'react';
import {
  BottomSheet,
  Button,
  CardTitle,
  CloseIcon,
  LinkButton,
} from '@/shared/ui';
import { api } from '@/shared/api';
import EditIcon from '@/shared/icons/EditIcon';
import TrashIcon from '@/shared/icons/TrashIcon';

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email?: string;
}

interface Cita {
  id: string;
  pacienteId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivo: string;
  estado: string;
  notas?: string;
  paciente: Paciente;
}

type Vista = 'month' | 'week' | 'day';

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];
const DIAS_CORTO = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
const HORAS = Array.from({ length: 15 }, (_, i) => i + 7); // 7am - 9pm

const ESTADO_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  PROGRAMADA: { bg: 'bg-[#FBF7F4]', text: 'text-[#60412B]', border: 'border-[#60412B]/20' },
  CONFIRMADA: { bg: 'bg-[#FBF7F4]', text: 'text-[#60412B]', border: 'border-[#60412B]/20' },
  EN_CURSO: { bg: 'bg-[#F2EAE4]', text: 'text-[#60412B]', border: 'border-[#60412B]/40' },
  COMPLETADA: { bg: 'bg-[#F5F5F5]', text: 'text-[#7A7A7A]', border: 'border-gray-200' },
  CANCELADA: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function parseHora(h: string): number {
  if (!h) return 0;
  const limpio = h.trim().toUpperCase();
  const esPM = limpio.includes('PM');
  const esAM = limpio.includes('AM');
  const soloNumeros = limpio.replace(/AM|PM/g, '').trim();
  const [strHora, strMinuto] = soloNumeros.split(':');
  let hora = Number(strHora) || 0;
  const minuto = Number(strMinuto) || 0;
  if (esPM && hora < 12) hora += 12;
  if (esAM && hora === 12) hora = 0;
  return hora + minuto / 60;
}

interface CalendarioCitasProps {
  citas: Cita[];
  onDiaClick?: (fecha: Date) => void;
}

export default function CalendarioCitas({ citas = [], onDiaClick }: CalendarioCitasProps) {
  const [vista, setVista] = useState<Vista>('month');
  const [cursor, setCursor] = useState(new Date());
  const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null);

  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');

  const cerrarDetalleCita = () => {
    setCitaSeleccionada(null);
    setConfirmandoEliminar(false);
    setErrorEliminar('');
  };

  const handleEliminar = async () => {
    if (!citaSeleccionada) return;
    setEliminando(true);
    setErrorEliminar('');
    try {
      await api.delete(`/citas/${citaSeleccionada.id}`);
      cerrarDetalleCita();
    } catch (err) {
      setErrorEliminar(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setEliminando(false);
    }
  };

  const citasPorDia = citas.reduce<Record<string, Cita[]>>((acc, cita) => {
    if (!cita.fecha) return acc;
    const key = cita.fecha.split('T')[0];
    if (!acc[key]) acc[key] = [];
    acc[key].push(cita);
    return acc;
  }, {});

  const hoy = new Date();
  const hoyKey = dateKey(hoy);

  function navegar(dir: number) {
    const d = new Date(cursor);
    if (vista === 'month') d.setMonth(d.getMonth() + dir);
    else if (vista === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setDate(d.getDate() + dir);
    setCursor(d);
  }

  function titulo() {
    if (vista === 'month') return `${MESES[cursor.getMonth()]} ${cursor.getFullYear()}`;
    if (vista === 'week') {
      const lun = inicioSemana(cursor);
      const dom = new Date(lun);
      dom.setDate(dom.getDate() + 6);
      return `${lun.getDate()} – ${dom.getDate()} ${MESES[lun.getMonth()]}`;
    }
    return `${cursor.getDate()} de ${MESES[cursor.getMonth()]}`;
  }

  function inicioSemana(d: Date) {
    const r = new Date(d);
    const dow = r.getDay();
    const diff = dow === 0 ? -6 : 1 - dow;
    r.setDate(r.getDate() + diff);
    return r;
  }

  function diasDelMes() {
    const primer = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const ultimo = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    const start = new Date(primer);
    const dow = start.getDay();
    start.setDate(start.getDate() - (dow === 0 ? 6 : dow - 1));
    const dias: Date[] = [];
    const d = new Date(start);
    while (d <= ultimo || dias.length % 7 !== 0) {
      dias.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return dias;
  }

  function diasDeSemana() {
    const lun = inicioSemana(cursor);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(lun);
      d.setDate(lun.getDate() + i);
      return d;
    });
  }

  function abrirDia(fecha: Date) {
    if (onDiaClick) {
      onDiaClick(fecha);
    } else {
      const key = dateKey(fecha);
      window.location.href = `/citas/nueva?fecha=${key}`;
    }
  }

  // VISTA MES
  function renderMes() {
    const dias = diasDelMes();
    const mesActual = cursor.getMonth();
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="grid grid-cols-7 border-b border-gray-100 bg-white">
          {DIAS_CORTO.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-[10px] font-medium tracking-wider text-[#5F5955] sm:py-4 sm:text-xs"
            >
              <span className="sm:hidden">{d[0]}</span>
              <span className="hidden sm:inline">{d}</span>
            </div>
          ))}
        </div>

        <div className="grid flex-1 grid-cols-7 bg-white" style={{ gridAutoRows: '1fr' }}>
          {dias.map((dia, i) => {
            const key = dateKey(dia);
            const citasDia = citasPorDia[key] || [];
            const esHoy = key === hoyKey;
            const otroMes = dia.getMonth() !== mesActual;
            const hoyInicio = new Date(); hoyInicio.setHours(0,0,0,0);
            const esPasado = dia < hoyInicio;

            return (
              <div
                key={i}
                onClick={() => !esPasado && abrirDia(dia)}
                className={`relative flex min-h-[60px] flex-col border-r border-b border-gray-100/80 p-1 transition-colors sm:min-h-[110px] sm:p-2
                  ${esPasado ? 'cursor-not-allowed bg-gray-50 opacity-50' : 'cursor-pointer'}
                  ${esHoy ? 'z-10 bg-[#FBF7F4]/40 ring-1 ring-[#60412B]/30' : !esPasado ? 'bg-white hover:bg-[#FBF7F4]/20' : ''}
                `}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-lg text-xs font-normal transition-all sm:h-6 sm:w-6 sm:text-sm ${esHoy ? 'bg-[#60412B] font-semibold text-white' : otroMes ? 'text-gray-300' : 'text-[#5F5955]'} `}
                  >
                    {dia.getDate()}
                  </span>
                  {citasDia.length > 0 && (
                    <span className="mt-1 mr-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-lg bg-[#60412B] sm:hidden" />
                  )}
                </div>

                <div className="mt-2 hidden flex-1 flex-col justify-end space-y-1 sm:flex">
                  {citasDia.slice(0, 2).map((cita) => {
                    const col = ESTADO_COLORS[cita.estado] || ESTADO_COLORS.PROGRAMADA;
                    return (
                      <div
                        key={cita.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCitaSeleccionada(cita);
                        }}
                        className={`truncate rounded-md border px-2 py-1 text-[11px] font-medium transition-all ${col.bg} ${col.text} ${col.border} hover:brightness-95`}
                        style={{ borderLeftWidth: '3px', borderLeftColor: '#60412B' }}
                      >
                        {cita.horaInicio} · {cita.paciente?.nombre || 'Paciente'}
                      </div>
                    );
                  })}
                  {citasDia.length > 2 && (
                    <div className="pl-1 text-[10px] font-medium text-gray-400">
                      +{citasDia.length - 2} más
                    </div>
                  )}
                </div>

                {citasDia.length > 0 && (
                  <div className="mt-auto sm:hidden">
                    <span className="text-[9px] font-medium text-[#60412B]/60">
                      {citasDia.length}c
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // VISTA SEMANA
  function renderSemana() {
    const dias = diasDeSemana();
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-white">
        <div
          className="sticky top-0 z-10 grid border-b border-gray-100 bg-white"
          style={{ gridTemplateColumns: '40px repeat(7, 1fr)' }}
        >
          <div className="border-r border-gray-100" />
          {dias.map((dia, i) => (
            <div
              key={i}
              className="border-r border-gray-100 py-2 text-center last:border-r-0 sm:py-3"
            >
              <div className="text-[9px] font-medium text-gray-400 uppercase sm:text-[11px]">
                {DIAS_CORTO[i]}
              </div>
              <div
                onClick={() => {
                  setCursor(dia);
                  setVista('day');
                }}
                className={`mx-auto mt-0.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg text-xs font-medium transition-colors sm:mt-1 sm:text-sm ${dateKey(dia) === hoyKey ? 'bg-[#60412B] text-white' : 'text-gray-700 hover:bg-[#FBF7F4]'}`}
              >
                {dia.getDate()}
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1">
          {HORAS.map((hora) => (
            <div
              key={hora}
              className="grid border-b border-gray-50"
              style={{ gridTemplateColumns: '40px repeat(7, 1fr)', minHeight: '50px' }}
            >
              <div className="border-r border-gray-100 pt-1 pr-1 text-right font-mono text-[9px] text-gray-400 sm:text-[10px]">
                {String(hora).padStart(2, '0')}
              </div>
              {dias.map((dia, i) => {
                const key = dateKey(dia);
                const citasHora = (citasPorDia[key] || []).filter(
                  (c) => Math.floor(parseHora(c.horaInicio)) === hora,
                );
                const horaString = `${String(hora).padStart(2, '0')}:00`;
                return (
                  <div
                    key={i}
                    onClick={() => {
                      if (onDiaClick) onDiaClick(dia);
                      else window.location.href = `/citas/nueva?fecha=${key}&hora=${horaString}`;
                    }}
                    className="group relative cursor-pointer border-r border-gray-100 p-0.5 transition-colors last:border-r-0 hover:bg-[#FBF7F4]/40 sm:p-1"
                  >
                    {citasHora.map((cita) => (
                      <div
                        key={cita.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCitaSeleccionada(cita);
                        }}
                        className="mb-0.5 truncate rounded border border-[#60412B]/20 bg-[#FBF7F4] p-0.5 text-[9px] font-medium text-[#60412B] shadow-xs sm:p-1 sm:text-[11px]"
                        style={{ borderLeft: '2px solid #60412B' }}
                      >
                        <span className="hidden sm:inline">{cita.horaInicio} </span>
                        {cita.paciente?.nombre || ''}
                      </div>
                    ))}
                    {citasHora.length === 0 && (
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-medium text-[#60412B]/40 opacity-0 group-hover:opacity-100 sm:text-[10px]">
                        +
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // VISTA DÍA
  function renderDia() {
    const key = dateKey(cursor);
    const citasDia = citasPorDia[key] || [];
    return (
      <div className="flex-1 overflow-auto bg-white p-1 sm:p-2">
        {HORAS.map((hora) => {
          const citasHora = citasDia.filter((c) => Math.floor(parseHora(c.horaInicio)) === hora);
          const horaString = `${String(hora).padStart(2, '0')}:00`;
          return (
            <div
              key={hora}
              className="grid border-b border-gray-50 py-0.5 sm:py-1"
              style={{ gridTemplateColumns: '44px 1fr', minHeight: '56px' }}
            >
              <div className="border-r border-gray-100 pt-1 pr-2 text-right font-mono text-[10px] text-gray-400 sm:pt-2 sm:pr-3 sm:text-xs">
                {horaString}
              </div>
              <div
                className="group relative flex cursor-pointer flex-col justify-center py-1 pr-1 pl-2 transition-colors hover:bg-[#FBF7F4]/20 sm:pl-3"
                onClick={() => {
                  if (onDiaClick) onDiaClick(cursor);
                  else window.location.href = `/citas/nueva?fecha=${key}&hora=${horaString}`;
                }}
              >
                {citasHora.length > 0 ? (
                  <div className="w-full space-y-1">
                    {citasHora.map((cita) => (
                      <div
                        key={cita.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCitaSeleccionada(cita);
                        }}
                        className="cursor-pointer rounded-lg border border-[#60412B]/20 bg-[#FBF7F4] p-2 text-[#60412B] transition-all hover:brightness-95 sm:rounded-xl sm:p-2.5"
                        style={{ borderLeft: '3px solid #60412B' }}
                      >
                        <div className="text-[11px] font-semibold sm:text-xs">
                          {cita.horaInicio} – {cita.horaFin} · {cita.paciente?.nombre}{' '}
                          {cita.paciente?.apellido}
                        </div>
                        <div className="mt-0.5 truncate text-[10px] text-[#60412B]/70 sm:text-[11px]">
                          {cita.motivo}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="pl-1 text-[10px] font-medium text-[#60412B]/50 opacity-0 group-hover:opacity-100 sm:text-xs">
                    + {horaString}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-5xl rounded-2xl border border-gray-100/50 bg-[#FAF8F6] p-2 shadow-sm sm:rounded-[24px] sm:p-6">
        {/* Toolbar */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-100/40 bg-white p-2 shadow-xs sm:mb-6 sm:gap-4 sm:rounded-2xl sm:p-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-6">
            <h2 className="truncate font-serif text-base font-normal tracking-tight text-[#60412B] sm:text-2xl">
              {titulo()}
            </h2>
            <div className="flex flex-shrink-0 items-center gap-1 rounded-lg border border-gray-100 bg-gray-50 p-0.5 sm:p-1">
              <button
                onClick={() => navegar(-1)}
                className="flex h-6 w-6 items-center justify-center rounded-md text-sm font-medium text-gray-500 transition-all hover:bg-white hover:text-[#60412B] sm:h-7 sm:w-7"
              >
                ‹
              </button>
              <button
                onClick={() => setCursor(new Date())}
                className="flex h-6 items-center justify-center rounded-md px-1.5 text-[10px] font-medium text-gray-500 transition-all hover:bg-white hover:text-[#60412B] sm:h-7 sm:px-2.5 sm:text-xs"
              >
                Hoy
              </button>
              <button
                onClick={() => navegar(1)}
                className="flex h-6 w-6 items-center justify-center rounded-md text-sm font-medium text-gray-500 transition-all hover:bg-white hover:text-[#60412B] sm:h-7 sm:w-7"
              >
                ›
              </button>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex rounded-lg border border-gray-200/20 bg-[#F5F1EE] p-0.5 text-[10px] font-medium sm:rounded-xl sm:p-1 sm:text-xs">
              {(['month', 'week', 'day'] as Vista[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setVista(v)}
                  className={`rounded-md px-2 py-1 transition-all duration-200 sm:rounded-lg sm:px-4 sm:py-2 ${
                    vista === v
                      ? 'bg-white font-semibold text-[#60412B] shadow-xs'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {v === 'month' ? 'Mes' : v === 'week' ? 'Sem' : 'Día'}
                </button>
              ))}
            </div>

            <LinkButton href="/citas/nueva" variant="primary" size="sm">
              + Nueva
            </LinkButton>
          </div>
        </div>

        {/* Calendario */}
        <div
          className="flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xs sm:rounded-2xl"
          style={{ minHeight: '500px' }}
        >
          {vista === 'month' && renderMes()}
          {vista === 'week' && renderSemana()}
          {vista === 'day' && renderDia()}
        </div>
      </div>

      {/* MODAL DETALLES CITA */}
      <BottomSheet open={!!citaSeleccionada} onClose={cerrarDetalleCita} size="sm">
        {citaSeleccionada && (
          <>
            {/* Cabecera */}
            <div className="bg-neutral-25 px-6 pt-5 pb-4">
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium
                    ${ESTADO_COLORS[citaSeleccionada.estado]?.bg ?? ''}
                    ${ESTADO_COLORS[citaSeleccionada.estado]?.text ?? ''}
                    ${ESTADO_COLORS[citaSeleccionada.estado]?.border ?? ''}`}
                >
                  {citaSeleccionada.estado}
                </span>
                <button
                  onClick={cerrarDetalleCita}
                  className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                  aria-label="Cerrar"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>
              <CardTitle className="mt-2 font-serif">{citaSeleccionada.motivo}</CardTitle>
              <p className="mt-0.5 text-sm text-neutral-500">
                {citaSeleccionada.paciente?.nombre} {citaSeleccionada.paciente?.apellido}
              </p>
            </div>

            {/* Detalle */}
            <div className="space-y-3 px-6 py-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Horario</span>
                <span className="font-mono font-medium text-[#60412B]">
                  {citaSeleccionada.horaInicio} – {citaSeleccionada.horaFin}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Teléfono</span>
                <a
                  href={`tel:${citaSeleccionada.paciente?.telefono}`}
                  className="font-medium text-[#60412B] hover:underline"
                >
                  {citaSeleccionada.paciente?.telefono}
                </a>
              </div>
              {citaSeleccionada.notas && (
                <div>
                  <p className="mb-1 text-xs text-neutral-400">Notas</p>
                  <p className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-700">
                    {citaSeleccionada.notas}
                  </p>
                </div>
              )}
              {errorEliminar && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{errorEliminar}</p>
              )}
            </div>

            {/* Acciones */}
            <div className="space-y-2 px-6 pb-6">
              {!confirmandoEliminar ? (
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="md"
                    className="flex-1 h-10"
                    onClick={cerrarDetalleCita}
                  >
                    Cerrar
                  </Button>
                  <LinkButton
                    href={`/citas/${citaSeleccionada.id}/editar`}
                    variant="primary"
                    size="md"
                    className="flex-1 h-10 justify-center"
                  >
                    <EditIcon />
                    Editar
                  </LinkButton>
                  <Button
                    variant="danger"
                    size="md"
                    className="flex-1 h-10"
                    onClick={() => setConfirmandoEliminar(true)}
                  >
                    <TrashIcon color="currentColor" />
                    Eliminar
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl bg-red-50 p-3 text-center text-red-700">
                    <p className="text-sm font-semibold">¿Eliminar esta cita?</p>
                    <p className="mt-0.5 text-xs opacity-80">
                      {citaSeleccionada.paciente?.nombre} · {citaSeleccionada.horaInicio}
                    </p>
                    <p className="mt-1 text-xs opacity-70">Esta acción no se puede deshacer.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="md"
                      className="flex-1"
                      disabled={eliminando}
                      onClick={() => {
                        setConfirmandoEliminar(false);
                        setErrorEliminar('');
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="danger"
                      size="md"
                      className="flex-1"
                      disabled={eliminando}
                      isLoading={eliminando}
                      onClick={handleEliminar}
                    >
                      {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </BottomSheet>
    </>
  );
}