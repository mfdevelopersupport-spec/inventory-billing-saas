import { Router } from 'express';
import {
  openShift,
  getCurrentShift,
  addCashMovement,
  closeShift,
  getShiftsHistory,
} from '../controllers/cashRegisterController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = Router();

router.post('/open', authenticateToken, openShift);
router.get('/current', authenticateToken, getCurrentShift);
router.post('/movement', authenticateToken, addCashMovement);
router.post('/close', authenticateToken, closeShift);
router.get('/history', authenticateToken, getShiftsHistory);

export default router;
