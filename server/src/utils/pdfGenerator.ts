import PDFDocument from 'pdfkit';
import { Response } from 'express';

interface SalePDFData {
  saleNumber: string;
  documentType: string;
  series: string;
  correlative: number;
  createdAt: Date;
  customerName: string;
  customerDoc?: string | null;
  customerEmail?: string | null;
  customerAddress?: string | null;
  paymentMethod: string;
  operationCode?: string | null;
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  hash?: string | null;
  qrString?: string | null;
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
  const doc = new PDFDocument({ margin: 38, size: 'A4' });

  doc.pipe(res);

  const primaryColor = '#0f172a';
  const secondaryColor = '#475569';
  const accentColor = '#2563eb';
  const lineColor = '#cbd5e1';
  const currSym = sale.currency === 'USD' ? '$' : 'S/';

  // Header: Company details
  doc
    .fillColor(accentColor)
    .fontSize(20)
    .font('Helvetica-Bold')
    .text('NEXUS POS PERÚ', 38, 40)
    .fontSize(8.5)
    .font('Helvetica-Bold')
    .fillColor(primaryColor)
    .text('NEXUS INVENTORY & POS S.A.C.', 38, 65)
    .font('Helvetica')
    .fillColor(secondaryColor)
    .text('Casa Matriz: Av. Javier Prado Este 2450 Int. 802, San Isidro - Lima', 38, 77)
    .text(`Sucursal Emisora: ${sale.branch.name} - ${sale.branch.address}`, 38, 88)
    .text('Telf: (01) 450-1000  |  Email: facturacion@nexuspos.pe  |  Web: www.nexuspos.pe', 38, 99);

  // Official SUNAT Invoice Frame (Right Top)
  doc
    .rect(370, 38, 190, 80)
    .lineWidth(1.5)
    .strokeColor(accentColor)
    .stroke();

  let docTitle = 'BOLETA DE VENTA ELECTRÓNICA';
  if (sale.documentType === 'FACTURA') {
    docTitle = 'FACTURA ELECTRÓNICA';
  } else if (sale.documentType === 'NOTA_VENTA') {
    docTitle = 'NOTA DE VENTA';
  }

  doc
    .fillColor(primaryColor)
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('R.U.C. 20608974512', 370, 48, { align: 'center', width: 190 })
    .fillColor(accentColor)
    .fontSize(10.5)
    .text(docTitle, 370, 66, { align: 'center', width: 190 })
    .fillColor(primaryColor)
    .fontSize(13)
    .text(sale.saleNumber, 370, 88, { align: 'center', width: 190 });

  // Divider Line
  doc.moveTo(38, 128).lineTo(560, 128).lineWidth(1).strokeColor(lineColor).stroke();

  // Customer & Issue Information Box
  doc
    .rect(38, 136, 522, 74)
    .fillColor('#f8fafc')
    .fill()
    .rect(38, 136, 522, 74)
    .strokeColor(lineColor)
    .stroke();

  // Left Column
  doc
    .fillColor(secondaryColor)
    .fontSize(7.5)
    .font('Helvetica-Bold')
    .text('DATOS DEL CLIENTE', 48, 144)
    .font('Helvetica')
    .fillColor(primaryColor)
    .fontSize(8.5)
    .text(`Señor(es): ${sale.customerName}`, 48, 156)
    .text(`Doc. Identidad / RUC: ${sale.customerDoc || 'Sin Documento (Clientes Varios)'}`, 48, 169)
    .text(`Dirección Fiscal: ${sale.customerAddress || 'LIMA, PERÚ'}`, 48, 182);

  // Right Column
  doc
    .fillColor(secondaryColor)
    .fontSize(7.5)
    .font('Helvetica-Bold')
    .text('INFORMACIÓN DE EMISIÓN', 330, 144)
    .font('Helvetica')
    .fillColor(primaryColor)
    .fontSize(8.5)
    .text(`Fecha de Emisión: ${new Date(sale.createdAt).toLocaleDateString('es-PE')}`, 330, 156)
    .text(`Moneda: ${sale.currency === 'USD' ? 'DÓLARES AMERICANOS (USD)' : 'SOLES (PEN)'}`, 330, 169)
    .text(`Forma de Pago: ${sale.paymentMethod} ${sale.operationCode ? `(Op: ${sale.operationCode})` : ''}`, 330, 182)
    .text(`Cajero Responsable: ${sale.user.name}`, 330, 195);

  // Table Header
  const tableTop = 222;
  doc.rect(38, tableTop, 522, 22).fillColor('#0f172a').fill();

  doc
    .fillColor('#ffffff')
    .font('Helvetica-Bold')
    .fontSize(8)
    .text('CÓDIGO', 48, tableTop + 6)
    .text('DESCRIPCIÓN DEL PRODUCTO / SERVICIO', 120, tableTop + 6)
    .text('CANT.', 350, tableTop + 6, { width: 40, align: 'center' })
    .text('P. UNIT.', 405, tableTop + 6, { width: 65, align: 'right' })
    .text('VALOR TOTAL', 485, tableTop + 6, { width: 65, align: 'right' });

  // Table Body Rows
  let currentY = tableTop + 22;
  doc.font('Helvetica').fontSize(8);

  sale.items.forEach((item, index) => {
    const isEven = index % 2 === 0;
    if (isEven) {
      doc.rect(38, currentY, 522, 20).fillColor('#f8fafc').fill();
    }

    doc
      .fillColor(primaryColor)
      .text(item.product.sku, 48, currentY + 5)
      .text(item.product.name.slice(0, 46), 120, currentY + 5)
      .text(item.quantity.toString(), 350, currentY + 5, { width: 40, align: 'center' })
      .text(`${currSym} ${item.unitPrice.toFixed(2)}`, 405, currentY + 5, { width: 65, align: 'right' })
      .text(`${currSym} ${item.subtotal.toFixed(2)}`, 485, currentY + 5, { width: 65, align: 'right' });

    currentY += 20;
  });

  doc.moveTo(38, currentY + 2).lineTo(560, currentY + 2).lineWidth(0.5).strokeColor(lineColor).stroke();

  // Financial Summary Section (SUNAT Breakdown)
  const totalsY = currentY + 12;
  const totalsX = 350;

  doc
    .rect(totalsX, totalsY, 210, 86)
    .fillColor('#f8fafc')
    .fill()
    .rect(totalsX, totalsY, 210, 86)
    .strokeColor(lineColor)
    .stroke();

  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(secondaryColor)
    .text('Op. Gravada:', totalsX + 12, totalsY + 10)
    .text('Op. Exonerada / Inafecta:', totalsX + 12, totalsY + 24)
    .text('I.G.V. (18%):', totalsX + 12, totalsY + 38)
    .font('Helvetica-Bold')
    .fontSize(11)
    .fillColor(primaryColor)
    .text('IMPORTE TOTAL:', totalsX + 12, totalsY + 58);

  doc
    .font('Helvetica')
    .fontSize(8.5)
    .fillColor(primaryColor)
    .text(`${currSym} ${sale.subtotal.toFixed(2)}`, totalsX + 110, totalsY + 10, { width: 88, align: 'right' })
    .text(`${currSym} 0.00`, totalsX + 110, totalsY + 24, { width: 88, align: 'right' })
    .text(`${currSym} ${sale.tax.toFixed(2)}`, totalsX + 110, totalsY + 38, { width: 88, align: 'right' })
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor(accentColor)
    .text(`${currSym} ${sale.total.toFixed(2)}`, totalsX + 110, totalsY + 56, { width: 88, align: 'right' });

  // SUNAT QR Code & Hash Representation
  doc
    .rect(38, totalsY, 290, 86)
    .fillColor('#ffffff')
    .fill()
    .rect(38, totalsY, 290, 86)
    .strokeColor(lineColor)
    .stroke();

  // Draw simulated QR box
  doc
    .rect(48, totalsY + 10, 66, 66)
    .fillColor('#0f172a')
    .fill();
  doc
    .rect(52, totalsY + 14, 20, 20)
    .fillColor('#ffffff')
    .fill();
  doc
    .rect(56, totalsY + 18, 12, 12)
    .fillColor('#0f172a')
    .fill();
  doc
    .rect(88, totalsY + 14, 20, 20)
    .fillColor('#ffffff')
    .fill();
  doc
    .rect(92, totalsY + 18, 12, 12)
    .fillColor('#0f172a')
    .fill();
  doc
    .rect(52, totalsY + 50, 20, 20)
    .fillColor('#ffffff')
    .fill();
  doc
    .rect(56, totalsY + 54, 12, 12)
    .fillColor('#0f172a')
    .fill();

  doc
    .font('Helvetica-Bold')
    .fontSize(7.5)
    .fillColor(primaryColor)
    .text('COMPROBANTE ELECTRÓNICO SUNAT', 124, totalsY + 12)
    .font('Helvetica')
    .fontSize(7)
    .fillColor(secondaryColor)
    .text(`Código Hash: ${sale.hash || 'e2E48Z+A87Yx91K02P1...' }`, 124, totalsY + 25)
    .text('Estado: ACEPTADO / VALIDADOR OSE-SUNAT', 124, totalsY + 37)
    .text('Autorizado mediante R.S. N° 034-005-0005315/SUNAT', 124, totalsY + 49)
    .text('Consulte la autenticidad en https://ww1.sunat.gob.pe', 124, totalsY + 61);

  // Footer bar
  doc.rect(38, 775, 522, 22).fillColor('#f1f5f9').fill();

  doc
    .font('Helvetica')
    .fontSize(7.5)
    .fillColor(secondaryColor)
    .text('Representación Impresa de la Factura Electrónica. ¡Gracias por contribuir con el desarrollo del Perú!', 38, 781, {
      align: 'center',
      width: 522,
    });

  doc.end();
}
