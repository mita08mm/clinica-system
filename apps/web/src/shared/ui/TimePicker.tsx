'use client';

interface TimePickerProps {
  label: string;
  value: string; // "HH:MM" formato 24h
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  hasConflict?: boolean;
}

function to24(hour: number, minute: number, ampm: 'AM' | 'PM'): string {
  let h = hour;
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function from24(value: string): { hour: number; minute: number; ampm: 'AM' | 'PM' } {
  if (!value) return { hour: 9, minute: 0, ampm: 'AM' };
  const [hStr, mStr] = value.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const ampm: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return { hour: h, minute: m, ampm };
}

export function addOneHour(value: string): string {
  if (!value) return '';
  const [hStr, mStr] = value.split(':');
  const h = (parseInt(hStr, 10) + 1) % 24;
  return `${String(h).padStart(2, '0')}:${mStr}`;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export function TimePicker({ label, value, onChange, disabled, required, hasConflict }: TimePickerProps) {
  const { hour, minute, ampm } = from24(value);

  const update = (h: number, m: number, ap: 'AM' | 'PM') => onChange(to24(h, m, ap));

  const borderColor = hasConflict
    ? 'var(--color-border-warning, #f59e0b)'
    : 'var(--color-border-secondary, #d1ccc8)';

  const sel: React.CSSProperties = {
    appearance: 'none',
    border: `0.5px solid ${borderColor}`,
    borderRadius: 8,
    background: 'var(--color-background-primary, #fff)',
    color: 'var(--color-text-primary, #1a1a1a)',
    fontSize: 14,
    fontWeight: 500,
    padding: '0 28px 0 10px',
    height: 36,
    cursor: disabled ? 'not-allowed' : 'pointer',
    outline: 'none',
    opacity: disabled ? 0.6 : 1,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 8px center',
  };

  const readable = value
    ? `${from24(value).hour}:${String(from24(value).minute).padStart(2, '0')} ${from24(value).ampm}`
    : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
        {label}
        {required && <span style={{ color: 'var(--color-text-danger)', marginLeft: 2 }}>*</span>}
      </label>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        

        {/* Horas */}
        <select
          value={hour}
          disabled={disabled}
          onChange={(e) => update(Number(e.target.value), minute, ampm)}
          style={{ ...sel, width: 70 }}
          required={required}
          aria-label={`${label} hora`}
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
          ))}
        </select>

        <span style={{ color: 'var(--color-text-secondary)', fontWeight: 600, fontSize: 16 }}>:</span>

        {/* Minutos */}
        <select
          value={minute}
          disabled={disabled}
          onChange={(e) => update(hour, Number(e.target.value), ampm)}
          style={{ ...sel, width: 64 }}
          aria-label={`${label} minutos`}
        >
          {MINUTES.map((m) => (
            <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
          ))}
        </select>

        {/* AM / PM */}
        <select
          value={ampm}
          disabled={disabled}
          onChange={(e) => update(hour, minute, e.target.value as 'AM' | 'PM')}
          style={{ ...sel, width: 72 }}
          aria-label={`${label} AM o PM`}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>

      {readable && (
        <span style={{ fontSize: 12, color: hasConflict ? 'var(--color-text-warning)' : 'var(--color-text-tertiary)' }}>
          Hora actual: {readable}
        </span>
      )}
    </div>
  );
}