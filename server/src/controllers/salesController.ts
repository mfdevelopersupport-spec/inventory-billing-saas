import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import prisma from '../prisma.js';
import { PaymentMethod } from '@prisma/client';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';

interface CartItemInput {
  productId: string;
  quantity: number;
}

export const createSale = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    const {
      branchId,
      items,
      customerName = 'Consumidor Final',
      customerDoc,
      customerEmail,
      paymentMethod = 'CASH',
      notes,
    } = req.body;

    if (!branchId || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'La venta debe contener una sucursal y al menos un producto' });
      return;
    }

    // Run transaction
    const sale = await prisma.$transaction(async (tx) => {
      // 1. Verify branch exists
      const branch = await tx.branch.findUnique({
        where: { id: branchId },
      });

      if (!branch || !branch.active) {
        throw new Error('La sucursal seleccionada no está activa o no existe');
      }

      // 2. Validate stock and compute totals
      let computedSubtotal = 0;
      const saleItemsToCreate: Array<{
        productId: string;
        quantity: number;
        unitPrice: number;
        subtotal: number;
      }> = [];

      for (const item of items as CartItemInput[]) {
        if (!item.productId || !item.quantity || item.quantity <= 0) {
          throw new Error('Cantidad de producto inválida');
        }

        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product || !product.active) {
          throw new Error(`Producto no disponible para la venta`);
        }

        const branchStock = await tx.branchStock.findUnique({
          where: {
            branchId_productId: {
              branchId,
              productId: item.productId,
            },
          },
        });

        const currentQty = branchStock ? branchStock.quantity : 0;

        if (currentQty < item.quantity) {
          throw new Error(
            `Stock insuficiente para "${product.name}". Solicitado: ${item.quantity}, Disponible: ${currentQty}`
          );
        }

        // Decrement stock atomically
        await tx.branchStock.update({
          where: {
            branchId_productId: {
              branchId,
              productId: item.productId,
            },
          },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });

        const itemSubtotal = Number((product.price * item.quantity).toFixed(2));
        computedSubtotal += itemSubtotal;

        saleItemsToCreate.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product.price,
          subtotal: itemSubtotal,
        });
      }

      // 3. Calculate tax & total
      const taxRate = 0.18; // 18% IVA/IGV
      const tax = Number((computedSubtotal * taxRate).toFixed(2));
      const total = Number((computedSubtotal + tax).toFixed(2));

      // 4. Generate sequential sale number
      const prefix = customerDoc && customerDoc.length === 11 ? 'FAC' : 'BOL';
      const branchNumber = branch.code.replace('SUC-', '');
      const countToday = await tx.sale.count({
        where: { branchId },
      });
      const sequential = String(countToday + 1).padStart(4, '0');
      const saleNumber = `${prefix}-${branchNumber}-${sequential}`;

      // 5. Create Sale
      const newSale = await tx.sale.create({
        data: {
          saleNumber,
          branchId,
          userId,
          customerName: customerName.trim(),
          customerDoc: customerDoc ? customerDoc.trim() : null,
          customerEmail: customerEmail ? customerEmail.trim() : null,
          paymentMethod: paymentMethod as PaymentMethod,
          subtotal: computedSubtotal,
          tax,
          total,
          notes,
          items: {
            create: saleItemsToCreate,
          },
        },
        include: {
          branch: true,
          user: { select: { id: true, name: true, email: true } },
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      return newSale;
    });

    res.status(201).json({
      message: 'Venta registrada con éxito',
      sale,
    });
  } catch (error: any) {
    console.error('Error al procesar la venta:', error);
    res.status(400).json({
      message: error.message || 'Error al procesar la transacción de venta',
    });
  }
};

export const getSales = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { branchId, search, limit = '50' } = req.query;

    const where: any = {};

    if (branchId && typeof branchId === 'string' && branchId !== 'all') {
      where.branchId = branchId;
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { saleNumber: { contains: search } },
        { customerName: { contains: search } },
        { customerDoc: { contains: search } },
      ];
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true, code: true } },
        user: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
    });

    res.json({ sales });
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ message: 'Error al consultar historial de ventas' });
  }
};

export const getSaleById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        branch: true,
        user: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!sale) {
      res.status(404).json({ message: 'Comprobante de venta no encontrado' });
      return;
    }

    res.json({ sale });
  } catch (error) {
    res.status(500).json({ message: 'Error al consultar venta' });
  }
};

export const getSaleInvoicePdf = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        branch: true,
        user: { select: { name: true } },
        items: {
          include: {
            product: { select: { name: true, sku: true } },
          },
        },
      },
    });

    if (!sale) {
      res.status(404).json({ message: 'Comprobante no encontrado' });
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="comprobante-${sale.saleNumber}.pdf"`);

    generateInvoicePDF(sale, res);
  } catch (error) {
    console.error('Error al generar PDF de factura:', error);
    res.status(500).json({ message: 'Error al generar el documento PDF' });
  }
};
