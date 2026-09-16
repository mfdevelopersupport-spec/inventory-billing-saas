import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import prisma from '../prisma.js';

export const openShift = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    const { branchId, initialAmount = 0 } = req.body;
    if (!branchId) {
      res.status(400).json({ message: 'Sucursal requerida para abrir caja' });
      return;
    }

    // Check if user already has an active open register in this branch
    const existing = await prisma.cashRegister.findFirst({
      where: {
        userId,
        branchId,
        status: 'OPEN',
      },
    });

    if (existing) {
      res.status(400).json({
        message: 'Ya cuenta con un turno de caja abierto en esta sucursal',
        cashRegister: existing,
      });
      return;
    }

    const newRegister = await prisma.cashRegister.create({
      data: {
        branchId,
        userId,
        initialAmount: parseFloat(initialAmount) || 0,
        status: 'OPEN',
      },
      include: {
        branch: { select: { name: true, code: true } },
        user: { select: { name: true } },
      },
    });

    res.status(201).json({
      message: 'Caja chica abierta exitosamente',
      cashRegister: newRegister,
    });
  } catch (error) {
    console.error('Error al abrir caja:', error);
    res.status(500).json({ message: 'Error al aperturar turno de caja' });
  }
};

export const getCurrentShift = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { branchId } = req.query;

    if (!userId) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }

    const where: any = {
      status: 'OPEN',
    };

    if (branchId && typeof branchId === 'string') {
      where.branchId = branchId;
    }

    // Cashier sees their own open shift, Admin can see open shift for the branch
    if (req.user?.role === 'CASHIER') {
      where.userId = userId;
    }

    const current = await prisma.cashRegister.findFirst({
      where,
      include: {
        branch: { select: { id: true, name: true, code: true } },
        user: { select: { id: true, name: true } },
        movements: { orderBy: { createdAt: 'desc' } },
        sales: {
          select: {
            id: true,
            saleNumber: true,
            total: true,
            paymentMethod: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!current) {
      res.json({ isOpen: false, cashRegister: null });
      return;
    }

    // Recalculate totals dynamically
    const cashSales = current.sales
      .filter((s) => s.paymentMethod === 'CASH')
      .reduce((sum, s) => sum + s.total, 0);

    const yapeSales = current.sales
      .filter((s) => s.paymentMethod === 'YAPE')
      .reduce((sum, s) => sum + s.total, 0);

    const plinSales = current.sales
      .filter((s) => s.paymentMethod === 'PLIN')
      .reduce((sum, s) => sum + s.total, 0);

    const cardSales = current.sales
      .filter((s) => s.paymentMethod === 'CARD')
      .reduce((sum, s) => sum + s.total, 0);

    const transferSales = current.sales
      .filter((s) => s.paymentMethod === 'TRANSFER')
      .reduce((sum, s) => sum + s.total, 0);

    const totalIncomes = current.movements
      .filter((m) => m.type === 'INGRESO')
      .reduce((sum, m) => sum + m.amount, 0);

    const totalExpenses = current.movements
      .filter((m) => m.type === 'EGRESO')
      .reduce((sum, m) => sum + m.amount, 0);

    // Expected physical cash in cash drawer
    const expectedCashInDrawer = current.initialAmount + cashSales + totalIncomes - totalExpenses;

    const totalSalesAllMethods = cashSales + yapeSales + plinSales + cardSales + transferSales;

    res.json({
      isOpen: true,
      cashRegister: {
        ...current,
        cashSalesAmount: Number(cashSales.toFixed(2)),
        yapeSalesAmount: Number(yapeSales.toFixed(2)),
        plinSalesAmount: Number(plinSales.toFixed(2)),
        cardSalesAmount: Number(cardSales.toFixed(2)),
        transferSalesAmount: Number(transferSales.toFixed(2)),
        totalSalesAllMethods: Number(totalSalesAllMethods.toFixed(2)),
        totalIncomes: Number(totalIncomes.toFixed(2)),
        totalExpenses: Number(totalExpenses.toFixed(2)),
        expectedCashInDrawer: Number(expectedCashInDrawer.toFixed(2)),
      },
    });
  } catch (error) {
    console.error('Error al consultar caja actual:', error);
    res.status(500).json({ message: 'Error al consultar estado de caja' });
  }
};

export const addCashMovement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { cashRegisterId, type, amount, concept } = req.body;

    if (!cashRegisterId || !type || !amount || !concept) {
      res.status(400).json({ message: 'Caja, tipo (INGRESO/EGRESO), monto y concepto son requeridos' });
      return;
    }

    const register = await prisma.cashRegister.findUnique({
      where: { id: cashRegisterId },
    });

    if (!register || register.status !== 'OPEN') {
      res.status(400).json({ message: 'La caja especificada no se encuentra abierta' });
      return;
    }

    const movement = await prisma.cashMovement.create({
      data: {
        cashRegisterId,
        type,
        amount: parseFloat(amount),
        concept: concept.trim(),
      },
    });

    res.status(201).json({
      message: 'Movimiento de caja registrado',
      movement,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar movimiento de caja' });
  }
};

export const closeShift = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { cashRegisterId, finalAmount, notes } = req.body;

    if (!cashRegisterId || finalAmount === undefined) {
      res.status(400).json({ message: 'ID de caja y monto físico contado son requeridos' });
      return;
    }

    const register = await prisma.cashRegister.findUnique({
      where: { id: cashRegisterId },
      include: {
        movements: true,
        sales: true,
      },
    });

    if (!register || register.status !== 'OPEN') {
      res.status(400).json({ message: 'La caja no está abierta' });
      return;
    }

    const physicalCount = parseFloat(finalAmount);

    const cashSales = register.sales
      .filter((s) => s.paymentMethod === 'CASH')
      .reduce((sum, s) => sum + s.total, 0);

    const yapeSales = register.sales
      .filter((s) => s.paymentMethod === 'YAPE')
      .reduce((sum, s) => sum + s.total, 0);

    const plinSales = register.sales
      .filter((s) => s.paymentMethod === 'PLIN')
      .reduce((sum, s) => sum + s.total, 0);

    const cardSales = register.sales
      .filter((s) => s.paymentMethod === 'CARD')
      .reduce((sum, s) => sum + s.total, 0);

    const transferSales = register.sales
      .filter((s) => s.paymentMethod === 'TRANSFER')
      .reduce((sum, s) => sum + s.total, 0);

    const totalIncomes = register.movements
      .filter((m) => m.type === 'INGRESO')
      .reduce((sum, m) => sum + m.amount, 0);

    const totalExpenses = register.movements
      .filter((m) => m.type === 'EGRESO')
      .reduce((sum, m) => sum + m.amount, 0);

    const expectedAmount = register.initialAmount + cashSales + totalIncomes - totalExpenses;
    const differenceAmount = physicalCount - expectedAmount;

    const closed = await prisma.cashRegister.update({
      where: { id: cashRegisterId },
      data: {
        finalAmount: physicalCount,
        cashSalesAmount: cashSales,
        yapeSalesAmount: yapeSales,
        plinSalesAmount: plinSales,
        cardSalesAmount: cardSales,
        transferSalesAmount: transferSales,
        totalIncomes,
        totalExpenses,
        expectedAmount,
        differenceAmount,
        status: 'CLOSED',
        notes,
        closedAt: new Date(),
      },
      include: {
        branch: true,
        user: { select: { name: true } },
      },
    });

    res.json({
      message: 'Turno de caja cerrado con éxito (Arqueo generado)',
      cashRegister: closed,
    });
  } catch (error) {
    console.error('Error al cerrar caja:', error);
    res.status(500).json({ message: 'Error al realizar el arqueo y cierre de caja' });
  }
};

export const getShiftsHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { branchId } = req.query;
    const where: any = { status: 'CLOSED' };

    if (branchId && typeof branchId === 'string' && branchId !== 'all') {
      where.branchId = branchId;
    }

    const history = await prisma.cashRegister.findMany({
      where,
      include: {
        branch: { select: { name: true, code: true } },
        user: { select: { name: true } },
        _count: { select: { sales: true, movements: true } },
      },
      orderBy: { closedAt: 'desc' },
      take: 30,
    });

    res.json({ history });
  } catch (error) {
    res.status(500).json({ message: 'Error al consultar historial de cajas' });
  }
};
