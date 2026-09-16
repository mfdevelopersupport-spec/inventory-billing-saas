import { Router } from 'express';
import { getBranches, createBranch } from '../controllers/branchController.js';
import { authenticateToken, requireRoles } from '../middlewares/auth.js';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', authenticateToken, getBranches);
router.post('/', authenticateToken, requireRoles(Role.SUPERADMIN), createBranch);

export default router;
