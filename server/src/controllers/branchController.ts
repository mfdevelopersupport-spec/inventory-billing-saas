import { Request, Response } from 'express';
import prisma from '../prisma.js';

export const getBranches = async (_req: Request, res: Response): Promise<void> => {
  try {
    const branches = await prisma.branch.findMany({
      where: { active: true },
      orderBy: { code: 'asc' },
      include: {
        _count: {
          select: {
            users: true,
            sales: true,
            stocks: true,
          },
        },
      },
    });

    res.json({ branches });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener sucursales' });
  }
};

export const createBranch = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, code, address, phone, isMain } = req.body;

    if (!name || !code || !address) {
      res.status(400).json({ message: 'Nombre, código y dirección son obligatorios' });
      return;
    }

    const existingCode = await prisma.branch.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (existingCode) {
      res.status(400).json({ message: 'El código de sucursal ya existe' });
      return;
    }

    // Create branch and automatically create BranchStock entries for all existing products
    const branch = await prisma.$transaction(async (tx) => {
      const newBranch = await tx.branch.create({
        data: {
          name,
          code: code.toUpperCase().trim(),
          address,
          phone,
          isMain: Boolean(isMain),
        },
      });

      const allProducts = await tx.product.findMany({ select: { id: true, minStockAlert: true } });
      if (allProducts.length > 0) {
        await tx.branchStock.createMany({
          data: allProducts.map((p) => ({
            branchId: newBranch.id,
            productId: p.id,
            quantity: 0,
            minStockAlert: p.minStockAlert,
          })),
        });
      }

      return newBranch;
    });

    res.status(201).json({ branch });
  } catch (error) {
    console.error('Error al crear sucursal:', error);
    res.status(500).json({ message: 'Error al crear la sucursal' });
  }
};
