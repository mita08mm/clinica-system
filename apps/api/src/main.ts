import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@clinica/database';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

// ============================
// MIDDLEWARES
// ============================

// Seguridad con helmet
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por IP
  message: 'Demasiadas solicitudes desde esta IP, intente nuevamente más tarde.',
});
app.use('/api/', limiter);

// ============================
// ROUTES
// ============================

// Health check
app.get('/health', async (_req, res) => {
  try {
    // Verificar conexión a la base de datos
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
    });
  }
});

// API routes
app.get('/api', (_req, res) => {
  res.json({
    name: 'Clinica System API',
    version: '0.1.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      patients: '/api/pacientes',
      appointments: '/api/citas',
      medicalRecords: '/api/historias-clinicas',
    },
  });
});

// Rutas de autenticacion
import authRoutes from './presentation/routes/auth.routes';
app.use('/api/auth', authRoutes);

// Rutas de pacientes
import pacienteRoutes from './presentation/routes/paciente.routes';
app.use('/api/pacientes', pacienteRoutes);

// Rutas de citas
import citaRoutes from './presentation/routes/cita.routes';
app.use('/api/citas', citaRoutes);

// Rutas de cobros
import cobroRoutes from './presentation/routes/cobro.routes';
app.use('/api/cobros', cobroRoutes);

// Rutas de recetas
import recetaRoutes from './presentation/routes/receta.routes';
app.use('/api/recetas', recetaRoutes);

// Rutas de medicamentos
import medicamentoRoutes from './presentation/routes/medicamento.routes';
app.use('/api/medicamentos', medicamentoRoutes);

// Rutas de insumos
import insumoRoutes from './presentation/routes/insumo.routes';
app.use('/api/insumos', insumoRoutes);

// Rutas de consultas médicas  
import consultaRoutes from './presentation/routes/consulta.routes';
app.use('/api/consultas', consultaRoutes);

// Rutas de historia clínica (montadas sobre pacientes)
import pacienteHistoriaRoutes from './presentation/routes/paciente-historia.routes';
app.use('/api/pacientes', pacienteHistoriaRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${_req.method} ${_req.path}`,
  });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// ============================
// SERVER START
// ============================

const server = app.listen(PORT, () => {
  console.log(' Servidor iniciado');
  console.log(` Puerto: ${PORT}`);
  console.log(` Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Base de datos: ${prisma ? 'Conectada' : 'Desconectada'}`);
  console.log(` CORS habilitado para: ${process.env.CORS_ORIGIN}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(async () => {
    console.log('HTTP server closed');
    await prisma.$disconnect();
    process.exit(0);
  });
});
