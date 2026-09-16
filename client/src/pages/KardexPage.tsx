import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { KardexMovement } from '../types';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCcw,
} from 'lucide-react';

export const KardexPage: React.FC = () => {
  const { branches, selectedBranch } = useAuth();
  const [movements, setMovements] = useState<KardexMovement[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);

  const fetchKardex = async () => {
    setLoading(true);
    try {
      const data = await api.getKardex({
        branchId: selectedBranch ? selectedBranch.id : undefined,
        type: typeFilter === 'all' ? undefined : typeFilter,
      });
      setMovements(data.movements);
    } catch (err) {
      console.error('Error al consultar Kardex:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKardex();
  }, [selectedBranch, typeFilter]);

  const handleDownloadSire = async () => {
    setExporting(true);
    try {
      await api.downloadSireCsv(selectedBranch?.id);
    } catch (e: any) {
      alert(e.message || 'Error exportando archivo SIRE');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Kardex de Inventario & Reporte SIRE SUNAT</h1>
          <p className="page-subtitle">
            Trazabilidad física de entradas/salidas y exportación contable para el Registro de Ventas Electrónico
          </p>
        </div>

        <button className="btn btn-success" onClick={handleDownloadSire} disabled={exporting}>
          <FileSpreadsheet size={18} />
          {exporting ? 'Generando SIRE...' : 'Exportar SIRE SUNAT (CSV/Excel)'}
        </button>
      </div>

      {/* SIRE Notification Banner */}
      <div
        className="card"
        style={{
          padding: '14px 18px',
          marginBottom: '20px',
          background: 'rgba(59, 130, 246, 0.08)',
          borderColor: 'rgba(59, 130, 246, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <strong style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileSpreadsheet size={16} /> Estándar Tributario SIRE RVIE - SUNAT Perú
          </strong>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            El archivo generado contiene la codificación oficial de comprobantes, base imponible, IGV (18%) y documentos de identidad.
          </div>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={handleDownloadSire}>
          <Download size={14} /> Descargar RVIE
        </button>
      </div>

      {/* Filter bar */}
      <div className="card" style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className={`btn btn-sm ${typeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTypeFilter('all')}
          >
            Todos los Movimientos
          </button>
          <button
            className={`btn btn-sm ${typeFilter === 'VENTA' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTypeFilter('VENTA')}
          >
            <ArrowDownRight size={13} color="var(--danger)" /> Salidas por Venta
          </button>
          <button
            className={`btn btn-sm ${typeFilter === 'TRANSFERENCIA_ENTRADA' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTypeFilter('TRANSFERENCIA_ENTRADA')}
          >
            <ArrowUpRight size={13} color="var(--success)" /> Transferencias Entrada
          </button>
          <button
            className={`btn btn-sm ${typeFilter === 'AJUSTE' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTypeFilter('AJUSTE')}
          >
            <RefreshCcw size={13} color="var(--warning)" /> Ajustes Manuales
          </button>
        </div>
      </div>

      {/* Kardex Movements Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Fecha y Hora</th>
              <th>Sucursal</th>
              <th>Producto & SKU</th>
              <th>Tipo Movimiento</th>
              <th style={{ textAlign: 'center' }}>Stock Previo</th>
              <th style={{ textAlign: 'center' }}>Cantidad</th>
              <th style={{ textAlign: 'center' }}>Stock Final</th>
              <th>Referencia / Detalle</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="pulse-indicator" style={{ width: '14px', height: '14px' }} />
                  <div style={{ marginTop: '8px', color: 'var(--text-muted)' }}>Cargando asientos de Kardex...</div>
                </td>
              </tr>
            ) : movements.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No se registran movimientos en el Kardex para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              movements.map((m) => {
                const isOutflow = m.type === 'VENTA' || m.type === 'TRANSFERENCIA_SALIDA' || m.type === 'MERMA';

                return (
                  <tr key={m.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                        <Calendar size={13} color="var(--text-muted)" />
                        {new Date(m.createdAt).toLocaleString('es-PE')}
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                        <Building2 size={13} color="var(--primary)" />
                        {m.branch.name}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600 }}>{m.product.name}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {m.product.sku}
                      </div>
                    </td>

                    <td>
                      <span className={`badge ${isOutflow ? 'badge-danger' : 'badge-success'}`}>
                        {isOutflow ? <ArrowDownRight size={11} /> : <ArrowUpRight size={11} />}
                        {m.type}
                      </span>
                    </td>

                    <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{m.previousStock}</td>

                    <td
                      style={{
                        textAlign: 'center',
                        fontWeight: 800,
                        color: isOutflow ? 'var(--danger)' : 'var(--success)',
                      }}
                    >
                      {isOutflow ? `-${m.quantity}` : `+${m.quantity}`}
                    </td>

                    <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.95rem' }}>
                      {m.newStock}
                    </td>

                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {m.reference || 'Operación regular'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
