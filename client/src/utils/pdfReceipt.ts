import { jsPDF } from 'jspdf';
import { Sale } from '../types';

export function generateClientReceiptPDF(sale: Sale) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 220], // 80mm thermal roll
  });

  // Header Emisor
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('NEXUS POS DEL PERÚ S.A.C.', 40, 9, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('RUC: 20608974512', 40, 13.5, { align: 'center' });
  doc.text('Av. Javier Prado Este 2450 Int. 802, San Isidro', 40, 17, { align: 'center' });
  doc.text(`Sucursal: ${sale.branch.name}`, 40, 20.5, { align: 'center' });

  doc.setLineWidth(0.2);
  doc.line(5, 23, 75, 23);

  // Documento SUNAT
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  const docTitle =
    sale.documentType === 'FACTURA'
      ? 'FACTURA ELECTRÓNICA'
      : sale.documentType === 'NOTA_VENTA'
      ? 'NOTA DE VENTA'
      : 'BOLETA DE VENTA ELECTRÓNICA';
  doc.text(docTitle, 40, 27.5, { align: 'center' });
  doc.setFontSize(10);
  doc.text(sale.saleNumber, 40, 32, { align: 'center' });

  doc.line(5, 34.5, 75, 34.5);

  // Datos de emisión y cliente
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Fecha/Hora: ${new Date(sale.createdAt).toLocaleString('es-PE')}`, 5, 38.5);
  doc.text(`Cajero: ${sale.user.name}`, 5, 42);
  doc.text(`Cliente: ${sale.customerName}`, 5, 45.5);
  if (sale.customerDoc) {
    const docLabel = sale.customerDoc.length === 11 ? 'RUC' : 'DNI';
    doc.text(`${docLabel}: ${sale.customerDoc}`, 5, 49);
  }
  if (sale.customerAddress) {
    doc.text(`Dir: ${sale.customerAddress.slice(0, 32)}`, 5, 52.5);
  }

  const startY = sale.customerAddress ? 56 : sale.customerDoc ? 52.5 : 49;
  doc.line(5, startY, 75, startY);

  // Items Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('DESCRIPCIÓN', 5, startY + 3.5);
  doc.text('CANT', 48, startY + 3.5, { align: 'right' });
  doc.text('TOTAL', 75, startY + 3.5, { align: 'right' });

  doc.line(5, startY + 5.5, 75, startY + 5.5);

  // Items Body
  let curY = startY + 9;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);

  sale.items.forEach((item) => {
    const name = item.product.name.length > 22 ? item.product.name.substring(0, 22) + '...' : item.product.name;
    doc.text(name, 5, curY);
    doc.text(`${item.quantity} x S/${item.unitPrice.toFixed(2)}`, 50, curY, { align: 'right' });
    doc.text(`S/${item.subtotal.toFixed(2)}`, 75, curY, { align: 'right' });
    curY += 4.5;
  });

  doc.line(5, curY, 75, curY);
  curY += 3.5;

  // Desglose Tributario SUNAT
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Op. Gravada:', 45, curY, { align: 'right' });
  doc.text(`S/ ${sale.subtotal.toFixed(2)}`, 75, curY, { align: 'right' });
  curY += 3.8;

  doc.text('I.G.V. (18%):', 45, curY, { align: 'right' });
  doc.text(`S/ ${sale.tax.toFixed(2)}`, 75, curY, { align: 'right' });
  curY += 4.2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('TOTAL:', 45, curY, { align: 'right' });
  doc.text(`S/ ${sale.total.toFixed(2)}`, 75, curY, { align: 'right' });
  curY += 5;

  // Pagos y Vuelto
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Medio de Pago: ${sale.paymentMethod}`, 5, curY);
  if (sale.operationCode) {
    doc.text(`Op: ${sale.operationCode}`, 75, curY, { align: 'right' });
  }
  curY += 3.5;

  if (sale.paymentMethod === 'CASH' && sale.amountPaid && sale.amountPaid > sale.total) {
    doc.text(`Pagó con: S/ ${sale.amountPaid.toFixed(2)}`, 5, curY);
    doc.text(`Vuelto: S/ ${(sale.changeAmount || 0).toFixed(2)}`, 75, curY, { align: 'right' });
    curY += 4;
  }

  doc.line(5, curY, 75, curY);
  curY += 4;

  // SUNAT Footer & Hash
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.text('Representación Impresa del Comprobante Electrónico', 40, curY, { align: 'center' });
  curY += 3.2;
  doc.text(`Hash: ${sale.hash || 'e2E48Z+A87Yx91K02P1...' }`, 40, curY, { align: 'center' });
  curY += 3.2;
  doc.text('Autorizado por SUNAT mediante R.S. N° 034-005-0005315', 40, curY, { align: 'center' });
  curY += 4.5;
  doc.text('¡Gracias por su compra en el Perú!', 40, curY, { align: 'center' });

  doc.save(`ticket-${sale.saleNumber}.pdf`);
}
