import { calcularIMC } from '@/lib/utils/medico';

interface SignosVitales {
  pa_sistolica?: number;
  pa_diastolica?: number;
  fc?: number;
  temp?: number;
  peso?: number;
  talla?: number;
  imc?: number;
  spo2?: number;
}

interface SignosVitalesInputsProps {
  signosVitales: SignosVitales;
  onChange: (signosVitales: SignosVitales) => void;
}

export function SignosVitalesInputs({ signosVitales, onChange }: SignosVitalesInputsProps) {
  const handleChange = (field: keyof SignosVitales, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    const newValues = { ...signosVitales, [field]: numValue };
    
    // Auto-calcular IMC cuando cambian peso o talla
    if ((field === 'peso' || field === 'talla') && newValues.peso && newValues.talla) {
      newValues.imc = calcularIMC(newValues.peso, newValues.talla);
    }
    
    onChange(newValues);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Presión Arterial */}
      <div>
        <label className="block text-sm font-medium text-marengo mb-2">
          PA Sistólica (mmHg)
        </label>
        <input
          type="number"
          step="1"
          min="0"
          max="300"
          value={signosVitales.pa_sistolica || ''}
          onChange={(e) => handleChange('pa_sistolica', e.target.value)}
          placeholder="120"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-morena focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-marengo mb-2">
          PA Diastólica (mmHg)
        </label>
        <input
          type="number"
          step="1"
          min="0"
          max="200"
          value={signosVitales.pa_diastolica || ''}
          onChange={(e) => handleChange('pa_diastolica', e.target.value)}
          placeholder="80"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-morena focus:border-transparent"
        />
      </div>

      {/* Frecuencia Cardíaca */}
      <div>
        <label className="block text-sm font-medium text-marengo mb-2">
          Frecuencia Cardíaca (bpm)
        </label>
        <input
          type="number"
          step="1"
          min="0"
          max="250"
          value={signosVitales.fc || ''}
          onChange={(e) => handleChange('fc', e.target.value)}
          placeholder="70"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-morena focus:border-transparent"
        />
      </div>

      {/* Temperatura */}
      <div>
        <label className="block text-sm font-medium text-marengo mb-2">
          Temperatura (°C)
        </label>
        <input
          type="number"
          step="0.1"
          min="30"
          max="45"
          value={signosVitales.temp || ''}
          onChange={(e) => handleChange('temp', e.target.value)}
          placeholder="36.5"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-morena focus:border-transparent"
        />
      </div>

      {/* Peso */}
      <div>
        <label className="block text-sm font-medium text-marengo mb-2">
          Peso (kg)
        </label>
        <input
          type="number"
          step="0.1"
          min="0"
          max="300"
          value={signosVitales.peso || ''}
          onChange={(e) => handleChange('peso', e.target.value)}
          placeholder="70"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-morena focus:border-transparent"
        />
      </div>

      {/* Talla */}
      <div>
        <label className="block text-sm font-medium text-marengo mb-2">
          Talla (cm)
        </label>
        <input
          type="number"
          step="0.1"
          min="0"
          max="250"
          value={signosVitales.talla || ''}
          onChange={(e) => handleChange('talla', e.target.value)}
          placeholder="170"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-morena focus:border-transparent"
        />
      </div>

      {/* IMC (auto-calculado) */}
      <div>
        <label className="block text-sm font-medium text-marengo mb-2">
          IMC (auto)
        </label>
        <input
          type="number"
          step="0.01"
          value={signosVitales.imc || ''}
          readOnly
          placeholder="--"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
        />
      </div>

      {/* SpO2 */}
      <div>
        <label className="block text-sm font-medium text-marengo mb-2">
          SpO2 (%)
        </label>
        <input
          type="number"
          step="1"
          min="0"
          max="100"
          value={signosVitales.spo2 || ''}
          onChange={(e) => handleChange('spo2', e.target.value)}
          placeholder="98"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-morena focus:border-transparent"
        />
      </div>
    </div>
  );
}
