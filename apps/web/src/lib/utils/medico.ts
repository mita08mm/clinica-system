/**
 * Calcula el Índice de Masa Corporal (IMC)
 * @param peso - Peso en kilogramos
 * @param talla - Talla en centímetros
 * @returns IMC redondeado a 2 decimales
 */
export function calcularIMC(peso: number, talla: number): number {
  if (peso <= 0 || talla <= 0) return 0;
  
  // Convertir talla de cm a metros
  const tallaMetros = talla / 100;
  
  // IMC = peso / (talla^2)
  const imc = peso / (tallaMetros * tallaMetros);
  
  return Math.round(imc * 100) / 100;
}

/**
 * Clasifica el IMC según los rangos de la OMS
 */
export function clasificarIMC(imc: number): string {
  if (imc < 18.5) return 'Bajo peso';
  if (imc < 25) return 'Normal';
  if (imc < 30) return 'Sobrepeso';
  if (imc < 35) return 'Obesidad I';
  if (imc < 40) return 'Obesidad II';
  return 'Obesidad III';
}
