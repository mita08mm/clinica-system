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

const ESTADO_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  PROGRAMADA: { label: 'Pendiente',  color: 'text-amber-700 bg-amber-50',    dot: 'bg-amber-400' },
  CONFIRMADA: { label: 'Confirmada', color: 'text-emerald-700 bg-emerald-50', dot: 'bg-emerald-400' },
  EN_CURSO:   { label: 'En curso',   color: 'text-blue-700 bg-blue-50',      dot: 'bg-blue-400' },
  COMPLETADA: { label: 'Completada', color: 'text-gray-500 bg-gray-100',     dot: 'bg-gray-300' },
  CANCELADA:  { label: 'Cancelada',  color: 'text-red-600 bg-red-50',        dot: 'bg-red-400' },
  NO_ASISTIO: { label: 'No asistió', color: 'text-red-400 bg-red-50',        dot: 'bg-red-300' },
};

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

function getMotivoIcon(motivo: string): string {
  const l = motivo.toLowerCase();
  if (l.includes('consulta')) return '🩺';
  if (l.includes('control'))  return '📋';
  if (l.includes('lab'))      return '🧪';
  if (l.includes('biopsia'))  return '✂️';
  if (l.includes('derm'))     return '🔬';
  if (l.includes('odont'))    return '🦷';
  return '📅';
}

function formatHora(hora: string): string {
  if (!hora) return '';
  const [h, m] = hora.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function parseFecha(fechaStr: string): Date {
  const [y, m, d] = fechaStr.split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d);
}

function labelFecha(fechaStr: string): string {
  const hoy = dateKey(new Date());
  const manana = dateKey(new Date(Date.now() + 86400000));
  const key = fechaStr.split('T')[0];
  if (key === hoy) return 'Hoy';
  if (key === manana) return 'Mañana';
  const d = parseFecha(fechaStr);
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

interface UpcomingTodayProps {
  citas: Cita[];
}

export default function UpcomingToday({ citas }: UpcomingTodayProps) {
  const [expandido, setExpandido]           = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null);
  const [modalTodas, setModalTodas]         = useState(false);

  const hoyKey = dateKey(new Date());

  // Citas de hoy
  const citasHoy = citas
    .filter(c => c.fecha.split('T')[0] === hoyKey && c.estado !== 'CANCELADA')
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

  const citasPendientes = citasHoy.filter(c => c.estado === 'PROGRAMADA' || c.estado === 'CONFIRMADA');
  const MAX_VISIBLE = 3;
  const citasVisibles = expandido ? citasHoy : citasHoy.slice(0, MAX_VISIBLE);
  const hayMas = citasHoy.length > MAX_VISIBLE;

  // Todas las citas agrupadas por día (futuras + hoy, sin canceladas)
  const citasFuturas = citas
    .filter(c => c.fecha.split('T')[0] >= hoyKey)
    .sort((a, b) => {
      const fechaDiff = a.fecha.localeCompare(b.fecha);
      return fechaDiff !== 0 ? fechaDiff : a.horaInicio.localeCompare(b.horaInicio);
    });

  const agrupadasPorDia = citasFuturas.reduce<Record<string, Cita[]>>((acc, cita) => {
    const key = cita.fecha.split('T')[0];
    if (!acc[key]) acc[key] = [];
    acc[key].push(cita);
    return acc;
  }, {});

  const diasOrdenados = Object.keys(agrupadasPorDia).sort();

  // Componente de tarjeta de cita (reutilizable)
  function CitaCard({ cita, compact = false }: { cita: Cita; compact?: boolean }) {
    const cfg = ESTADO_CONFIG[cita.estado] || ESTADO_CONFIG.PROGRAMADA;
    return (
      <div
        onClick={() => setCitaSeleccionada(cita)}
        className={`flex items-start gap-3 ${compact ? 'px-4 py-3' : 'px-5 py-3.5'} hover:bg-[#60412B]/[0.03] cursor-pointer transition-colors group rounded-xl`}
      >
        <div className={`w-2 h-2 rounded-full ${cfg.dot} ring-2 ring-white mt-1.5 flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span className={`text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${cfg.color}`}>
              {cfg.label}
            </span>
            <span className="text-xs font-mono font-semibold text-[#60412B]/70 flex-shrink-0">
              {formatHora(cita.horaInicio)}
            </span>
          </div>
          <p className="text-sm font-semibold text-[#3D2810] mt-1 truncate">
            {cita.paciente?.nombre} {cita.paciente?.apellido}
          </p>
          <p className="text-[11px] text-[#60412B]/60 mt-0.5 flex items-center gap-1 truncate">
            <span>{getMotivoIcon(cita.motivo)}</span>
            <span className="truncate">{cita.motivo}</span>
          </p>
        </div>
        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#60412B]/40 pt-1 flex-shrink-0">›</span>
      </div>
    );
  }

  return (
    <>
      {/* ── WIDGET PRINCIPAL ── */}
      <div className="bg-[#FAF8F6] rounded-2xl border border-[#60412B]/10 overflow-hidden w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-[#60412B]/8">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-medium text-[#60412B]">Upcoming Today</h3>
            <p className="text-[11px] text-[#60412B]/50 mt-0.5">
              {new Date().toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          {citasPendientes.length > 0 ? (
            <span className="px-2.5 py-1 rounded-full bg-[#60412B] text-white text-[11px] font-semibold">
              {citasPendientes.length} left
            </span>
          ) : citasHoy.length > 0 ? (
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold">
              ✓ Todo listo
            </span>
          ) : null}
        </div>

        {/* Citas de hoy */}
        <div className="divide-y divide-[#60412B]/6">
          {citasHoy.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-2xl mb-2">🗓️</p>
              <p className="text-sm text-[#60412B]/50 font-medium">Sin citas para hoy</p>
              <Link href="/citas/nueva" className="inline-block mt-3 text-xs text-[#60412B] underline underline-offset-2 hover:opacity-70">
                + Agendar una cita
              </Link>
            </div>
          ) : (
            citasVisibles.map((cita, idx) => {
              const cfg = ESTADO_CONFIG[cita.estado] || ESTADO_CONFIG.PROGRAMADA;
              return (
                <div
                  key={cita.id}
                  onClick={() => setCitaSeleccionada(cita)}
                  className="flex items-start gap-3 px-4 sm:px-5 py-3.5 hover:bg-[#60412B]/[0.03] cursor-pointer transition-colors group"
                >
                  <div className="flex flex-col items-center pt-1 flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${cfg.dot} ring-2 ring-white`} />
                    {idx < citasVisibles.length - 1 && (
                      <div className="w-px bg-[#60412B]/10 mt-1" style={{ minHeight: '32px' }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      <span className="text-xs font-mono font-semibold text-[#60412B]/70 flex-shrink-0">
                        {formatHora(cita.horaInicio)}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[#3D2810] mt-1 truncate">
                      {cita.paciente?.nombre} {cita.paciente?.apellido}
                    </p>
                    <p className="text-[11px] text-[#60412B]/60 mt-0.5 flex items-center gap-1 truncate">
                      <span>{getMotivoIcon(cita.motivo)}</span>
                      <span className="truncate">{cita.motivo}</span>
                    </p>
                  </div>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#60412B]/40 pt-1">›</span>
                </div>
              );
            })
          )}
        </div>

        {/* Ver más del día */}
        {hayMas && (
          <button
            onClick={() => setExpandido(!expandido)}
            className="w-full py-2.5 text-xs font-medium text-[#60412B]/60 hover:text-[#60412B] hover:bg-[#60412B]/[0.03] transition-all border-t border-[#60412B]/8"
          >
            {expandido ? '▲ Ver menos' : `▼ Ver ${citasHoy.length - MAX_VISIBLE} más de hoy`}
          </button>
        )}

        {/* Footer — View All Schedule */}
        <div className="px-4 sm:px-5 py-3 border-t border-[#60412B]/8">
          <button
            onClick={() => setModalTodas(true)}
            className="block w-full text-center py-2.5 rounded-xl border border-[#60412B]/20 text-[#60412B] text-xs font-medium hover:bg-[#60412B] hover:text-white transition-all"
          >
            View All Schedule
          </button>
        </div>
      </div>

      {/* ── MODAL DETALLE CITA ── */}
      {citaSeleccionada && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/20 backdrop-blur-sm"
          onClick={() => setCitaSeleccionada(null)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl border border-gray-100 shadow-2xl w-full sm:max-w-sm overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 sm:hidden" />
            <div className={`px-6 pt-5 pb-4 ${
              ESTADO_CONFIG[citaSeleccionada.estado]?.dot === 'bg-emerald-400' ? 'bg-emerald-50' :
              ESTADO_CONFIG[citaSeleccionada.estado]?.dot === 'bg-amber-400'   ? 'bg-amber-50'   : 'bg-[#FBF7F4]'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded ${ESTADO_CONFIG[citaSeleccionada.estado]?.color}`}>
                  {ESTADO_CONFIG[citaSeleccionada.estado]?.label}
                </span>
                <button onClick={() => setCitaSeleccionada(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
              </div>
              <h3 className="text-xl font-serif font-medium text-[#60412B] mt-2">
                {citaSeleccionada.paciente?.nombre} {citaSeleccionada.paciente?.apellido}
              </h3>
              <p className="text-sm text-[#60412B]/60 mt-0.5 flex items-center gap-1.5">
                <span>{getMotivoIcon(citaSeleccionada.motivo)}</span>
                {citaSeleccionada.motivo}
              </p>
            </div>
            <div className="px-6 py-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Horario</span>
                <span className="font-semibold text-[#60412B] font-mono">
                  {formatHora(citaSeleccionada.horaInicio)} – {formatHora(citaSeleccionada.horaFin)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Teléfono</span>
                <a href={`tel:${citaSeleccionada.paciente?.telefono}`} className="font-medium text-[#60412B] hover:underline">
                  {citaSeleccionada.paciente?.telefono}
                </a>
              </div>
              {citaSeleccionada.notas && (
                <div className="text-sm">
                  <span className="text-gray-500 block mb-1">Notas</span>
                  <p className="text-[#60412B]/80 bg-[#FBF7F4] rounded-lg px-3 py-2 text-xs">{citaSeleccionada.notas}</p>
                </div>
              )}
            </div>
            <div className="px-6 pb-6 flex gap-2">
              <button onClick={() => setCitaSeleccionada(null)} className="flex-1 py-2.5 bg-gray-50 text-gray-500 text-xs font-medium rounded-xl hover:bg-gray-100 transition-all">
                Cerrar
              </button>
              <Link href={`/citas/${citaSeleccionada.id}/editar`} className="flex-1 text-center py-2.5 bg-[#60412B] text-white text-xs font-medium rounded-xl hover:bg-[#60412B]/90 transition-all">
                Editar cita
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL TODAS LAS CITAS ── */}
      {modalTodas && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/20 backdrop-blur-sm"
          onClick={() => setModalTodas(false)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl border border-gray-100 shadow-2xl w-full sm:max-w-md overflow-hidden flex flex-col"
            style={{ maxHeight: '85vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle móvil */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 sm:hidden flex-shrink-0" />

            {/* Header modal */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h3 className="text-base font-serif font-semibold text-[#60412B]">Todas las citas</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">{citasFuturas.length} citas próximas</p>
              </div>
              <button onClick={() => setModalTodas(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            {/* Cuerpo scrollable */}
            <div className="overflow-y-auto flex-1 px-2 py-3 space-y-4">
              {diasOrdenados.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-2xl mb-2">📭</p>
                  <p className="text-sm text-gray-400">No hay citas próximas</p>
                </div>
              ) : (
                diasOrdenados.map(diaKey => {
                  const citasDia = agrupadasPorDia[diaKey];
                  const esHoy = diaKey === hoyKey;
                  return (
                    <div key={diaKey}>
                      {/* Label del día */}
                      <div className="flex items-center gap-2 px-3 mb-1">
                        <span className={`text-xs font-bold ${esHoy ? 'text-[#60412B]' : 'text-gray-400'}`}>
                          {labelFecha(diaKey)}
                        </span>
                        {esHoy && (
                          <span className="px-1.5 py-0.5 rounded-full bg-[#60412B] text-white text-[9px] font-semibold">HOY</span>
                        )}
                        <div className="flex-1 h-px bg-gray-100" />
                        <span className="text-[10px] text-gray-300">{citasDia.length} cita{citasDia.length > 1 ? 's' : ''}</span>
                      </div>

                      {/* Citas del día */}
                      <div className="bg-[#FAF8F6] rounded-xl border border-[#60412B]/8 overflow-hidden divide-y divide-[#60412B]/6">
                        {citasDia.map(cita => {
                          const cfg = ESTADO_CONFIG[cita.estado] || ESTADO_CONFIG.PROGRAMADA;
                          return (
                            <div
                              key={cita.id}
                              onClick={() => { setCitaSeleccionada(cita); setModalTodas(false); }}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-[#60412B]/[0.04] cursor-pointer transition-colors group"
                            >
                              <div className={`w-2 h-2 rounded-full ${cfg.dot} flex-shrink-0`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[#3D2810] truncate">
                                  {cita.paciente?.nombre} {cita.paciente?.apellido}
                                </p>
                                <p className="text-[11px] text-[#60412B]/60 truncate flex items-center gap-1">
                                  <span>{getMotivoIcon(cita.motivo)}</span>
                                  <span>{cita.motivo}</span>
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-xs font-mono font-semibold text-[#60412B]/70">
                                  {formatHora(cita.horaInicio)}
                                </p>
                                <span className={`text-[9px] font-bold tracking-wider uppercase px-1 py-0.5 rounded ${cfg.color}`}>
                                  {cfg.label}
                                </span>
                              </div>
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#60412B]/40 text-sm">›</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-100 flex-shrink-0">
              <Link
                href="/citas/nueva"
                className="block w-full text-center py-2.5 rounded-xl bg-[#60412B] text-white text-xs font-medium hover:bg-[#60412B]/90 transition-all"
              >
                + Nueva Cita
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}