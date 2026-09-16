import { Router } from 'express';
import {
  getProducts,
  getCategories,
  createProduct,
  updateStock,
} from '../controllers/productController.js';
import { authenticateToken, requireRoles } from '../middlewares/auth.js';
import { Role } from '@prisma/client';

const router = Router();

router.get('/', authenticateToken, getProducts);
router.get('/categories', authenticateToken, getCategories);
router.post(
  '/',
  authenticateToken,
  requireRoles(Role.SUPERADMIN, Role.BRANCH_MANAGER),
  createProduct
);
router.post(
  '/stock',
  authenticateToken,
  requireRoles(Role.SUPERADMIN, Role.BRANCH_MANAGER),
  updateStock
);

export default router;
