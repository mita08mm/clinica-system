import { Router } from 'express';
import { PrismaClient } from '@clinica/database';
import { CitaRepository } from '../../infrastructure/repositories/CitaRepository';
import { CreateCitaUseCase } from '../../application/use-cases/cita/CreateCitaUseCase';
import { GetCitasUseCase } from '../../application/use-cases/cita/GetCitasUseCase';
import { GetCitaByIdUseCase } from '../../application/use-cases/cita/GetCitaByIdUseCase';
import { UpdateCitaUseCase } from '../../application/use-cases/cita/UpdateCitaUseCase';
import { CancelarCitaUseCase } from '../../application/use-cases/cita/CancelarCitaUseCase';
import { GetCitasByPacienteUseCase } from '../../application/use-cases/cita/GetCitasByPacienteUseCase';
import { GetCitasByFechaUseCase } from '../../application/use-cases/cita/GetCitasByFechaUseCase';
import { DeleteCitaUseCase } from '../../application/use-cases/cita/DeleteCitaUseCase';
import { CitaController } from '../controllers/CitaController';
import { authMiddleware } from '../middlewares/auth.middleware';

export const router: Router = Router();
const prisma = new PrismaClient();

// Dependency Injection
const citaRepository = new CitaRepository(prisma);
const createCitaUseCase = new CreateCitaUseCase(citaRepository);
const getCitasUseCase = new GetCitasUseCase(citaRepository);
const getCitaByIdUseCase = new GetCitaByIdUseCase(citaRepository);
const updateCitaUseCase = new UpdateCitaUseCase(citaRepository);
const cancelarCitaUseCase = new CancelarCitaUseCase(citaRepository);
const getCitasByPacienteUseCase = new GetCitasByPacienteUseCase(citaRepository);
const getCitasByFechaUseCase = new GetCitasByFechaUseCase(citaRepository);
const deleteCitaUseCase = new DeleteCitaUseCase(citaRepository);

const citaController = new CitaController(
  createCitaUseCase,
  getCitasUseCase,
  getCitaByIdUseCase,
  updateCitaUseCase,
  cancelarCitaUseCase,
  getCitasByPacienteUseCase,
  getCitasByFechaUseCase,
  deleteCitaUseCase,
);

// Routes
router.post('/', authMiddleware, citaController.create);
router.get('/', authMiddleware, citaController.getAll);
router.get('/:id', authMiddleware, citaController.getById);
router.patch('/:id', authMiddleware, citaController.update);
router.post('/:id/cancelar', authMiddleware, citaController.cancelar);
router.delete('/:id', authMiddleware, citaController.delete); 
export default router;
