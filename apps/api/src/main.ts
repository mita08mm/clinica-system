import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { PrismaClient } from '@clinica/database';
import { ProductoRepository } from './infrastructure/repositories/ProductoRepository';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

// ============================
// MIDDLEWARES
// ============================

// Seguridad con helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploaded images/documents
const uploadsDir = process.env.UPLOADS_DIR || './uploads';
app.use('/uploads', express.static(path.resolve(uploadsDir)));

// Rate limiting (más permisivo en desarrollo)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 1000 en dev, 100 en producción
  message: 'Demasiadas solicitudes desde esta IP, intente nuevamente más tarde.',
  standardHeaders: true, // Retorna info de rate limit en headers `RateLimit-*`
  legacyHeaders: false, // Deshabilita headers `X-RateLimit-*`
  skip: (req) => {
    // En desarrollo, puedes opcionalmente saltear ciertas rutas
    return process.env.NODE_ENV === 'development' && req.path === '/api/auth/login';
  },
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
    name: 'Sistema Clínica de Medicina Estética',
    version: '0.2.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      patients: '/api/pacientes',
      appointments: '/api/citas',
      medicalRecords: '/api/historias-clinicas',
      treatments: '/api/tratamientos',
      protocols: '/api/protocolos',
      products: '/api/productos',
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

// Rutas de protocolos de cuidados
import protocoloRoutes from './presentation/routes/protocolo.routes';
app.use('/api/protocolos', protocoloRoutes);

// Rutas de productos (cosméticos, equipos, insumos)
import productoRoutes from './presentation/routes/producto.routes';
app.use('/api/productos', productoRoutes);

// Rutas de tratamientos estéticos
import tratamientoRoutes from './presentation/routes/tratamiento.routes';
app.use('/api/tratamientos', tratamientoRoutes);

// Rutas de historia clínica (montadas sobre pacientes)
import pacienteHistoriaRoutes from './presentation/routes/paciente-historia.routes';
app.use('/api/pacientes', pacienteHistoriaRoutes);

// Rutas de documentos médicos
import documentoRoutes from './presentation/routes/documento.routes';
app.use('/api/documentos', documentoRoutes);

import reporteRoutes from './presentation/routes/reporte.routes';
app.use('/api/reportes', reporteRoutes);

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

  // Cache warming para productos
  const productoRepository = new ProductoRepository(prisma);
  try {
    productoRepository.findAll(true).then(() => {
      console.log('Cache de productos precargada exitosamente.');
    });
  } catch (error) {
    console.error('Error precargando caché de productos:', error);
  }
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
