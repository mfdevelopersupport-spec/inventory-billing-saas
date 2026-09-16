import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = Router();

router.get('/stats', authenticateToken, getDashboardStats);

export default router;
