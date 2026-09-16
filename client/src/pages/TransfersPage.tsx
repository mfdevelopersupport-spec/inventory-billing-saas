import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { StockTransfer, Product, Branch } from '../types';
import {
  ArrowLeftRight,
  Plus,
  Building2,
  CheckCircle2,
  AlertCircle,
  Package,
  Calendar,
  X,
  Send,
} from 'lucide-react';

export const TransfersPage: React.FC = () => {
  const { branches, selectedBranch } = useAuth();
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // New Transfer Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [fromBranchId, setFromBranchId] = useState<string>('');
  const [toBranchId, setToBranchId] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const data = await api.getTransfers();
      setTransfers(data.transfers);
    } catch (err) {
      console.error('Error al cargar transferencias:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsForBranch = async (branchId: string) => {
    if (!branchId) return;
    try {
      const data = await api.getProducts({ branchId });
      setProducts(data.products);
      if (data.products.length > 0) {
        setSelectedProductId(data.products[0].id);
      }
    } catch (err) {
      console.error('Error al cargar productos de sucursal:', err);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  useEffect(() => {
    if (branches.length >= 2) {
      const from = selectedBranch ? selectedBranch.id : branches[0].id;
      const to = branches.find((b) => b.id !== from)?.id || branches[1].id;
      setFromBranchId(from);
      setToBranchId(to);
      fetchProductsForBranch(from);
    }
  }, [branches, selectedBranch]);

  const handleFromBranchChange = (newFromId: string) => {
    setFromBranchId(newFromId);
    fetchProductsForBranch(newFromId);
    if (toBranchId === newFromId) {
      const other = branches.find((b) => b.id !== newFromId);
      if (other) setToBranchId(other.id);
    }
  };

  const selectedProductObj = products.find((p) => p.id === selectedProductId);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || quantity <= 0) {
      setError('Seleccione un producto y una cantidad válida');
      return;
    }

    if (fromBranchId === toBranchId) {
      setError('La sucursal origen y destino deben ser distintas');
      return;
    }

    if (selectedProductObj && quantity > selectedProductObj.currentStock) {
      setError(`Stock insuficiente en sucursal origen (${selectedProductObj.currentStock} disponibles)`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.createTransfer({
        fromBranchId,
        toBranchId,
        items: [{ productId: selectedProductId, quantity }],
        notes,
      });

      setShowModal(false);
      setQuantity(1);
      setNotes('');
      fetchTransfers();
    } catch (err: any) {
      setError(err.message || 'Error al ejecutar la transferencia');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Transferencias de Stock entre Sucursales</h1>
          <p className="page-subtitle">
            Movimientos y reabastecimiento inter-sucursal con trazabilidad auditada
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <ArrowLeftRight size={18} />
          Nueva Transferencia
        </button>
      </div>

      {/* Transfers List */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>N° Transferencia</th>
              <th>Fecha y Hora</th>
              <th>Sucursal Origen</th>
              <th>Sucursal Destino</th>
              <th>Mercancía Transferida</th>
              <th>Operador</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="pulse-indicator" style={{ width: '14px', height: '14px' }} />
                  <div style={{ marginTop: '8px', color: 'var(--text-muted)' }}>
                    Cargando historial de transferencias...
                  </div>
                </td>
              </tr>
            ) : transfers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No se han registrado transferencias de inventario hasta el momento.
                </td>
              </tr>
            ) : (
              transfers.map((t) => (
                <tr key={t.id}>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>
                      {t.transferNumber}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                      <Calendar size={13} color="var(--text-muted)" />
                      {new Date(t.createdAt).toLocaleString('es-PE')}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                      <Building2 size={14} color="var(--danger)" />
                      <span>{t.fromBranch.name}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                      <Building2 size={14} color="var(--success)" />
                      <span>{t.toBranch.name}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {t.items.map((it, idx) => (
                        <div key={idx} style={{ fontSize: '0.82rem' }}>
                          <strong>{it.quantity}x</strong> {it.product.name}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{t.user.name}</span>
                  </td>
                  <td>
                    <span className="badge badge-success">
                      <CheckCircle2 size={12} /> Completada
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Transfer Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Programar Transferencia de Stock</h2>
              <button
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div
                style={{
                  padding: '10px 12px',
                  background: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  color: 'var(--danger)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleCreateTransfer}>
              {/* Origin and Destination Selectors */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Sucursal Origen (Emisora)</label>
                  <select
                    className="form-select"
                    value={fromBranchId}
                    onChange={(e) => handleFromBranchChange(e.target.value)}
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Sucursal Destino (Receptora)</label>
                  <select
                    className="form-select"
                    value={toBranchId}
                    onChange={(e) => setToBranchId(e.target.value)}
                  >
                    {branches
                      .filter((b) => b.id !== fromBranchId)
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Product selector */}
              <div className="form-group">
                <label className="form-label">Producto a Enviar</label>
                <select
                  className="form-select"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.currentStock <= 0}>
                      {p.name} (Stock origen: {p.currentStock})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div className="form-group">
                <label className="form-label">Cantidad a Trasladar</label>
                <input
                  type="number"
                  min="1"
                  max={selectedProductObj?.currentStock || 1}
                  className="form-input"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
                {selectedProductObj && (
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Stock disponible en origen: <strong>{selectedProductObj.currentStock} unid.</strong>
                  </span>
                )}
              </div>

              {/* Notes */}
              <div className="form-group">
                <label className="form-label">Motivo o Notas de Traslado</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="ej. Reabastecimiento por alta demanda de fin de semana"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  <Send size={18} />
                  {submitting ? 'Procesando...' : 'Ejecutar Transferencia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
