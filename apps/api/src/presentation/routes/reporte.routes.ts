import { Router, type Router as ExpressRouter } from 'express';
import { ReporteController } from '../controllers/ReporteController';

const router: ExpressRouter = Router();

router.get('/ingresos', ReporteController.getIngresos);
router.get('/pagos-pendientes', ReporteController.getPagosPendientes);

export default router;