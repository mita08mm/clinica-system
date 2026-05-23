import Link from 'next/link';
import { HistoriaClinica } from '@/types/historia';
import { calcularEdad } from '@/lib/utils/paciente';
import { useState, useEffect } from 'react';
import { apiEndpoint } from '@/lib/config';
import { Badge } from '@/components/ui/badge';

interface PatientHeaderProps {
  historia: HistoriaClinica;
  pacienteId: string;
}

export default function PatientHeader({ historia, pacienteId }: PatientHeaderProps) {
  const paciente = historia.paciente;
  const edad = calcularEdad(paciente.fechaNacimiento);
  const isFemalePatient = paciente.sexo?.toUpperCase() === 'FEMENINO';
  const [saldoPendiente, setSaldoPendiente] = useState<number>(0);
  const [loadingSaldo, setLoadingSaldo] = useState(true);

  useEffect(() => {
    const fetchSaldo = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(apiEndpoint(`/pacientes/${pacienteId}/saldo`), {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setSaldoPendiente(data.saldo || 0);
        }
      } catch (err) {
        console.error('Error cargando saldo:', err);
      } finally {
        setLoadingSaldo(false);
      }
    };

    fetchSaldo();
  }, [pacienteId]);

  return (
    <div className="bg-gradient-to-br from-amber-50/30 via-white to-white border-b border-amber-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <div className="min-w-0 flex-1">
            <Link 
              href="/pacientes" 
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors mb-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver
            </Link>

            <h1 className="text-2xl font-serif font-light text-gray-900 leading-none">
              {paciente.nombre} {paciente.apellido}
            </h1>
          </div>

          <Link
            href={`/pacientes/${pacienteId}/consulta/nueva`}
            className="btn-primary h-fit text-xs px-4 py-2 shrink-0"
          >
            Nueva Consulta
          </Link>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{edad} años</span>
          </div>

          <span className="text-stone-300">•</span>

          <div className="flex items-center gap-2 min-w-0 max-w-[320px]">
            <span className="truncate font-medium text-gray-900">{paciente.objetivoEstetico || 'No especificado'}</span>
          </div>

          <span className="text-stone-300">•</span>

          <div className="flex items-center gap-2">
            {paciente.alergias ? (
              <Badge variant="danger" className="px-2.5 py-1 text-[11px] font-semibold">
                {paciente.alergias}
              </Badge>
            ) : (
              <span className="font-medium text-gray-900">Ninguna</span>
            )}
          </div>

          {!loadingSaldo && saldoPendiente > 0 && (
            <>
              <span className="text-stone-300">•</span>
              <Badge variant="warning" className="px-2.5 py-1 text-[11px] font-semibold">
                Bs. {saldoPendiente.toFixed(2)}
              </Badge>
            </>
          )}

          {isFemalePatient && (
            <>
              <span className="text-stone-300">•</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-gray-500">Emb/Lac</span>
                <span className="font-medium text-gray-900">{paciente.embarazoLactancia ? 'Sí' : 'No'}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
