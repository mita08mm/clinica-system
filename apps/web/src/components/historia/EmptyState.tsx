import Link from 'next/link';

interface EmptyStateProps {
  pacienteId: string;
}

export default function EmptyState({ pacienteId }: EmptyStateProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
      <div className="text-6xl text-marengo/20 mb-4">📋</div>
      <h3 className="text-xl font-semibold text-concreto mb-2">
        No hay consultas registradas
      </h3>
      <p className="text-marengo mb-6">
        Comienza creando la primera consulta para este paciente
      </p>
      <Link
        href={`/pacientes/${pacienteId}/consulta/nueva`}
        className="inline-block px-6 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors"
      >
        + Nueva Consulta
      </Link>
    </div>
  );
}
