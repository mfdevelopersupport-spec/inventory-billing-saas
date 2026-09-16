import { Router } from 'express';
import { createTransfer, getTransfers } from '../controllers/transferController.js';
import { authenticateToken, requireRoles } from '../middlewares/auth.js';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', authenticateToken, getTransfers);
router.post(
  '/',
  authenticateToken,
  requireRoles(Role.SUPERADMIN, Role.BRANCH_MANAGER),
  createTransfer
);

export default router;
