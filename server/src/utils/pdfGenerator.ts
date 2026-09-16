import PDFDocument from 'pdfkit';
import { Response } from 'express';

interface SalePDFData {
  saleNumber: string;
  createdAt: Date;
  customerName: string;
  customerDoc?: string | null;
  customerEmail?: string | null;
  paymentMethod: string;
  subtotal: number;
  tax: number;
  total: number;
  branch: {
    name: string;
    code: string;
    address: string;
    phone?: string | null;
  };
  user: {
    name: string;
  };
  items: Array<{
    quantity: number;
    unitPrice: number;
    subtotal: number;
    product: {
      sku: string;
      name: string;
    };
  }>;
}

export function generateInvoicePDF(sale: SalePDFData, res: Response): void {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  // Stream directly to HTTP response
  doc.pipe(res);

  // Header Colors & Styling
  const primaryColor = '#1e293b';
  const secondaryColor = '#64748b';
  const accentColor = '#2563eb';
  const lineColor = '#e2e8f0';

  // Header: Company info & Document Title
  doc
    .fillColor(accentColor)
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('NEXUS INVENTORY & POS', 40, 45)
    .fontSize(9)
    .font('Helvetica')
    .fillColor(secondaryColor)
    .text('Soluciones Globales de Facturación y Logística S.A.C.', 40, 72)
    .text('RUC: 20608974512  |  contacto@nexuspos.com  |  www.nexuspos.com', 40, 85);

  // Box Comprobante (Right Top)
  doc
    .rect(380, 40, 180, 75)
    .lineWidth(1)
    .strokeColor(accentColor)
    .stroke();

  const docType = sale.saleNumber.startsWith('FAC') ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA';
  doc
    .fillColor(primaryColor)
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('RUC: 20608974512', 380, 50, { align: 'center', width: 180 })
    .fillColor(accentColor)
    .fontSize(12)
    .text(docType, 380, 68, { align: 'center', width: 180 })
    .fillColor(primaryColor)
    .fontSize(13)
    .text(`N° ${sale.saleNumber}`, 380, 88, { align: 'center', width: 180 });

  // Divider Line
  doc
    .moveTo(40, 130)
    .lineTo(560, 130)
    .lineWidth(1)
    .strokeColor(lineColor)
    .stroke();

  // Branch & Customer Info Box
  doc
    .rect(40, 140, 520, 80)
    .fillColor('#f8fafc')
    .fill()
    .rect(40, 140, 520, 80)
    .strokeColor(lineColor)
    .stroke();

  // Left column: Branch
  doc
    .fillColor(secondaryColor)
    .fontSize(8)
    .font('Helvetica-Bold')
    .text('DATOS DE EMISIÓN', 55, 148)
    .font('Helvetica')
    .fillColor(primaryColor)
    .fontSize(9)
    .text(`Sucursal: ${sale.branch.name} (${sale.branch.code})`, 55, 162)
    .text(`Dirección: ${sale.branch.address}`, 55, 175)
    .text(`Fecha/Hora: ${new Date(sale.createdAt).toLocaleString('es-PE')}`, 55, 188)
    .text(`Atendido por: ${sale.user.name}`, 55, 201);

  // Right column: Customer
  doc
    .fillColor(secondaryColor)
    .fontSize(8)
    .font('Helvetica-Bold')
    .text('DATOS DEL CLIENTE', 320, 148)
    .font('Helvetica')
    .fillColor(primaryColor)
    .fontSize(9)
    .text(`Cliente: ${sale.customerName}`, 320, 162)
    .text(`Doc / RUC: ${sale.customerDoc || 'Sin documento registrado'}`, 320, 175)
    .text(`Método de Pago: ${sale.paymentMethod}`, 320, 188)
    .text(`Email: ${sale.customerEmail || 'N/A'}`, 320, 201);

  // Table Header
  const tableTop = 235;
  doc
    .rect(40, tableTop, 520, 24)
    .fillColor('#1e293b')
    .fill();

  doc
    .fillColor('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .text('CÓDIGO / SKU', 50, tableTop + 7)
    .text('DESCRIPCIÓN DEL ÍTEM', 140, tableTop + 7)
    .text('CANT.', 370, tableTop + 7, { width: 40, align: 'center' })
    .text('P. UNIT.', 420, tableTop + 7, { width: 60, align: 'right' })
    .text('IMPORTE', 490, tableTop + 7, { width: 60, align: 'right' });

  // Table Rows
  let currentY = tableTop + 24;
  doc.font('Helvetica').fontSize(8.5);

  sale.items.forEach((item, index) => {
    const isEven = index % 2 === 0;
    if (isEven) {
      doc.rect(40, currentY, 520, 22).fillColor('#f8fafc').fill();
    }

    doc
      .fillColor(primaryColor)
      .text(item.product.sku, 50, currentY + 6)
      .text(item.product.name.slice(0, 42), 140, currentY + 6)
      .text(item.quantity.toString(), 370, currentY + 6, { width: 40, align: 'center' })
      .text(`$${item.unitPrice.toFixed(2)}`, 420, currentY + 6, { width: 60, align: 'right' })
      .text(`$${item.subtotal.toFixed(2)}`, 490, currentY + 6, { width: 60, align: 'right' });

    currentY += 22;
  });

  // Divider under table
  doc
    .moveTo(40, currentY + 5)
    .lineTo(560, currentY + 5)
    .lineWidth(0.5)
    .strokeColor(lineColor)
    .stroke();

  // Financial Totals Box
  const totalsY = currentY + 15;
  const totalsX = 350;

  doc
    .rect(totalsX, totalsY, 210, 80)
    .fillColor('#f8fafc')
    .fill()
    .rect(totalsX, totalsY, 210, 80)
    .strokeColor(lineColor)
    .stroke();

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(secondaryColor)
    .text('Subtotal:', totalsX + 15, totalsY + 12)
    .text('Impuesto (IVA 18%):', totalsX + 15, totalsY + 30)
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(primaryColor)
    .text('TOTAL A PAGAR:', totalsX + 15, totalsY + 52);

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(primaryColor)
    .text(`$${sale.subtotal.toFixed(2)}`, totalsX + 110, totalsY + 12, { width: 85, align: 'right' })
    .text(`$${sale.tax.toFixed(2)}`, totalsX + 110, totalsY + 30, { width: 85, align: 'right' })
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor(accentColor)
    .text(`$${sale.total.toFixed(2)} USD`, totalsX + 110, totalsY + 50, { width: 85, align: 'right' });

  // Security and Verification Note
  doc
    .font('Helvetica-Bold')
    .fontSize(8)
    .fillColor(secondaryColor)
    .text('Representación impresa del Comprobante de Pago Electrónico', 40, totalsY + 20)
    .font('Helvetica')
    .fontSize(7.5)
    .text('Autorizado mediante Resolución de Superintendencia. Consulte la validez con el código de comprobante.', 40, totalsY + 35)
    .text('¡Gracias por su compra! Garantía y soporte oficial en cualquiera de nuestras sucursales a nivel nacional.', 40, totalsY + 50);

  // Footer bar
  doc
    .rect(40, 780, 520, 20)
    .fillColor('#f1f5f9')
    .fill();

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(secondaryColor)
    .text('Documento generado digitalmente por el Sistema SaaS de Facturación e Inventarios.', 40, 785, {
      align: 'center',
      width: 520,
    });

  doc.end();
}
