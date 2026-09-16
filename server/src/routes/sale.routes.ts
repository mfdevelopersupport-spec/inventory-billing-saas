import { Router } from 'express';
import {
  createSale,
  getSales,
  getSaleById,
  getSaleInvoicePdf,
} from '../controllers/salesController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = Router();

router.post('/', authenticateToken, createSale);
router.get('/', authenticateToken, getSales);
router.get('/:id', authenticateToken, getSaleById);
router.get('/:id/pdf', authenticateToken, getSaleInvoicePdf);

export default router;
