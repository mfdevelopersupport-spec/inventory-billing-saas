import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import prisma from '../prisma.js';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { branchId } = req.query;

    const salesWhere: any = {};
    const stockWhere: any = {};

    if (branchId && typeof branchId === 'string' && branchId !== 'all') {
      salesWhere.branchId = branchId;
      stockWhere.branchId = branchId;
    }

    // 1. Total revenue and total sales
    const salesAggregate = await prisma.sale.aggregate({
      where: salesWhere,
      _sum: { total: true },
      _count: { id: true },
    });

    const totalRevenue = salesAggregate._sum.total || 0;
    const totalSalesCount = salesAggregate._count.id || 0;

    // 2. Today's sales
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySales = await prisma.sale.aggregate({
      where: {
        ...salesWhere,
        createdAt: { gte: today },
      },
      _sum: { total: true },
      _count: { id: true },
    });

    // 3. Products in alert (Low stock or Out of stock)
    const allStocks = await prisma.branchStock.findMany({
      where: stockWhere,
      include: {
        product: { select: { id: true, name: true, sku: true, price: true } },
        branch: { select: { id: true, name: true, code: true } },
      },
    });

    const lowStockAlerts = allStocks.filter((s) => s.quantity <= s.minStockAlert && s.quantity > 0);
    const outOfStockAlerts = allStocks.filter((s) => s.quantity === 0);

    // 4. Sales by Branch
    const branches = await prisma.branch.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        code: true,
        sales: {
          select: { total: true },
        },
      },
    });

    const salesByBranch = branches.map((b) => ({
      branchId: b.id,
      name: b.name,
      code: b.code,
      totalSales: b.sales.reduce((sum, s) => sum + s.total, 0),
      count: b.sales.length,
    }));

    // 5. Top 5 Best Selling Products
    const saleItems = await prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });

    const topProductsWithDetails = await Promise.all(
      saleItems.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, sku: true, price: true },
        });

        return {
          productId: item.productId,
          name: product?.name || 'Desconocido',
          sku: product?.sku || '',
          quantitySold: item._sum.quantity || 0,
          totalRevenue: item._sum.subtotal || 0,
        };
      })
    );

    // 6. Recent 5 Sales
    const recentSales = await prisma.sale.findMany({
      where: salesWhere,
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        branch: { select: { name: true, code: true } },
        user: { select: { name: true } },
        _count: { select: { items: true } },
      },
    });

    res.json({
      metrics: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalSalesCount,
        todayRevenue: Number((todaySales._sum.total || 0).toFixed(2)),
        todaySalesCount: todaySales._count.id || 0,
        lowStockCount: lowStockAlerts.length,
        outOfStockCount: outOfStockAlerts.length,
      },
      lowStockAlerts: lowStockAlerts.map((s) => ({
        stockId: s.id,
        branch: s.branch.name,
        branchCode: s.branch.code,
        product: s.product.name,
        sku: s.product.sku,
        quantity: s.quantity,
        minStockAlert: s.minStockAlert,
      })),
      outOfStockAlerts: outOfStockAlerts.map((s) => ({
        stockId: s.id,
        branch: s.branch.name,
        branchCode: s.branch.code,
        product: s.product.name,
        sku: s.product.sku,
        quantity: s.quantity,
      })),
      salesByBranch,
      topProducts: topProductsWithDetails,
      recentSales,
    });
  } catch (error) {
    console.error('Error al generar estadísticas del dashboard:', error);
    res.status(500).json({ message: 'Error al generar analítica del dashboard' });
  }
};
