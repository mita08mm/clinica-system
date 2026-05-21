import Link from 'next/link';
import { Consulta } from '@/types/historia';
import { ConsultaCard } from './ConsultaCard';

interface ConsultasTabProps {
  consultas: Consulta[];
  pacienteId: string;
}

export function ConsultasTab({ consultas, pacienteId }: ConsultasTabProps) {
  if (consultas.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-marengo mb-4">No hay consultas registradas</p>
        <Link
          href={`/pacientes/${pacienteId}/consulta/nueva`}
          className="inline-block px-6 py-3 bg-piel text-morena rounded-lg hover:bg-piel/90"
        >
          Crear primera consulta
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {consultas.map((consulta) => (
        <ConsultaCard key={consulta.id} consulta={consulta} />
      ))}
    </div>
  );
}
