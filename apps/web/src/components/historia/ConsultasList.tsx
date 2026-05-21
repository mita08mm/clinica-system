import { useState } from 'react';
import { Consulta } from '@/types/historia';
import { formatFecha } from '@/lib/utils/date';
import { SignosVitalesGrid } from './SignosVitalesGrid';

interface ConsultasListProps {
  consultas: Consulta[];
}

export default function ConsultasList({ consultas }: ConsultasListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(consultas[0]?.id || null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-concreto mb-4">
        Consultas Médicas ({consultas.length})
      </h2>

      {consultas.map((consulta) => {
        const isExpanded = expandedId === consulta.id;

        return (
          <div
            key={consulta.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all"
          >
            {/* Header de la consulta (siempre visible) */}
            <button
              onClick={() => toggleExpand(consulta.id)}
              className="w-full px-6 py-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-amber-700">
                      {formatFecha(consulta.fecha)}
                    </span>
                    <span className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded">
                      Consulta
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-concreto mb-1">
                    {consulta.motivoConsulta}
                  </h3>
                  <p className="text-sm text-marengo">
                    Diagnóstico: {consulta.diagnostico}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-concreto">
                      Dr. {consulta.usuario.nombre} {consulta.usuario.apellido || ''}
                    </p>
                    <p className="text-xs text-marengo/60">Médico tratante</p>
                  </div>
                  <svg
                    className={`w-5 h-5 text-marengo transition-transform ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </button>

            {/* Contenido expandible */}
            {isExpanded && (
              <div className="px-6 pb-6 pt-2 border-t border-gray-100 space-y-4">
                {/* Examen Físico */}
                {consulta.examenFisico && (
                  <div>
                    <h4 className="text-sm font-semibold text-concreto uppercase mb-2">
                      Examen Físico
                    </h4>
                    <p className="text-marengo whitespace-pre-line text-sm">
                      {consulta.examenFisico}
                    </p>
                  </div>
                )}

                {/* Diagnóstico Completo */}
                <div>
                  <h4 className="text-sm font-semibold text-concreto uppercase mb-2">
                    Diagnóstico Detallado
                  </h4>
                  <p className="text-marengo text-sm">{consulta.diagnostico}</p>
                  {consulta.codigoCIE && (
                    <p className="text-xs text-marengo/60 mt-1">
                      Código CIE-10: {consulta.codigoCIE}
                    </p>
                  )}
                </div>

                {/* Tratamiento */}
                {consulta.tratamiento && (
                  <div>
                    <h4 className="text-sm font-semibold text-concreto uppercase mb-2">
                      Tratamiento
                    </h4>
                    <p className="text-marengo whitespace-pre-line text-sm">
                      {consulta.tratamiento}
                    </p>
                  </div>
                )}

                {/* Observaciones */}
                {consulta.observaciones && (
                  <div>
                    <h4 className="text-sm font-semibold text-concreto uppercase mb-2">
                      Observaciones
                    </h4>
                    <p className="text-marengo whitespace-pre-line text-sm">
                      {consulta.observaciones}
                    </p>
                  </div>
                )}

                {/* Signos Vitales */}
                {consulta.signosVitales && Object.keys(consulta.signosVitales).length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <SignosVitalesGrid signosVitales={consulta.signosVitales} />
                  </div>
                )}

                {/* Próxima Consulta */}
                {consulta.proximaConsulta && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm text-amber-800">
                      <span className="font-medium">Próxima consulta:</span>{' '}
                      {formatFecha(consulta.proximaConsulta)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
