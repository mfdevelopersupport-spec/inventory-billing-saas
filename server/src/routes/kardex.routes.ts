import { Router } from 'express';
import { getKardexMovements, exportSireReport } from '../controllers/kardexController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = Router();

router.get('/movements', authenticateToken, getKardexMovements);
router.get('/sire-export', authenticateToken, exportSireReport);

export default router;
