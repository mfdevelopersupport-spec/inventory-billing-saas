import { Request, Response } from 'express';
import prisma from '../prisma.js';

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { branchId, categoryId, search, status } = req.query;

    const whereCondition: any = { active: true };

    if (categoryId && typeof categoryId === 'string' && categoryId !== 'all') {
      whereCondition.categoryId = categoryId;
    }

    if (search && typeof search === 'string') {
      whereCondition.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } },
      ];
    }

    const products = await prisma.product.findMany({
      where: whereCondition,
      include: {
        category: true,
        branchStocks: {
          include: {
            branch: {
              select: { id: true, name: true, code: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Map each product with computed stock info for the requested branch
    const mappedProducts = products.map((prod) => {
      const targetStock = branchId
        ? prod.branchStocks.find((s) => s.branchId === branchId)
        : null;

      const currentQuantity = targetStock
        ? targetStock.quantity
        : prod.branchStocks.reduce((sum, s) => sum + s.quantity, 0);

      const minAlert = targetStock ? targetStock.minStockAlert : prod.minStockAlert;
      const isOutOfStock = currentQuantity <= 0;
      const isLowStock = !isOutOfStock && currentQuantity <= minAlert;

      return {
        id: prod.id,
        sku: prod.sku,
        barcode: prod.barcode,
        name: prod.name,
        description: prod.description,
        price: prod.price,
        costPrice: prod.costPrice,
        category: prod.category,
        minStockAlert: minAlert,
        currentStock: currentQuantity,
        isOutOfStock,
        isLowStock,
        branchStocks: prod.branchStocks,
      };
    });

    // Filter by stock status if requested
    let filtered = mappedProducts;
    if (status === 'LOW_STOCK') {
      filtered = mappedProducts.filter((p) => p.isLowStock);
    } else if (status === 'OUT_OF_STOCK') {
      filtered = mappedProducts.filter((p) => p.isOutOfStock);
    }

    res.json({ products: filtered });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ message: 'Error al obtener productos' });
  }
};

export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      where: { active: true },
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener categorías' });
  }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sku, barcode, name, description, price, costPrice, categoryId, minStockAlert, initialStock } =
      req.body;

    if (!sku || !name || price === undefined || !categoryId) {
      res.status(400).json({ message: 'SKU, nombre, precio y categoría son obligatorios' });
      return;
    }

    const existingSku = await prisma.product.findUnique({
      where: { sku: sku.toUpperCase().trim() },
    });

    if (existingSku) {
      res.status(400).json({ message: 'El SKU ya se encuentra registrado' });
      return;
    }

    const branches = await prisma.branch.findMany({ where: { active: true } });

    const newProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          sku: sku.toUpperCase().trim(),
          barcode: barcode ? barcode.trim() : null,
          name: name.trim(),
          description,
          price: parseFloat(price),
          costPrice: costPrice ? parseFloat(costPrice) : 0,
          categoryId,
          minStockAlert: minStockAlert ? parseInt(minStockAlert) : 5,
        },
      });

      // Create stock rows for all branches
      await tx.branchStock.createMany({
        data: branches.map((b) => ({
          branchId: b.id,
          productId: product.id,
          quantity: initialStock && initialStock[b.id] !== undefined ? parseInt(initialStock[b.id]) : 0,
          minStockAlert: minStockAlert ? parseInt(minStockAlert) : 5,
        })),
      });

      return product;
    });

    res.status(201).json({ product: newProduct });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ message: 'Error al registrar producto' });
  }
};

export const updateStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { branchId, productId, quantity, minStockAlert } = req.body;

    if (!branchId || !productId || quantity === undefined) {
      res.status(400).json({ message: 'Sucursal, producto y cantidad requeridos' });
      return;
    }

    const updatedStock = await prisma.branchStock.upsert({
      where: {
        branchId_productId: {
          branchId,
          productId,
        },
      },
      update: {
        quantity: parseInt(quantity),
        ...(minStockAlert !== undefined ? { minStockAlert: parseInt(minStockAlert) } : {}),
      },
      create: {
        branchId,
        productId,
        quantity: parseInt(quantity),
        minStockAlert: minStockAlert ? parseInt(minStockAlert) : 5,
      },
      include: {
        product: true,
        branch: true,
      },
    });

    res.json({ stock: updatedStock });
  } catch (error) {
    console.error('Error al actualizar stock:', error);
    res.status(500).json({ message: 'Error al actualizar el stock' });
  }
};
