import { Receta } from '@/types/historia';

interface PrescriptionsPanelProps {
  recetas: Receta[];
}

export default function PrescriptionsPanel({ recetas }: PrescriptionsPanelProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-concreto">Recetas</h2>
        <button className="text-2xl text-marengo hover:text-concreto">+</button>
      </div>

      <div className="space-y-4">
        {recetas.length === 0 ? (
          <p className="text-sm text-marengo/60 text-center py-4">No hay recetas</p>
        ) : (
          recetas.slice(0, 5).map((receta) => (
            <div key={receta.id} className="space-y-2">
              {receta.items.map((item, idx) => (
                <div key={idx} className="pb-3 border-b border-gray-100 last:border-0">
                  <p className="text-sm font-medium text-concreto">{item.nombre}</p>
                  <p className="text-xs text-marengo/60">
                    {item.cantidad} unidad(es) • Activo
                  </p>
                  <p className="text-xs text-green-600">1 cápsula cada 8 horas</p>
                </div>
              ))}
            </div>
          ))
        )}

        {recetas.length > 0 && (
          <button className="text-xs text-amber-700 hover:underline w-full text-center pt-2">
            Ver todos los medicamentos
          </button>
        )}
      </div>
    </div>
  );
}
