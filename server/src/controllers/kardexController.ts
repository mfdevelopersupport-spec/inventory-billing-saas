import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.js';
import prisma from '../prisma.js';

export const getKardexMovements = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { branchId, productId, type } = req.query;

    const where: any = {};
    if (branchId && typeof branchId === 'string' && branchId !== 'all') {
      where.branchId = branchId;
    }
    if (productId && typeof productId === 'string' && productId !== 'all') {
      where.productId = productId;
    }
    if (type && typeof type === 'string' && type !== 'all') {
      where.type = type;
    }

    const movements = await prisma.kardexMovement.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true, price: true } },
        branch: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json({ movements });
  } catch (error) {
    console.error('Error al consultar Kardex:', error);
    res.status(500).json({ message: 'Error al consultar movimientos de Kardex' });
  }
};

export const exportSireReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { branchId } = req.query;
    const where: any = {};
    if (branchId && typeof branchId === 'string' && branchId !== 'all') {
      where.branchId = branchId;
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        branch: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Generate CSV in SIRE (Sistema Integrado de Registros Electrónicos) format
    // Periodo|CAR SUNAT|FechaEmision|FechaVcto|TipoCP|SerieCP|NumCP|TipoDocCliente|NumDocCliente|RazonSocial|BaseImponible|IGV|Total|Moneda
    const headers = [
      'PERIODO',
      'FECHA_EMISION',
      'TIPO_COMPROBANTE',
      'SERIE',
      'NUMERO_CORRELATIVO',
      'TIPO_DOC_IDENTIDAD',
      'NUM_DOC_IDENTIDAD',
      'RAZON_SOCIAL_CLIENTE',
      'BASE_IMPONIBLE_GRAVADA',
      'IGV_18_PORCIENTO',
      'TOTAL_COMPROBANTE',
      'MONEDA',
      'ESTADO_SUNAT',
    ];

    const rows = sales.map((s) => {
      const dateStr = new Date(s.createdAt).toISOString().split('T')[0];
      const tipoCpCode = s.documentType === 'FACTURA' ? '01' : s.documentType === 'BOLETA' ? '03' : 'NV';
      const docTypeCliente = s.customerDoc?.length === 11 ? '6' : s.customerDoc?.length === 8 ? '1' : '0';

      return [
        new Date(s.createdAt).getFullYear() + String(new Date(s.createdAt).getMonth() + 1).padStart(2, '0') + '00',
        dateStr,
        tipoCpCode,
        s.series,
        String(s.correlative).padStart(8, '0'),
        docTypeCliente,
        s.customerDoc || '-',
        `"${s.customerName.replace(/"/g, '""')}"`,
        s.subtotal.toFixed(2),
        s.tax.toFixed(2),
        s.total.toFixed(2),
        s.currency,
        s.sunatStatus,
      ].join(';');
    });

    const csvContent = [headers.join(';'), ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="registro-ventas-sire-sunat.csv"');
    res.send('\uFEFF' + csvContent); // UTF-8 BOM for Excel in Peru
  } catch (error) {
    console.error('Error al exportar reporte SIRE:', error);
    res.status(500).json({ message: 'Error al exportar archivo SIRE SUNAT' });
  }
};
