interface EmptyStateProps {
  pacienteId: string;
}

export default function EmptyState({ pacienteId }: EmptyStateProps) {
  void pacienteId;
  return (
    <div className="card p-12 text-center">
      <div className="text-6xl text-marengo/20 mb-4">📋</div>
      <h3 className="text-xl font-semibold text-concreto mb-2">
        No hay consultas registradas
      </h3>
      <p className="text-marengo">
        Usa el botón Nueva Consulta del encabezado para registrar la primera atención de este paciente.
      </p>
    </div>
  );
}
