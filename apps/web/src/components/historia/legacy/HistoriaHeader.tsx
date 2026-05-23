import Link from 'next/link';
import { calcularEdad } from '@/lib/utils/paciente';
import { HistoriaClinica } from '@/types/historia';

interface HistoriaHeaderProps {
  historia: HistoriaClinica;
  pacienteId: string;
}

export function HistoriaHeader({ historia, pacienteId }: HistoriaHeaderProps) {
  const { paciente } = historia;
  const edad = calcularEdad(paciente.fechaNacimiento);

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/pacientes" className="text-marengo hover:text-concreto transition-colors">
              ← Volver
            </Link>
            <h1 className="text-3xl font-heading font-bold text-concreto">
              {paciente.nombre} {paciente.apellido}
            </h1>
          </div>

          <div className="flex gap-6 text-sm">
            <span className="text-marengo">
              {edad} años • Doc: {paciente.documento}
            </span>

            {historia.tipoSangre && (
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg font-medium">
                🩸 {historia.tipoSangre}
              </span>
            )}

            {historia.alergias && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg font-medium">
                ⚠️ Alergias
              </span>
            )}
          </div>

          {historia.alergias && (
            <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
              <p className="text-sm font-semibold text-yellow-900">ALERGIAS:</p>
              <p className="text-sm text-yellow-800">{historia.alergias}</p>
            </div>
          )}
        </div>

        <Link href={`/pacientes/${pacienteId}/consulta/nueva`} className="btn-primary">
          + Nueva Consulta
        </Link>
      </div>
    </div>
  );
}
