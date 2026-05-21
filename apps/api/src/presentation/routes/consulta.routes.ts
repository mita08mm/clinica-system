import { Router } from 'express';
import { ConsultaController } from '../controllers/ConsultaController';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// POST /api/consultas - Crear nueva consulta médica
router.post('/', ConsultaController.create);

// GET /api/consultas/:id - Obtener consulta por ID
router.get('/:id', ConsultaController.getById);

// PUT /api/consultas/:id - Actualizar consulta
router.put('/:id', ConsultaController.update);

export default router;
