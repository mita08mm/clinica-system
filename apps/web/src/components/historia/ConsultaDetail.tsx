import { Consulta } from '@/types/historia';
import { formatFecha } from '@/lib/utils/date';
import { SignosVitalesGrid } from './SignosVitalesGrid';

interface ConsultaDetailProps {
  consulta: Consulta;
}

export default function ConsultaDetail({ consulta }: ConsultaDetailProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-medium text-amber-700 uppercase">
            Consulta Médica
          </span>
          <span className="text-xs text-marengo/60">•</span>
          <span className="text-xs text-marengo/60">{formatFecha(consulta.fecha)}</span>
        </div>
        <h2 className="text-2xl font-semibold text-concreto mb-1">
          {consulta.motivoConsulta}
        </h2>
      </div>

      {/* Contenido de la consulta */}
      <div className="prose prose-sm max-w-none space-y-6">
        {consulta.examenFisico && (
          <div>
            <h3 className="text-sm font-semibold text-concreto uppercase mb-2">Examen Físico</h3>
            <p className="text-marengo whitespace-pre-line">{consulta.examenFisico}</p>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold text-concreto uppercase mb-2">Diagnóstico</h3>
          <p className="text-marengo">{consulta.diagnostico}</p>
        </div>

        {consulta.tratamiento && (
          <div>
            <h3 className="text-sm font-semibold text-concreto uppercase mb-2">Tratamiento</h3>
            <p className="text-marengo whitespace-pre-line">{consulta.tratamiento}</p>
          </div>
        )}

        {consulta.observaciones && (
          <div>
            <h3 className="text-sm font-semibold text-concreto uppercase mb-2">Observaciones</h3>
            <p className="text-marengo whitespace-pre-line">{consulta.observaciones}</p>
          </div>
        )}

        {/* Signos Vitales */}
        {consulta.signosVitales && Object.keys(consulta.signosVitales).length > 0 && (
          <SignosVitalesGrid signosVitales={consulta.signosVitales} />
        )}
      </div>

      {/* Doctor */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-700 rounded-full flex items-center justify-center text-white font-medium text-sm">
            {consulta.usuario.nombre.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium text-concreto">
              Dr. {consulta.usuario.nombre} {consulta.usuario.apellido || ''}
            </p>
            <p className="text-xs text-marengo/60">MÉDICO TRATANTE</p>
          </div>
        </div>
      </div>
    </div>
  );
}
