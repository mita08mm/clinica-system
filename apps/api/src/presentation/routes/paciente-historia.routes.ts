import { Router } from 'express';
import { HistoriaClinicaController } from '../controllers/HistoriaClinicaController';
import { ConsultaController } from '../controllers/ConsultaController';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/pacientes/:pacienteId/historia-clinica
router.get('/:pacienteId/historia-clinica', HistoriaClinicaController.getByPaciente);

// PUT /api/pacientes/:pacienteId/historia-clinica
router.put('/:pacienteId/historia-clinica', HistoriaClinicaController.update);

// GET /api/pacientes/:pacienteId/consultas
router.get('/:pacienteId/consultas', ConsultaController.getByPaciente);

export default router;
