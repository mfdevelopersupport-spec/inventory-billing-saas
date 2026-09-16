import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Sale } from '../types';
import { generateClientReceiptPDF } from '../utils/pdfReceipt';
import {
  ReceiptText,
  Search,
  FileDown,
  Printer,
  Calendar,
  Eye,
  X,
  CreditCard,
  Banknote,
  Building,
} from 'lucide-react';

export const SalesHistoryPage: React.FC = () => {
  const { selectedBranch } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const data = await api.getSales({
        branchId: selectedBranch ? selectedBranch.id : undefined,
        search: search ? search : undefined,
      });
      setSales(data.sales);
    } catch (err) {
      console.error('Error al cargar ventas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [selectedBranch, search]);

  const handleDownloadPdf = async (sale: Sale) => {
    try {
      await api.downloadSalePdf(sale.id, sale.saleNumber);
    } catch (e: any) {
      alert('Error descargando PDF: ' + e.message);
    }
  };

  const handlePrintTicket = (sale: Sale) => {
    generateClientReceiptPDF(sale);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Historial de Ventas & Comprobantes</h1>
          <p className="page-subtitle">
            Registro de transacciones comerciales, facturas y boletas emitidas
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '20px', display: 'flex', gap: '14px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '38px' }}
            placeholder="Buscar por N° comprobante (ej. FAC-001), cliente o documento RUC/DNI..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Sales Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>N° Comprobante</th>
              <th>Fecha / Hora</th>
              <th>Sucursal</th>
              <th>Cliente & Documento</th>
              <th>Método de Pago</th>
              <th style={{ textAlign: 'right' }}>Total (USD)</th>
              <th style={{ textAlign: 'center' }}>Acciones & PDF</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="pulse-indicator" style={{ width: '14px', height: '14px' }} />
                  <div style={{ marginTop: '8px', color: 'var(--text-muted)' }}>
                    Cargando ventas...
                  </div>
                </td>
              </tr>
            ) : sales.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No se han registrado comprobantes con los criterios de búsqueda.
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr key={sale.id}>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--primary)' }}>
                      {sale.saleNumber}
                    </span>
                  </td>

                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                      <Calendar size={13} color="var(--text-muted)" />
                      {new Date(sale.createdAt).toLocaleString('es-PE')}
                    </div>
                  </td>

                  <td>
                    <span style={{ fontWeight: 600 }}>{sale.branch.name}</span>
                  </td>

                  <td>
                    <div style={{ fontWeight: 600 }}>{sale.customerName}</div>
                    {sale.customerDoc && (
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        Doc: {sale.customerDoc}
                      </div>
                    )}
                  </td>

                  <td>
                    <span className="badge badge-primary">
                      {sale.paymentMethod === 'CASH' && <Banknote size={12} />}
                      {sale.paymentMethod === 'CARD' && <CreditCard size={12} />}
                      {sale.paymentMethod === 'TRANSFER' && <Building size={12} />}
                      {sale.paymentMethod}
                    </span>
                  </td>

                  <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>
                    ${sale.total.toFixed(2)}
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        title="Ver Detalle"
                        onClick={() => setSelectedSale(sale)}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        title="Descargar Factura Oficial PDF"
                        onClick={() => handleDownloadPdf(sale)}
                      >
                        <FileDown size={14} />
                        PDF
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        title="Imprimir Ticket POS"
                        onClick={() => handlePrintTicket(sale)}
                      >
                        <Printer size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Sale Detail Modal */}
      {selectedSale && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '620px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                  Comprobante {selectedSale.saleNumber}
                </h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {new Date(selectedSale.createdAt).toLocaleString('es-PE')} | {selectedSale.branch.name}
                </span>
              </div>
              <button
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setSelectedSale(null)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Customer info */}
            <div
              style={{
                padding: '12px 16px',
                background: 'var(--bg-body)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '16px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                fontSize: '0.84rem',
              }}
            >
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>CLIENTE:</div>
                <strong>{selectedSale.customerName}</strong>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>DOC. IDENTIDAD / RUC:</div>
                <strong>{selectedSale.customerDoc || 'N/A'}</strong>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>MÉTODO DE PAGO:</div>
                <strong>{selectedSale.paymentMethod}</strong>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>CAJERO:</div>
                <strong>{selectedSale.user.name}</strong>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="table-container" style={{ marginBottom: '16px' }}>
              <table className="custom-table" style={{ fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    <th>Ítem</th>
                    <th style={{ textAlign: 'center' }}>Cant.</th>
                    <th style={{ textAlign: 'right' }}>P. Unit</th>
                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSale.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.product.name}</td>
                      <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right' }}>${item.unitPrice.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>${item.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div
              style={{
                padding: '14px',
                background: 'var(--bg-body)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                fontSize: '0.88rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Subtotal Neto:</span>
                <span>${selectedSale.subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Impuesto (IVA 18%):</span>
                <span>${selectedSale.tax.toFixed(2)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 800,
                  fontSize: '1.2rem',
                  color: 'var(--primary)',
                  paddingTop: '8px',
                  borderTop: '1px solid var(--border-color)',
                }}
              >
                <span>Total Facturado:</span>
                <span>${selectedSale.total.toFixed(2)} USD</span>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleDownloadPdf(selectedSale)}>
                <FileDown size={18} />
                Descargar Factura PDF
              </button>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => handlePrintTicket(selectedSale)}>
                <Printer size={18} />
                Imprimir Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
