import { Medidas } from '@/types/historia';

interface MedidasGridProps {
  medidas: Medidas;
}

export function MedidasGrid({ medidas }: MedidasGridProps) {
  const hasBasicMeasures = medidas.peso || medidas.talla || medidas.imc;
  const hasCircunferencias = medidas.circunferencias && Object.keys(medidas.circunferencias).length > 0;
  const hasPliegues = medidas.plieguesCutaneos && Object.keys(medidas.plieguesCutaneos).length > 0;
  const hasOtros = medidas.otros && Object.keys(medidas.otros).length > 0;

  return (
    <div>
      <h4 className="text-xs font-medium text-concreto uppercase tracking-wider mb-3">
        Medidas y Evaluación Corporal
      </h4>
      
      {hasBasicMeasures && (
        <div className="mb-4">
          <h5 className="text-xs text-marengo/70 uppercase mb-2">Medidas Básicas</h5>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {medidas.peso && (
              <MedidaCard label="Peso" value={`${medidas.peso} kg`} />
            )}
            {medidas.talla && (
              <MedidaCard label="Talla" value={`${medidas.talla} cm`} />
            )}
            {medidas.imc && (
              <MedidaCard label="IMC" value={`${medidas.imc.toFixed(1)}`} />
            )}
          </div>
        </div>
      )}

      {hasCircunferencias && (
        <div className="mb-4">
          <h5 className="text-xs text-marengo/70 uppercase mb-2">Circunferencias</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(medidas.circunferencias!).map(([key, value]) => (
              <MedidaCard 
                key={key} 
                label={capitalizeFirst(key)} 
                value={`${value} cm`} 
              />
            ))}
          </div>
        </div>
      )}

      {hasPliegues && (
        <div className="mb-4">
          <h5 className="text-xs text-marengo/70 uppercase mb-2">Pliegues Cutáneos</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(medidas.plieguesCutaneos!).map(([key, value]) => (
              <MedidaCard 
                key={key} 
                label={capitalizeFirst(key)} 
                value={`${value} mm`} 
              />
            ))}
          </div>
        </div>
      )}

      {hasOtros && (
        <div>
          <h5 className="text-xs text-marengo/70 uppercase mb-2">Otras Medidas</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(medidas.otros!).map(([key, value]) => (
              <MedidaCard 
                key={key} 
                label={capitalizeFirst(key)} 
                value={String(value)} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MedidaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-3 rounded-lg border border-gray-100">
      <span className="text-xs text-marengo block">{label}</span>
      <p className="text-sm font-medium text-concreto">{value}</p>
    </div>
  );
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}
