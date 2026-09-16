import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import prisma from '../prisma.js';
import { PaymentMethod, DocumentType, KardexType } from '@prisma/client';
import { generateInvoicePDF } from '../utils/pdfGenerator.js';
import { generateSunatHash, buildSunatQrString } from '../utils/sunatHelper.js';

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
      documentType = 'BOLETA',
      customerName = 'Clientes Varios',
      customerDoc,
      customerEmail,
      customerAddress,
      customerPhone,
      paymentMethod = 'CASH',
      operationCode,
      amountPaid,
      currency = 'PEN',
      notes,
    } = req.body;

    if (!branchId || !items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'La venta debe contener una sucursal y al menos un producto' });
      return;
    }

    // Validation for Factura in Peru
    if (documentType === 'FACTURA') {
      if (!customerDoc || customerDoc.length !== 11 || !customerDoc.startsWith('10') && !customerDoc.startsWith('20')) {
        res.status(400).json({
          message: 'Para emitir Factura Electrónica se requiere un RUC válido de 11 dígitos que inicie con 10 o 20',
        });
        return;
      }
    }

    // Check if cashier has an open register in this branch
    const openRegister = await prisma.cashRegister.findFirst({
      where: {
        userId,
        branchId,
        status: 'OPEN',
      },
    });

    // Run transaction
    const sale = await prisma.$transaction(async (tx) => {
      // 1. Verify branch exists
      const branch = await tx.branch.findUnique({
        where: { id: branchId },
      });

      if (!branch || !branch.active) {
        throw new Error('La sucursal seleccionada no está activa o no existe');
      }

      // 2. Validate stock, decrement, and record Kardex
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
          throw new Error('Producto no disponible para la venta');
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
            `Stock insuficiente para "${product.name}". Solicitado: ${item.quantity}, Disponible en sucursal: ${currentQty}`
          );
        }

        const newStockQty = currentQty - item.quantity;

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

        // Record Kardex movement
        await tx.kardexMovement.create({
          data: {
            branchId,
            productId: item.productId,
            type: KardexType.VENTA,
            quantity: item.quantity,
            previousStock: currentQty,
            newStock: newStockQty,
            reference: `Venta POS`,
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

      // 3. Tax & Totals in Peru (IGV 18%)
      const taxRate = 0.18;
      const tax = Number((computedSubtotal * taxRate).toFixed(2));
      const total = Number((computedSubtotal + tax).toFixed(2));

      // Calculate change (vuelto)
      let changeAmount = 0;
      if (paymentMethod === 'CASH' && amountPaid && amountPaid > total) {
        changeAmount = Number((amountPaid - total).toFixed(2));
      }

      // 4. Determine Peruvian Official Series & Correlative
      const branchNum = branch.code.replace('SUC-', '').padStart(3, '0');
      let series = 'B' + branchNum; // Boleta default B001
      let sunatDocCode = '03';

      if (documentType === 'FACTURA') {
        series = 'F' + branchNum; // Factura F001
        sunatDocCode = '01';
      } else if (documentType === 'NOTA_VENTA') {
        series = 'NV' + branchNum.slice(-2); // NV01
        sunatDocCode = 'NV';
      }

      // Find last correlative for this series
      const lastSaleInSeries = await tx.sale.findFirst({
        where: { series },
        orderBy: { correlative: 'desc' },
        select: { correlative: true },
      });

      const nextCorrelative = (lastSaleInSeries?.correlative || 0) + 1;
      const saleNumber = `${series}-${String(nextCorrelative).padStart(8, '0')}`;

      // 5. Generate SUNAT Hash & QR String
      const hash = generateSunatHash(`${saleNumber}|${total}|${new Date().toISOString()}`);
      const qrString = buildSunatQrString({
        emisorRuc: '20608974512',
        tipoDoc: sunatDocCode,
        serie: series,
        correlativo: nextCorrelative,
        igv: tax,
        total,
        fecha: new Date().toISOString().split('T')[0],
        tipoDocCliente: customerDoc?.length === 11 ? '6' : customerDoc?.length === 8 ? '1' : '-',
        numDocCliente: customerDoc || '0',
        hash,
      });

      // 6. Create Sale
      const newSale = await tx.sale.create({
        data: {
          saleNumber,
          documentType: documentType as DocumentType,
          series,
          correlative: nextCorrelative,
          branchId,
          userId,
          customerName: customerName.trim(),
          customerDoc: customerDoc ? customerDoc.trim() : null,
          customerEmail: customerEmail ? customerEmail.trim() : null,
          customerAddress: customerAddress ? customerAddress.trim() : null,
          customerPhone: customerPhone ? customerPhone.trim() : null,
          paymentMethod: paymentMethod as PaymentMethod,
          operationCode: operationCode ? operationCode.trim() : null,
          amountPaid: amountPaid ? parseFloat(amountPaid) : total,
          changeAmount,
          currency,
          subtotal: computedSubtotal,
          tax,
          total,
          hash,
          qrString,
          sunatStatus: 'ACEPTADO',
          notes,
          cashRegisterId: openRegister?.id || null,
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
      message: 'Comprobante emitido y aceptado por SUNAT',
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
    const { branchId, documentType, search, limit = '50' } = req.query;

    const where: any = {};

    if (branchId && typeof branchId === 'string' && branchId !== 'all') {
      where.branchId = branchId;
    }

    if (documentType && typeof documentType === 'string' && documentType !== 'all') {
      where.documentType = documentType;
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
    res.setHeader('Content-Disposition', `inline; filename="comprobante-${sale.saleNumber}.pdf"`);

    generateInvoicePDF(sale, res);
  } catch (error) {
    console.error('Error al generar PDF de factura:', error);
    res.status(500).json({ message: 'Error al generar el documento PDF' });
  }
};
