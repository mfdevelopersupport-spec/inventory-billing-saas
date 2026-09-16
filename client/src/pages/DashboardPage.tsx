import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DashboardStats } from '../types';
import {
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  Package,
  Building2,
  Calendar,
  FileDown,
  ArrowUpRight,
} from 'lucide-react';

interface DashboardProps {
  onNavigateToTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({ onNavigateToTab }) => {
  const { selectedBranch } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboardStats(selectedBranch ? selectedBranch.id : undefined);
      setStats(data);
    } catch (err) {
      console.error('Error al cargar métricas del dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedBranch]);

  if (loading || !stats) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <div className="pulse-indicator" style={{ width: '18px', height: '18px' }} />
        <div style={{ marginTop: '14px', color: 'var(--text-muted)' }}>
          Cargando métricas ejecutivas en tiempo real...
        </div>
      </div>
    );
  }

  const { metrics, lowStockAlerts, outOfStockAlerts, salesByBranch, topProducts, recentSales } =
    stats;

  const maxBranchSales = Math.max(...salesByBranch.map((b) => b.totalSales), 1);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Ejecutivo & KPIs</h1>
          <p className="page-subtitle">
            Rendimiento comercial y estado de inventario para{' '}
            <strong>{selectedBranch ? `${selectedBranch.name}` : 'Todas las Sucursales'}</strong>
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => onNavigateToTab('pos')}>
          <ShoppingCart size={18} />
          Nueva Venta (POS)
        </button>
      </div>

      {/* 4 Top KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '28px',
        }}
      >
        {/* Total Revenue */}
        <div className="card card-hover" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(59, 130, 246, 0.15)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <DollarSign size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              INGRESOS TOTALES
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>
              ${metrics.totalRevenue.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--success)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <TrendingUp size={12} /> {metrics.totalSalesCount} transacciones
            </div>
          </div>
        </div>

        {/* Today Revenue */}
        <div className="card card-hover" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShoppingCart size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              FACTURACIÓN DE HOY
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.2 }}>
              ${metrics.todayRevenue.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {metrics.todaySalesCount} ventas registradas hoy
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card card-hover" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(245, 158, 11, 0.15)',
              color: 'var(--warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AlertTriangle size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              PRODUCTOS STOCK BAJO
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--warning)', lineHeight: 1.2 }}>
              {metrics.lowStockCount}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Por debajo del umbral mínimo
            </div>
          </div>
        </div>

        {/* Out of Stock Alerts */}
        <div className="card card-hover" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.15)',
              color: 'var(--danger)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Package size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              PRODUCTOS AGOTADOS
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--danger)', lineHeight: 1.2 }}>
              {metrics.outOfStockCount}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--danger)', marginTop: '2px' }}>
              Requieren reabastecimiento
            </div>
          </div>
        </div>
      </div>

      {/* Charts & Analytics Section */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '24px',
          marginBottom: '28px',
        }}
      >
        {/* Sales by Branch Comparative Chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={18} color="var(--primary)" />
              Facturación por Sucursal
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sincronizado</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {salesByBranch.map((branch) => {
              const percentage = Math.round((branch.totalSales / maxBranchSales) * 100);

              return (
                <div key={branch.branchId}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.86rem' }}>
                    <span style={{ fontWeight: 600 }}>
                      {branch.name} ({branch.code})
                    </span>
                    <span style={{ fontWeight: 800, color: 'var(--primary)' }}>
                      ${branch.totalSales.toFixed(2)} USD
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div
                    style={{
                      height: '10px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--bg-body)',
                      overflow: 'hidden',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${percentage}%`,
                        background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)',
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 Best Selling Products */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="var(--success)" />
              Top 5 Productos Más Vendidos
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Por volumen</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {topProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                No hay suficientes ventas registradas para el ranking.
              </div>
            ) : (
              topProducts.map((p, idx) => (
                <div
                  key={p.productId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: idx === 0 ? 'var(--primary)' : 'var(--bg-card)',
                        color: idx === 0 ? '#ffffff' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>{p.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>SKU: {p.sku}</div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      {p.quantitySold} unid.
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>
                      ${p.totalRevenue.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Critical Stock Alerts & Recent Sales */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '24px',
        }}
      >
        {/* Critical Alerts table */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="var(--warning)" />
              Inventario en Estado Crítico
            </h3>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigateToTab('inventory')}
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
            >
              Ver Todo
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[...outOfStockAlerts, ...lowStockAlerts].slice(0, 5).map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: item.quantity === 0 ? 'var(--danger-bg)' : 'var(--warning-bg)',
                  border: `1px solid ${item.quantity === 0 ? 'var(--danger-border)' : 'var(--warning-border)'}`,
                  fontSize: '0.82rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{item.product}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {item.branch} ({item.branchCode})
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`badge ${item.quantity === 0 ? 'badge-danger' : 'badge-warning'}`}>
                    {item.quantity === 0 ? 'AGOTADO' : `${item.quantity} disponibles`}
                  </span>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '3px 8px', fontSize: '0.7rem' }}
                    onClick={() => onNavigateToTab('transfers')}
                    title="Transferir stock a esta sucursal"
                  >
                    Transferir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Sales Activity */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="var(--primary)" />
              Últimas Facturas Emitidas
            </h3>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigateToTab('sales')}
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
            >
              Ver Historial
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recentSales.map((sale) => (
              <div
                key={sale.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.82rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>
                      {sale.saleNumber}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                      {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                    {sale.customerName} ({sale.branch.code})
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-main)' }}>
                    ${sale.total.toFixed(2)}
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '4px 8px' }}
                    onClick={async () => {
                      try {
                        await api.downloadSalePdf(sale.id, sale.saleNumber);
                      } catch (e: any) {
                        alert(e.message);
                      }
                    }}
                    title="Descargar Comprobante PDF"
                  >
                    <FileDown size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
