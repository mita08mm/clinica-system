import { useState } from 'react';
import { formatFecha } from '@/lib/utils/date';
import { Consulta } from '@/types/historia';
import { SignosVitalesGrid } from './SignosVitalesGrid';

interface ConsultaCardProps {
  consulta: Consulta;
}

export function ConsultaCard({ consulta }: ConsultaCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div
        className="p-5 bg-white cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <p className="text-sm font-medium text-morena">
                {formatFecha(consulta.fecha)}
              </p>
              <p className="text-xs text-marengo">
                Dr. {consulta.usuario.nombre}
                {consulta.usuario.apellido ? ` ${consulta.usuario.apellido}` : ''}
              </p>
            </div>

            <h3 className="font-semibold text-concreto mb-2">
              {consulta.motivoConsulta}
            </h3>

            <div className="text-sm">
              <span className="font-medium text-marengo">Diagnóstico:</span>
              <span className="text-concreto ml-2">{consulta.diagnostico}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {consulta.recetas && consulta.recetas.length > 0 && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                {consulta.recetas.length} receta(s)
              </span>
            )}
            <button className="text-marengo hover:text-concreto text-lg">
              {isExpanded ? '▲' : '▼'}
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-5 bg-gray-50 border-t border-gray-200 space-y-4">
          {consulta.signosVitales && (
            <SignosVitalesGrid signosVitales={consulta.signosVitales} />
          )}

          {consulta.examenFisico && (
            <DetailSection title="Examen Físico" content={consulta.examenFisico} />
          )}

          {consulta.tratamiento && (
            <DetailSection title="Tratamiento" content={consulta.tratamiento} />
          )}

          {consulta.observaciones && (
            <DetailSection title="Observaciones" content={consulta.observaciones} />
          )}
        </div>
      )}
    </div>
  );
}

function DetailSection({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <h4 className="text-xs font-medium text-concreto uppercase tracking-wider mb-2">
        {title}
      </h4>
      <p className="text-sm text-marengo bg-white p-3 rounded-lg whitespace-pre-line">
        {content}
      </p>
    </div>
  );
}
