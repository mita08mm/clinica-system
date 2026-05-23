import { Medidas } from '@/types/historia';

interface SignosVitalesGridProps {
  signosVitales?: Medidas;
  medidas?: Medidas;
}

export function SignosVitalesGrid({ signosVitales, medidas }: SignosVitalesGridProps) {
  const data = signosVitales || medidas;
  
  if (!data) return null;

  return (
    <div>
      <h4 className="text-xs font-medium text-concreto uppercase tracking-wider mb-3">
        Medidas
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {data.peso && (
          <SignoVitalCard label="Peso" value={`${data.peso} kg`} />
        )}
        {data.talla && (
          <SignoVitalCard label="Talla" value={`${data.talla} cm`} />
        )}
        {data.imc && (
          <SignoVitalCard label="IMC" value={`${data.imc}`} />
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
