'use client';

import { useState, useRef, useEffect, useId } from 'react';
import { cn } from '@/shared/utils';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const DIAS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseISO(s?: string): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDisplay(iso?: string): string {
  const d = parseISO(iso);
  if (!d) return '';
  return `${String(d.getDate()).padStart(2, '0')} / ${MESES[d.getMonth()]} / ${d.getFullYear()}`;
}

function firstWeekdayOfMonth(year: number, month: number): number {
  const raw = new Date(year, month, 1).getDay();
  return raw === 0 ? 6 : raw - 1;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export interface DatePickerProps {
  label?: string;
  name?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  hint?: string;
  /**
   * Fecha mínima seleccionable.
   * - Citas: new Date() → no permite fechas pasadas
   * - Nacimiento: omitir → usa 120 años atrás por defecto
   * - Edición de cita: omitir → permite ver/editar fechas pasadas
   */
  minDate?: Date;
  /**
   * Fecha máxima seleccionable.
   * - Nacimiento: new Date() → no permite fechas futuras
   * - Citas: omitir o new Date() + 2 años
   */
  maxDate?: Date;
  placeholder?: string;
}

export default function DatePicker({
  label,
  name = '',
  value,
  onChange,
  required,
  disabled,
  error,
  hint,
  minDate,
  maxDate,
  placeholder = 'dd / mes / aaaa',
}: DatePickerProps) {
  const triggerId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);

  const today = startOfDay(new Date());
  const todayISO = toISO(today);

  // Límites efectivos con defaults sensatos
  const effectiveMin = minDate
    ? startOfDay(minDate)
    : new Date(today.getFullYear() - 120, 0, 1);
  const effectiveMax = maxDate
    ? startOfDay(maxDate)
    : new Date(today.getFullYear() + 10, 11, 31);

  const minYear = effectiveMin.getFullYear();
  const maxYear = effectiveMax.getFullYear();

  const selected = parseISO(value);

  // Vista inicial inteligente según contexto
  const getInitialView = () => {
    if (selected) return { year: selected.getFullYear(), month: selected.getMonth() };
    // Cita → abrir en minDate (hoy o futuro)
    if (minDate && minDate >= today) return { year: minDate.getFullYear(), month: minDate.getMonth() };
    // Nacimiento → abrir en maxDate (hoy)
    if (maxDate && maxDate <= today) return { year: maxDate.getFullYear(), month: maxDate.getMonth() };
    return { year: today.getFullYear(), month: today.getMonth() };
  };

  const initial = getInitialView();
  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);
  const [open, setOpen] = useState(false);

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Años disponibles según contexto (más reciente primero)
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);

  // Meses: deshabilitar los que quedan 100% fuera del rango
  const availableMonths = MESES.map((label, i) => {
    const lastOfMonth = new Date(viewYear, i + 1, 0);
    const firstOfMonth = new Date(viewYear, i, 1);
    const isDisabled = lastOfMonth < effectiveMin || firstOfMonth > effectiveMax;
    return { label, index: i, isDisabled };
  });

  const canGoPrev = !(viewMonth === 0 && viewYear <= minYear);
  const canGoNext = !(viewMonth === 11 && viewYear >= maxYear);

  const prevMonth = () => {
    if (!canGoPrev) return;
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const nextMonth = () => {
    if (!canGoNext) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const handleYearChange = (year: number) => {
    setViewYear(year);
    // Corregir mes si queda fuera del rango en el nuevo año
    const lastOfCurrent = new Date(year, viewMonth + 1, 0);
    const firstOfCurrent = new Date(year, viewMonth, 1);
    if (lastOfCurrent < effectiveMin) setViewMonth(effectiveMin.getMonth());
    else if (firstOfCurrent > effectiveMax) setViewMonth(effectiveMax.getMonth());
  };

  const isDayDisabled = (day: number): boolean => {
    const date = new Date(viewYear, viewMonth, day);
    return date < effectiveMin || date > effectiveMax;
  };

  const selectDay = (day: number) => {
    if (isDayDisabled(day)) return;
    const iso = toISO(new Date(viewYear, viewMonth, day));
    onChange?.({ target: { name, value: iso } } as React.ChangeEvent<HTMLInputElement>);
    setOpen(false);
  };

  // Celdas del calendario
  const offset = firstWeekdayOfMonth(viewYear, viewMonth);
  const totalDays = daysInMonth(viewYear, viewMonth);
  const cells: number[] = [
    ...Array(offset).fill(0),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  const hasError = Boolean(error);
  const isCitaMode = minDate && minDate >= today;

  return (
    <div ref={wrapRef} className="relative w-full">
      {label && (
        <label
          htmlFor={triggerId}
          className="text-concreto mb-2 block text-xs font-medium tracking-wider uppercase"
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <button
        id={triggerId}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={cn(
          'flex w-full items-center gap-3 rounded-xl border bg-white px-4 py-3 text-sm transition-all outline-none',
          hasError
            ? 'border-red-300 bg-red-50/40'
            : open
              ? 'border-morena ring-piel/20 ring-2'
              : 'border-[#D7C5B9] hover:border-morena/50',
          disabled && 'cursor-not-allowed opacity-60',
        )}
      >
        <svg
          className="h-[18px] w-[18px] shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        <span className={cn('flex-1 text-left', value ? 'text-concreto' : 'text-marengo/45')}>
          {value ? formatDisplay(value) : placeholder}
        </span>
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-2 w-[310px] rounded-2xl border border-[#E5DDD6] bg-white p-4 shadow-xl">

          {/* Navegación mes / año */}
          <div className="mb-3 flex items-center gap-1">
            <button
              type="button"
              onClick={prevMonth}
              disabled={!canGoPrev}
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                canGoPrev ? 'text-marengo hover:bg-piel/20' : 'cursor-not-allowed text-marengo/25',
              )}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <div className="flex min-w-0 flex-1 items-center justify-center gap-1">
              {/* Select mes */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                className="text-concreto min-w-0 flex-1 cursor-pointer rounded-lg border border-[#D7C5B9] bg-white px-2 py-1 text-xs font-semibold outline-none hover:border-morena/50 focus:border-morena"
              >
                {availableMonths.map(({ label, index, isDisabled }) => (
                  <option key={index} value={index} disabled={isDisabled}>
                    {label}
                  </option>
                ))}
              </select>

              {/* Select año */}
              <select
                value={viewYear}
                onChange={(e) => handleYearChange(Number(e.target.value))}
                className="text-concreto w-[70px] shrink-0 cursor-pointer rounded-lg border border-[#D7C5B9] bg-white px-2 py-1 text-xs font-semibold outline-none hover:border-morena/50 focus:border-morena"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={nextMonth}
              disabled={!canGoNext}
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                canGoNext ? 'text-marengo hover:bg-piel/20' : 'cursor-not-allowed text-marengo/25',
              )}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          {/* Días de la semana */}
          <div className="mb-1 grid grid-cols-7">
            {DIAS.map((d) => (
              <div key={d} className="text-marengo flex h-8 items-center justify-center text-xs font-bold">
                {d}
              </div>
            ))}
          </div>

          {/* Grid de días */}
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              if (day === 0) return <div key={idx} />;

              const iso = toISO(new Date(viewYear, viewMonth, day));
              const isSelected = iso === value;
              const isToday = iso === todayISO;
              const isDisabled = isDayDisabled(day);

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => selectDay(day)}
                  className={cn(
                    'h-9 w-full rounded-lg text-sm transition-all',
                    isDisabled && 'cursor-not-allowed text-marengo/25',
                    !isDisabled && isSelected && 'bg-morena font-bold text-white',
                    !isDisabled && !isSelected && isToday && 'text-morena font-bold underline',
                    !isDisabled && !isSelected && !isToday && 'text-concreto hover:bg-piel/25',
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Hint contextual */}
          {isCitaMode && (
            <p className="text-marengo mt-3 border-t border-[#E5DDD6] pt-2 text-center text-[11px]">
              Solo fechas desde hoy disponibles
            </p>
          )}
        </div>
      )}

      {hasError && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {!hasError && hint && <p className="text-marengo mt-2 text-xs">{hint}</p>}
    </div>
  );
}