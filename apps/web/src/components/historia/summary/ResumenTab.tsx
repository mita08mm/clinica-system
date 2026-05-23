import Link from 'next/link';
import { HistoriaClinica } from '@/types/historia';

interface ResumenTabProps {
  historia: HistoriaClinica;
  pacienteId: string;
}

export function ResumenTab({ historia, pacienteId }: ResumenTabProps) {
  const isFemalePatient = historia.paciente?.sexo?.toUpperCase() === 'FEMENINO';
  const hasData =
    historia.objetivoEstetico ||
    historia.condicionesMedicas ||
    historia.medicacionActual ||
    historia.alergias ||
    historia.antecedentesPersonales ||
    historia.antecedentesFamiliares ||
    historia.antecedentesQuirurgicos;

  if (!hasData) {
    return (
      <div className="text-center py-8">
        <p className="text-marengo mb-4">La historia clínica aún no tiene datos</p>
        <Link
          href={`/pacientes/${pacienteId}/historia/editar`}
          className="inline-block btn-secondary"
        >
          Completar Historia Clínica
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {historia.objetivoEstetico && (
        <ResumenSection
          title="Objetivo Estético"
          content={historia.objetivoEstetico}
        />
      )}

      {historia.condicionesMedicas && (
        <ResumenSection title="Condiciones Médicas" content={historia.condicionesMedicas} />
      )}

      {historia.medicacionActual && (
        <ResumenSection title="Medicación Actual" content={historia.medicacionActual} />
      )}

      {historia.alergias && (
        <ResumenSection title="Alergias" content={historia.alergias} />
      )}

      {isFemalePatient && historia.embarazoLactancia && (
        <ResumenSection 
          title="Embarazo/Lactancia" 
          content="Sí" 
        />
      )}

      {historia.antecedentesPersonales && (
        <ResumenSection
          title="Antecedentes Personales"
          content={historia.antecedentesPersonales}
        />
      )}

      {historia.antecedentesFamiliares && (
        <ResumenSection
          title="Antecedentes Familiares"
          content={historia.antecedentesFamiliares}
        />
      )}

      {historia.antecedentesQuirurgicos && (
        <ResumenSection
          title="Antecedentes Quirúrgicos"
          content={historia.antecedentesQuirurgicos}
        />
      )}
    </div>
  );
}

function ResumenSection({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <h3 className="font-semibold text-concreto mb-2">{title}</h3>
      <p className="text-marengo whitespace-pre-line">{content}</p>
    </div>
  );
}
