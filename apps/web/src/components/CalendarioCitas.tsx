'use client';

import { useState } from 'react';
import Link from 'next/link';

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
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DIAS_CORTO = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
const HORAS = Array.from({ length: 15 }, (_, i) => i + 7); // 7am - 9pm

const ESTADO_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  PROGRAMADA:  { bg: 'bg-[#FBF7F4]', text: 'text-[#60412B]', border: 'border-[#60412B]/20' },
  CONFIRMADA:  { bg: 'bg-[#FBF7F4]', text: 'text-[#60412B]', border: 'border-[#60412B]/20' },
  EN_CURSO:    { bg: 'bg-[#F2EAE4]', text: 'text-[#60412B]', border: 'border-[#60412B]/40' },
  COMPLETADA:  { bg: 'bg-[#F5F5F5]', text: 'text-[#7A7A7A]', border: 'border-gray-200' },
  CANCELADA:   { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200' },
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
  const [diaModal, setDiaModal] = useState<{ fecha: Date; citas: Cita[] } | null>(null);

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
      const dom = new Date(lun); dom.setDate(dom.getDate() + 6);
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
      const d = new Date(lun); d.setDate(lun.getDate() + i); return d;
    });
  }

  function abrirDia(fecha: Date) {
    const key = dateKey(fecha);
    setDiaModal({ fecha, citas: citasPorDia[key] || [] });
  }

  // VISTA MES
  function renderMes() {
    const dias = diasDelMes();
    const mesActual = cursor.getMonth();
    return (
      <div className="flex-1 flex flex-col min-h-0">
        {/* Cabecera días semana */}
        <div className="grid grid-cols-7 border-b border-gray-100 bg-white">
          {DIAS_CORTO.map(d => (
            <div key={d} className="py-2 sm:py-4 text-center text-[10px] sm:text-xs font-medium text-[#5F5955] tracking-wider">
              {/* En móvil solo primera letra */}
              <span className="sm:hidden">{d[0]}</span>
              <span className="hidden sm:inline">{d}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 flex-1 bg-white" style={{ gridAutoRows: '1fr' }}>
          {dias.map((dia, i) => {
            const key = dateKey(dia);
            const citasDia = citasPorDia[key] || [];
            const esHoy = key === hoyKey;
            const otroMes = dia.getMonth() !== mesActual;

            return (
              <div
                key={i}
                onClick={() => abrirDia(dia)}
                className={`
                  min-h-[60px] sm:min-h-[110px] border-b border-r border-gray-100/80 p-1 sm:p-2 cursor-pointer
                  transition-colors relative flex flex-col
                  ${esHoy ? 'bg-[#FBF7F4]/40 ring-1 ring-[#60412B]/30 z-10' : 'bg-white hover:bg-[#FBF7F4]/20'}
                `}
              >
                <div className="flex items-start justify-between">
                  <span className={`
                    text-xs sm:text-sm font-normal rounded-full transition-all w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center
                    ${esHoy ? 'bg-[#60412B] text-white font-semibold' : otroMes ? 'text-gray-300' : 'text-[#5F5955]'}
                  `}>
                    {dia.getDate()}
                  </span>
                  {/* Punto indicador en móvil */}
                  {citasDia.length > 0 && (
                    <span className="sm:hidden w-1.5 h-1.5 rounded-full bg-[#60412B] mt-1 mr-0.5 flex-shrink-0" />
                  )}
                </div>

                {/* Citas — solo en desktop */}
                <div className="hidden sm:flex space-y-1 mt-2 flex-1 flex-col justify-end">
                  {citasDia.slice(0, 2).map(cita => {
                    const col = ESTADO_COLORS[cita.estado] || ESTADO_COLORS.PROGRAMADA;
                    return (
                      <div
                        key={cita.id}
                        onClick={(e) => { e.stopPropagation(); setCitaSeleccionada(cita); }}
                        className={`px-2 py-1 rounded-md text-[11px] font-medium border truncate transition-all ${col.bg} ${col.text} ${col.border} hover:brightness-95`}
                        style={{ borderLeftWidth: '3px', borderLeftColor: '#60412B' }}
                      >
                        {cita.horaInicio} · {cita.paciente?.nombre || 'Paciente'}
                      </div>
                    );
                  })}
                  {citasDia.length > 2 && (
                    <div className="text-[10px] text-gray-400 font-medium pl-1">+{citasDia.length - 2} más</div>
                  )}
                </div>

                {/* Contador en móvil */}
                {citasDia.length > 0 && (
                  <div className="sm:hidden mt-auto">
                    <span className="text-[9px] text-[#60412B]/60 font-medium">{citasDia.length}c</span>
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
      <div className="flex-1 flex flex-col min-h-0 overflow-auto bg-white">
        {/* Header días */}
        <div className="grid border-b border-gray-100 sticky top-0 bg-white z-10" style={{ gridTemplateColumns: '40px repeat(7, 1fr)' }}>
          <div className="border-r border-gray-100" />
          {dias.map((dia, i) => (
            <div key={i} className="py-2 sm:py-3 text-center border-r border-gray-100 last:border-r-0">
              <div className="text-[9px] sm:text-[11px] font-medium text-gray-400 uppercase">{DIAS_CORTO[i]}</div>
              <div
                onClick={() => { setCursor(dia); setVista('day'); }}
                className={`mt-0.5 sm:mt-1 text-xs sm:text-sm font-medium cursor-pointer rounded-full w-6 h-6 flex items-center justify-center mx-auto transition-colors
                  ${dateKey(dia) === hoyKey ? 'bg-[#60412B] text-white' : 'text-gray-700 hover:bg-[#FBF7F4]'}`}
              >
                {dia.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Filas de horas */}
        <div className="flex-1">
          {HORAS.map(hora => (
            <div key={hora} className="grid border-b border-gray-50" style={{ gridTemplateColumns: '40px repeat(7, 1fr)', minHeight: '50px' }}>
              <div className="border-r border-gray-100 pr-1 pt-1 text-right text-[9px] sm:text-[10px] text-gray-400 font-mono">
                {String(hora).padStart(2, '0')}
              </div>
              {dias.map((dia, i) => {
                const key = dateKey(dia);
                const citasHora = (citasPorDia[key] || []).filter(c => Math.floor(parseHora(c.horaInicio)) === hora);
                const horaString = `${String(hora).padStart(2, '0')}:00`;
                return (
                  <div
                    key={i}
                    onClick={() => {
                      if (onDiaClick) onDiaClick(dia);
                      else window.location.href = `/citas/nueva?fecha=${key}&hora=${horaString}`;
                    }}
                    className="border-r border-gray-100 last:border-r-0 p-0.5 sm:p-1 cursor-pointer hover:bg-[#FBF7F4]/40 transition-colors relative group"
                  >
                    {citasHora.map(cita => (
                      <div
                        key={cita.id}
                        onClick={(e) => { e.stopPropagation(); setCitaSeleccionada(cita); }}
                        className="rounded bg-[#FBF7F4] border border-[#60412B]/20 text-[#60412B] p-0.5 sm:p-1 text-[9px] sm:text-[11px] font-medium truncate shadow-xs mb-0.5"
                        style={{ borderLeft: '2px solid #60412B' }}
                      >
                        <span className="hidden sm:inline">{cita.horaInicio} </span>
                        {cita.paciente?.nombre || ''}
                      </div>
                    ))}
                    {citasHora.length === 0 && (
                      <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-[9px] sm:text-[10px] text-[#60412B]/40 font-medium">
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
        {HORAS.map(hora => {
          const citasHora = citasDia.filter(c => Math.floor(parseHora(c.horaInicio)) === hora);
          const horaString = `${String(hora).padStart(2, '0')}:00`;
          return (
            <div key={hora} className="grid border-b border-gray-50 py-0.5 sm:py-1" style={{ gridTemplateColumns: '44px 1fr', minHeight: '56px' }}>
              <div className="text-[10px] sm:text-xs text-gray-400 font-mono pt-1 sm:pt-2 text-right pr-2 sm:pr-3 border-r border-gray-100">
                {horaString}
              </div>
              <div
                className="pl-2 sm:pl-3 pr-1 py-1 cursor-pointer hover:bg-[#FBF7F4]/20 transition-colors relative group flex flex-col justify-center"
                onClick={() => {
                  if (onDiaClick) onDiaClick(cursor);
                  else window.location.href = `/citas/nueva?fecha=${key}&hora=${horaString}`;
                }}
              >
                {citasHora.length > 0 ? (
                  <div className="space-y-1 w-full">
                    {citasHora.map(cita => (
                      <div
                        key={cita.id}
                        onClick={(e) => { e.stopPropagation(); setCitaSeleccionada(cita); }}
                        className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-[#FBF7F4] border border-[#60412B]/20 text-[#60412B] cursor-pointer hover:brightness-95 transition-all"
                        style={{ borderLeft: '3px solid #60412B' }}
                      >
                        <div className="font-semibold text-[11px] sm:text-xs">
                          {cita.horaInicio} – {cita.horaFin} · {cita.paciente?.nombre} {cita.paciente?.apellido}
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-[#60412B]/70 mt-0.5 truncate">{cita.motivo}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="opacity-0 group-hover:opacity-100 text-[10px] sm:text-xs text-[#60412B]/50 font-medium pl-1">
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
      <div className="bg-[#FAF8F6] p-2 sm:p-6 rounded-2xl sm:rounded-[24px] shadow-sm w-full max-w-5xl mx-auto border border-gray-100/50">

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-3 sm:mb-6 flex-wrap gap-2 sm:gap-4 bg-white p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100/40 shadow-xs">

          {/* Título + navegación */}
          <div className="flex items-center gap-2 sm:gap-6 min-w-0">
            <h2 className="text-base sm:text-2xl font-serif font-normal text-[#60412B] tracking-tight truncate">
              {titulo()}
            </h2>
            <div className="flex items-center gap-1 bg-gray-50 p-0.5 sm:p-1 rounded-lg border border-gray-100 flex-shrink-0">
              <button onClick={() => navegar(-1)} className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-md text-gray-500 hover:bg-white hover:text-[#60412B] transition-all text-sm font-medium">‹</button>
              <button onClick={() => setCursor(new Date())} className="px-1.5 sm:px-2.5 h-6 sm:h-7 flex items-center justify-center rounded-md text-gray-500 hover:bg-white hover:text-[#60412B] transition-all text-[10px] sm:text-xs font-medium">Hoy</button>
              <button onClick={() => navegar(1)} className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-md text-gray-500 hover:bg-white hover:text-[#60412B] transition-all text-sm font-medium">›</button>
            </div>
          </div>

          {/* Vista selector + Nueva cita */}
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex bg-[#F5F1EE] p-0.5 sm:p-1 rounded-lg sm:rounded-xl border border-gray-200/20 text-[10px] sm:text-xs font-medium">
              {(['month', 'week', 'day'] as Vista[]).map(v => (
                <button
                  key={v}
                  onClick={() => setVista(v)}
                  className={`px-2 sm:px-4 py-1 sm:py-2 rounded-md sm:rounded-lg transition-all duration-200 ${
                    vista === v ? 'bg-white text-[#60412B] shadow-xs font-semibold' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {v === 'month' ? 'Mes' : v === 'week' ? 'Sem' : 'Día'}
                </button>
              ))}
            </div>

            <Link
              href="/citas/nueva"
              className="px-2 sm:px-4 py-1.5 sm:py-2 bg-[#60412B] text-white text-[10px] sm:text-xs font-medium rounded-lg sm:rounded-xl hover:bg-[#60412B]/90 transition-all whitespace-nowrap"
            >
              + Nueva
            </Link>
          </div>
        </div>

        {/* Calendario */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex flex-col" style={{ minHeight: '500px' }}>
          {vista === 'month' && renderMes()}
          {vista === 'week' && renderSemana()}
          {vista === 'day' && renderDia()}
        </div>
      </div>

      {/* MODAL DETALLES CITA */}
      {citaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#60412B]/10 backdrop-blur-sm" onClick={() => setCitaSeleccionada(null)}>
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl border border-gray-100 shadow-xl w-full sm:max-w-sm p-5 sm:p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle bar móvil */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto sm:hidden" />
            <div className="flex justify-between items-start">
              <h3 className="text-base sm:text-lg font-semibold text-[#60412B]">{citaSeleccionada.motivo}</h3>
              <button onClick={() => setCitaSeleccionada(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="text-sm space-y-2 text-[#5F5955]">
              <p><strong className="text-[#60412B]">Paciente:</strong> {citaSeleccionada.paciente?.nombre} {citaSeleccionada.paciente?.apellido}</p>
              <p><strong className="text-[#60412B]">Horario:</strong> {citaSeleccionada.horaInicio} – {citaSeleccionada.horaFin}</p>
              <p><strong className="text-[#60412B]">Teléfono:</strong> {citaSeleccionada.paciente?.telefono}</p>
              {citaSeleccionada.notas && <p><strong className="text-[#60412B]">Notas:</strong> {citaSeleccionada.notas}</p>}
            </div>
            <button onClick={() => setCitaSeleccionada(null)} className="w-full py-2.5 bg-gray-50 text-gray-500 text-xs font-medium rounded-lg hover:bg-gray-100">
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL DÍA RÁPIDO */}
      {diaModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#60412B]/10 backdrop-blur-sm" onClick={() => setDiaModal(null)}>
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl border border-gray-100 shadow-xl w-full sm:max-w-sm p-5 sm:p-6 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle bar móvil */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto sm:hidden" />
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-semibold text-[#60412B]">Citas del Día</h3>
                <p className="text-xs text-gray-400">{diaModal.fecha.getDate()} de {MESES[diaModal.fecha.getMonth()]}</p>
              </div>
              <button onClick={() => setDiaModal(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {diaModal.citas.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-2 text-center">No hay citas en esta fecha.</p>
              ) : (
                diaModal.citas.map(c => (
                  <div
                    key={c.id}
                    onClick={() => { setCitaSeleccionada(c); setDiaModal(null); }}
                    className="p-2.5 rounded-lg bg-[#FBF7F4] border border-[#60412B]/10 text-xs text-[#60412B] cursor-pointer hover:brightness-95 transition-all"
                    style={{ borderLeft: '3px solid #60412B' }}
                  >
                    <strong>{c.horaInicio} – {c.horaFin}</strong> · {c.paciente?.nombre} {c.paciente?.apellido}
                    <div className="text-[#60412B]/60 mt-0.5 truncate">{c.motivo}</div>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setCursor(diaModal.fecha); setVista('day'); setDiaModal(null); }}
                className="flex-1 py-2.5 bg-gray-50 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-100 transition-all"
              >
                Ver día
              </button>
              <Link
                href={`/citas/nueva?fecha=${dateKey(diaModal.fecha)}`}
                className="flex-1 text-center py-2.5 bg-[#60412B] text-white text-xs font-medium rounded-lg hover:bg-[#60412B]/90 transition-all"
              >
                + Agendar
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}