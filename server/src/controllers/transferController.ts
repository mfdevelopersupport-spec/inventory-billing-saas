import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import prisma from '../prisma.js';

interface TransferItemInput {
  productId: string;
  quantity: number;
}

export const createTransfer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    const { fromBranchId, toBranchId, items, notes } = req.body;

    if (!fromBranchId || !toBranchId || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'Sucursal origen, sucursal destino y productos requeridos' });
      return;
    }

    if (fromBranchId === toBranchId) {
      res.status(400).json({ message: 'La sucursal de origen y destino no pueden ser la misma' });
      return;
    }

    const transfer = await prisma.$transaction(async (tx) => {
      // 1. Verify branches
      const fromBranch = await tx.branch.findUnique({ where: { id: fromBranchId } });
      const toBranch = await tx.branch.findUnique({ where: { id: toBranchId } });

      if (!fromBranch || !toBranch) {
        throw new Error('Sucursal origen o destino no válida');
      }

      // 2. Validate and adjust stocks
      const transferItemsToCreate: Array<{ productId: string; quantity: number }> = [];

      for (const item of items as TransferItemInput[]) {
        if (!item.productId || !item.quantity || item.quantity <= 0) {
          throw new Error('Cantidad de transferencia inválida');
        }

        const originStock = await tx.branchStock.findUnique({
          where: {
            branchId_productId: {
              branchId: fromBranchId,
              productId: item.productId,
            },
          },
          include: { product: true },
        });

        if (!originStock || originStock.quantity < item.quantity) {
          throw new Error(
            `Stock insuficiente en ${fromBranch.name} para "${originStock?.product.name || 'el producto'}". Disponible: ${originStock?.quantity || 0}`
          );
        }

        // Decrement from origin
        await tx.branchStock.update({
          where: {
            branchId_productId: {
              branchId: fromBranchId,
              productId: item.productId,
            },
          },
          data: {
            quantity: { decrement: item.quantity },
          },
        });

        // Increment in destination (upsert in case record doesn't exist)
        await tx.branchStock.upsert({
          where: {
            branchId_productId: {
              branchId: toBranchId,
              productId: item.productId,
            },
          },
          update: {
            quantity: { increment: item.quantity },
          },
          create: {
            branchId: toBranchId,
            productId: item.productId,
            quantity: item.quantity,
            minStockAlert: originStock.minStockAlert,
          },
        });

        transferItemsToCreate.push({
          productId: item.productId,
          quantity: item.quantity,
        });
      }

      // 3. Generate transfer number
      const countTransfers = await tx.stockTransfer.count();
      const transferNumber = `TRF-${String(countTransfers + 1).padStart(5, '0')}`;

      // 4. Create transfer record
      const newTransfer = await tx.stockTransfer.create({
        data: {
          transferNumber,
          fromBranchId,
          toBranchId,
          userId,
          notes,
          items: {
            create: transferItemsToCreate,
          },
        },
        include: {
          fromBranch: true,
          toBranch: true,
          user: { select: { name: true } },
          items: {
            include: { product: true },
          },
        },
      });

      return newTransfer;
    });

    res.status(201).json({
      message: 'Transferencia de inventario realizada con éxito',
      transfer,
    });
  } catch (error: any) {
    console.error('Error al transferir inventario:', error);
    res.status(400).json({ message: error.message || 'Error al procesar transferencia' });
  }
};

export const getTransfers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { branchId } = req.query;

    const where: any = {};
    if (branchId && typeof branchId === 'string' && branchId !== 'all') {
      where.OR = [{ fromBranchId: branchId }, { toBranchId: branchId }];
    }

    const transfers = await prisma.stockTransfer.findMany({
      where,
      include: {
        fromBranch: { select: { id: true, name: true, code: true } },
        toBranch: { select: { id: true, name: true, code: true } },
        user: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({ transfers });
  } catch (error) {
    res.status(500).json({ message: 'Error al consultar transferencias' });
  }
};
