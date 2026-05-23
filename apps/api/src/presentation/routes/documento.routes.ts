import { Router } from 'express';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { DocumentoController } from '../controllers/DocumentoController';
import { authMiddleware } from '../middlewares/auth.middleware';

export const router: Router = Router();

// Configurar directorio de uploads
const uploadsDir = process.env.UPLOADS_DIR || './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de multer para subir archivos
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido'));
    }
  },
});

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/documentos
router.get('/', DocumentoController.list);

// POST /api/documentos/upload
router.post('/upload', upload.single('file'), DocumentoController.upload);

// GET /api/documentos/:id
router.get('/:id', DocumentoController.getById);

// PUT /api/documentos/:id
router.put('/:id', DocumentoController.update);

// GET /api/documentos/:id/download
router.get('/:id/download', DocumentoController.download);

// DELETE /api/documentos/:id
router.delete('/:id', DocumentoController.delete);

export default router;
