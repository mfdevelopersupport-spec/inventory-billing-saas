import { Router, Request, Response } from 'express';
import { lookupRuc, lookupDni } from '../utils/sunatHelper.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = Router();

router.get('/lookup', authenticateToken, (req: Request, res: Response): void => {
  const { doc } = req.query;

  if (!doc || typeof doc !== 'string') {
    res.status(400).json({ message: 'Parámetro de documento requerido' });
    return;
  }

  const cleanDoc = doc.trim();

  if (cleanDoc.length === 11) {
    const rucInfo = lookupRuc(cleanDoc);
    if (rucInfo) {
      res.json({
        type: 'RUC',
        found: true,
        data: rucInfo,
      });
      return;
    }
  } else if (cleanDoc.length === 8) {
    const dniInfo = lookupDni(cleanDoc);
    if (dniInfo) {
      res.json({
        type: 'DNI',
        found: true,
        data: dniInfo,
      });
      return;
    }
  }

  res.status(404).json({
    found: false,
    message: 'Documento no encontrado en el padrón nacional',
  });
});

export default router;
