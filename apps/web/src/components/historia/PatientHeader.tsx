import Link from 'next/link';
import { HistoriaClinica } from '@/types/historia';
import { calcularEdad } from '@/lib/utils/paciente';

interface PatientHeaderProps {
  historia: HistoriaClinica;
  pacienteId: string;
}

export default function PatientHeader({ historia, pacienteId }: PatientHeaderProps) {
  const paciente = historia.paciente;
  const edad = calcularEdad(paciente.fechaNacimiento);

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-8 py-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Link href="/pacientes" className="text-marengo hover:text-concreto">
                ← Volver
              </Link>
              <h1 className="text-3xl font-bold text-concreto">
                {paciente.nombre} {paciente.apellido}
              </h1>
            </div>
            
            <div className="grid grid-cols-4 gap-6 text-sm">
              <div>
                <span className="text-marengo/60 uppercase text-xs font-medium">Edad/Sexo</span>
                <p className="text-concreto font-medium">{edad} Años / {paciente.sexo || 'N/A'}</p>
              </div>
              
              <div>
                <span className="text-marengo/60 uppercase text-xs font-medium">Tipo de Sangre</span>
                <p className="text-concreto font-medium">{historia.tipoSangre || 'N/A'}</p>
              </div>
              
              <div>
                <span className="text-marengo/60 uppercase text-xs font-medium">Alergias</span>
                <p className="text-red-600 font-medium">{historia.alergias || 'Ninguna'}</p>
              </div>
              
              <div>
                <span className="text-marengo/60 uppercase text-xs font-medium">Próxima Visita</span>
                <p className="text-concreto font-medium">Por programar</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link 
              href={`/pacientes/${pacienteId}/editar`} 
              className="px-4 py-2 border border-gray-300 text-marengo rounded-lg hover:bg-gray-50 transition-colors"
            >
              Editar Perfil
            </Link>
            <Link 
              href={`/pacientes/${pacienteId}/consulta/nueva`} 
              className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors"
            >
              Nueva Consulta
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
