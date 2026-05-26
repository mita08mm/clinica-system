import { Router } from 'express';
import { DocumentoController } from '../controllers/DocumentoController';
import { authMiddleware } from '../middlewares/auth.middleware';

export const router: Router = Router();

router.use(authMiddleware);

router.get('/', DocumentoController.list);
router.post('/', DocumentoController.create);
router.get('/:id', DocumentoController.getById);
router.put('/:id', DocumentoController.update);
router.delete('/:id', DocumentoController.delete);

export default router;