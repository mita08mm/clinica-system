import { SignosVitales } from '@/types/historia';

interface SignosVitalesGridProps {
  signosVitales: SignosVitales;
}

export function SignosVitalesGrid({ signosVitales }: SignosVitalesGridProps) {
  return (
    <div>
      <h4 className="text-xs font-medium text-concreto uppercase tracking-wider mb-3">
        Signos Vitales
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {signosVitales.pa_sistolica && (
          <SignoVitalCard
            label="Presión Arterial"
            value={`${signosVitales.pa_sistolica}/${signosVitales.pa_diastolica} mmHg`}
          />
        )}
        {signosVitales.fc && (
          <SignoVitalCard label="Frecuencia Cardíaca" value={`${signosVitales.fc} bpm`} />
        )}
        {signosVitales.temp && (
          <SignoVitalCard label="Temperatura" value={`${signosVitales.temp}°C`} />
        )}
        {signosVitales.peso && (
          <SignoVitalCard label="Peso" value={`${signosVitales.peso} kg`} />
        )}
        {signosVitales.talla && (
          <SignoVitalCard label="Talla" value={`${signosVitales.talla} cm`} />
        )}
        {signosVitales.imc && (
          <SignoVitalCard label="IMC" value={`${signosVitales.imc}`} />
        )}
        {signosVitales.spo2 && (
          <SignoVitalCard label="SpO2" value={`${signosVitales.spo2}%`} />
        )}
      </div>
    </div>
  );
}

function SignoVitalCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-3 rounded-lg">
      <span className="text-xs text-marengo block">{label}</span>
      <p className="text-sm font-medium text-concreto">{value}</p>
    </div>
  );
}
