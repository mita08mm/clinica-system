/**
 * Calcula la edad a partir de una fecha de nacimiento
 */
export function calcularEdad(fechaNacimiento: string | Date): number {
  const hoy = new Date();
  const nacimiento = typeof fechaNacimiento === 'string' 
    ? new Date(fechaNacimiento) 
    : fechaNacimiento;
  
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  
  return edad;
}
