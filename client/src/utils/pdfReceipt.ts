import { jsPDF } from 'jspdf';
import { Sale } from '../types';

export function generateClientReceiptPDF(sale: Sale) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 200], // Standard POS thermal receipt roll format
  });

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('NEXUS POS ENTERPRISE', 40, 10, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Soluciones de Facturación S.A.C.', 40, 15, { align: 'center' });
  doc.text('RUC: 20608974512', 40, 19, { align: 'center' });
  doc.text(`Sucursal: ${sale.branch.name}`, 40, 23, { align: 'center' });

  doc.setLineWidth(0.2);
  doc.line(5, 26, 75, 26);

  // Document details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`COMPROBANTE: ${sale.saleNumber}`, 5, 31);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Fecha: ${new Date(sale.createdAt).toLocaleString('es-PE')}`, 5, 36);
  doc.text(`Cajero: ${sale.user.name}`, 5, 40);
  doc.text(`Cliente: ${sale.customerName}`, 5, 44);
  if (sale.customerDoc) {
    doc.text(`Doc: ${sale.customerDoc}`, 5, 48);
  }
  doc.text(`Pago: ${sale.paymentMethod}`, 5, sale.customerDoc ? 52 : 48);

  const startY = sale.customerDoc ? 56 : 52;
  doc.line(5, startY, 75, startY);

  // Items Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('DESCRIPCIÓN', 5, startY + 4);
  doc.text('CANT', 46, startY + 4, { align: 'right' });
  doc.text('TOTAL', 75, startY + 4, { align: 'right' });

  doc.line(5, startY + 6, 75, startY + 6);

  // Items
  let curY = startY + 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);

  sale.items.forEach((item) => {
    const name = item.product.name.length > 22 ? item.product.name.substring(0, 22) + '...' : item.product.name;
    doc.text(name, 5, curY);
    doc.text(`${item.quantity}x$${item.unitPrice.toFixed(2)}`, 48, curY, { align: 'right' });
    doc.text(`$${item.subtotal.toFixed(2)}`, 75, curY, { align: 'right' });
    curY += 5;
  });

  doc.line(5, curY, 75, curY);
  curY += 4;

  // Financials
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('Subtotal:', 45, curY, { align: 'right' });
  doc.text(`$${sale.subtotal.toFixed(2)}`, 75, curY, { align: 'right' });
  curY += 4;

  doc.text('IVA / IGV (18%):', 45, curY, { align: 'right' });
  doc.text(`$${sale.tax.toFixed(2)}`, 75, curY, { align: 'right' });
  curY += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL:', 45, curY, { align: 'right' });
  doc.text(`$${sale.total.toFixed(2)} USD`, 75, curY, { align: 'right' });
  curY += 8;

  // Footer Note
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('¡Gracias por su compra!', 40, curY, { align: 'center' });
  doc.text('Conserve este comprobante para cualquier garantía.', 40, curY + 3.5, { align: 'center' });

  doc.save(`ticket-${sale.saleNumber}.pdf`);
}
