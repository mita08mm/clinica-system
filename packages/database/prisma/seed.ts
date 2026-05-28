import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de base de datos...');

  console.log('\nCreando usuarios del sistema...');

  const adminEmail = process.env.SEED_ADMIN_EMAIL || '';
  const adminPassword = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || '', 10);
  const admin = await prisma.usuario.upsert({
    where: { email: adminEmail },
    update: {},
    create: { 
      email: adminEmail,
      password: adminPassword,
      rol: 'ADMIN',
      nombre: 'Cecile',
      apellido: 'Arce',
      activo: true,
    },
  });
  console.log('Admin creado:', admin.email);

  const medicoEmail = process.env.SEED_MEDICO_EMAIL || '';
  const medicoPassword = await bcrypt.hash(process.env.SEED_MEDICO_PASSWORD || '', 10);
  const medico = await prisma.usuario.upsert({
    where: { email: medicoEmail },
    update: {},
    create: {
      email: medicoEmail,
      password: medicoPassword,
      rol: 'MEDICO',
      nombre: 'Cecile',
      apellido: 'Derpic',
      activo: true,
    },
  });
  console.log('Médico creado:', medico.email);

  const recepEmail = process.env.SEED_RECEP_EMAIL || '';
  const recepPassword = await bcrypt.hash(process.env.SEED_RECEP_PASSWORD || '', 10);
  const recepcionista = await prisma.usuario.upsert({
    where: { email: recepEmail },
    update: {},
    create: {
      email: recepEmail,
      password: recepPassword,
      rol: 'RECEPCIONISTA',
      nombre: 'Ana',
      apellido: 'González',
      activo: true,
    },
  });
  console.log('✅ Recepcionista creada:', recepcionista.email);

  console.log('\n¡Seed completado exitosamente!\n');
  console.log('Resumen:');
  console.log('  - 3 usuarios (Admin, Médico, Recepcionista)');
  console.log('\n🔑 Credenciales de acceso:');
  console.log('  Admin:        ', process.env.SEED_ADMIN_EMAIL, '/', process.env.SEED_ADMIN_PASSWORD);
  console.log('  Médico:       ', process.env.SEED_MEDICO_EMAIL, '/', process.env.SEED_MEDICO_PASSWORD);
  console.log('  Recepcionista:', process.env.SEED_RECEP_EMAIL, '/', process.env.SEED_RECEP_PASSWORD);
}

main()
  .catch((e) => {
    console.error('Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
