import { Consulta } from '@/types/historia';
import { formatFecha } from '@/lib/utils/date';

interface ClinicalEvolutionTimelineProps {
  consultas: Consulta[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function ClinicalEvolutionTimeline({ 
  consultas, 
  selectedId, 
  onSelect 
}: ClinicalEvolutionTimelineProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-semibold text-concreto mb-6">Consultas Registradas</h2>
      
      <div className="space-y-4 relative">
        {/* Línea vertical del timeline */}
        <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200"></div>
        
        {consultas.map((consulta) => {
          const isSelected = selectedId === consulta.id;
          
          return (
            <button
              key={consulta.id}
              onClick={() => onSelect(consulta.id)}
              className={`relative pl-8 text-left w-full transition-all ${
                isSelected ? 'bg-piel/30 -ml-2 pl-10 pr-2 py-2 rounded-lg' : ''
              }`}
            >
              {/* Punto del timeline */}
              <div className="absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-white bg-amber-600"></div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-amber-700 uppercase">
                    Consulta
                  </span>
                  <span className="text-xs text-marengo/60">•</span>
                  <span className="text-xs text-marengo/60">{formatFecha(consulta.fecha)}</span>
                </div>
                <h3 className="text-sm font-medium text-concreto line-clamp-2">
                  {consulta.motivoConsulta}
                </h3>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
