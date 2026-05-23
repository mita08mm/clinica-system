import { Card, CardContent } from "@/components/ui";
import { Tratamiento } from "@/types/historia";

interface TratamientosListProps {
  tratamientos: Tratamiento[];
}

export default function TratamientosList({
  tratamientos,
}: TratamientosListProps) {
  return (
    <section className="space-y-4">
      <div>
        <h4 className="text-xl">Historial Clinico</h4>
      </div>

      {tratamientos.map((tratamiento) => {
        return (
          <article key={tratamiento.id} className="relative">
            <Card>
              <CardContent className="px-5 py-4">
                <p className="text-xs font-medium uppercase tracking-[0.1em] text-marengo">
                  {formatDate(tratamiento.fecha)}
                </p>
     
                <h3 className="mt-2 text-lg font-heading text-concreto">
                  {tratamiento.nombreTratamiento}
                </h3>
                <p className="mt-3 text-sm leading-6 text-marengo">
                  {getDescription(tratamiento)}
                </p>
              </CardContent>
            </Card>
          </article>
        );
      })}
    </section>
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getDescription(tratamiento: Tratamiento) {
  return (
    tratamiento.evaluacionInicial ||
    tratamiento.objetivo ||
    tratamiento.observaciones ||
    tratamiento.protocolo ||
    "Sin descripcion registrada."
  );
}
