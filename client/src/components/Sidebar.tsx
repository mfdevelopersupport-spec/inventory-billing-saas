import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  ArrowLeftRight,
  ReceiptText,
  Building2,
  PackageCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { isSuperAdmin, isBranchManager } = useAuth();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard & KPIs',
      icon: LayoutDashboard,
      roles: ['SUPERADMIN', 'BRANCH_MANAGER', 'CASHIER'],
    },
    {
      id: 'pos',
      label: 'Punto de Venta (POS)',
      icon: ShoppingCart,
      badge: 'Facturación',
      roles: ['SUPERADMIN', 'BRANCH_MANAGER', 'CASHIER'],
    },
    {
      id: 'inventory',
      label: 'Inventario de Stock',
      icon: Boxes,
      roles: ['SUPERADMIN', 'BRANCH_MANAGER'],
    },
    {
      id: 'transfers',
      label: 'Transferencias',
      icon: ArrowLeftRight,
      roles: ['SUPERADMIN', 'BRANCH_MANAGER'],
    },
    {
      id: 'sales',
      label: 'Historial & Facturas',
      icon: ReceiptText,
      roles: ['SUPERADMIN', 'BRANCH_MANAGER', 'CASHIER'],
    },
    {
      id: 'branches',
      label: 'Sucursales',
      icon: Building2,
      roles: ['SUPERADMIN'],
    },
  ];

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 60,
      }}
    >
      {/* Brand / Logo */}
      <div
        style={{
          padding: '24px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-sm)',
            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
          }}
        >
          <PackageCheck size={22} />
        </div>
        <div>
          <div
            style={{
              fontWeight: 800,
              fontSize: '1.05rem',
              letterSpacing: '-0.02em',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Nexus<span style={{ color: 'var(--primary)' }}>POS</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>
            INVENTARIO & FACTURACIÓN
          </div>
        </div>
      </div>

      {/* Navigation items */}
      <div
        style={{
          padding: '20px 12px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            fontSize: '0.68rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#64748b',
            fontWeight: 700,
            padding: '8px 12px 4px 12px',
          }}
        >
          Módulos del Sistema
        </div>

        {menuItems
          .filter((item) => {
            if (isSuperAdmin) return true;
            if (isBranchManager && item.roles.includes('BRANCH_MANAGER')) return true;
            return item.roles.includes('CASHIER');
          })
          .map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: isActive
                    ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.05) 100%)'
                    : 'transparent',
                  color: isActive ? '#60a5fa' : '#94a3b8',
                  borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                  cursor: 'pointer',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.88rem',
                  fontFamily: 'var(--font-sans)',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.color = '#f8fafc';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#94a3b8';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Icon size={19} color={isActive ? 'var(--primary)' : 'currentColor'} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      background: 'var(--primary-glow)',
                      color: '#60a5fa',
                      padding: '2px 7px',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 700,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
      </div>

      {/* Footer Info Box */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid var(--border-color)',
          background: 'rgba(0, 0, 0, 0.15)',
        }}
      >
        <div
          style={{
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f8fafc' }}>
            Multi-Sucursal v1.0
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
            Transacciones ACID sincronizadas
          </div>
        </div>
      </div>
    </aside>
  );
};
