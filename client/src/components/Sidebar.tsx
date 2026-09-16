import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  ArrowLeftRight,
  ReceiptText,
  Building2,
  PackageCheck,
  Wallet,
  FileSpreadsheet,
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
      badge: 'SUNAT S/',
      roles: ['SUPERADMIN', 'BRANCH_MANAGER', 'CASHIER'],
    },
    {
      id: 'caja',
      label: 'Caja Chica & Turnos',
      icon: Wallet,
      roles: ['SUPERADMIN', 'BRANCH_MANAGER', 'CASHIER'],
    },
    {
      id: 'inventory',
      label: 'Inventario de Stock',
      icon: Boxes,
      roles: ['SUPERADMIN', 'BRANCH_MANAGER'],
    },
    {
      id: 'kardex',
      label: 'Kardex & SIRE SUNAT',
      icon: FileSpreadsheet,
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
          padding: '22px 20px',
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
            <span style={{ fontSize: '0.65rem', background: '#dc2626', color: '#fff', padding: '1px 5px', borderRadius: '4px' }}>
              PERÚ
            </span>
          </div>
          <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>
            FACTURACIÓN SUNAT READY
          </div>
        </div>
      </div>

      {/* Navigation items */}
      <div
        style={{
          padding: '18px 12px',
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
            padding: '6px 12px 4px 12px',
          }}
        >
          Módulos Comerciales
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
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: isActive
                    ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.05) 100%)'
                    : 'transparent',
                  color: isActive ? '#60a5fa' : '#94a3b8',
                  borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                  cursor: 'pointer',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.86rem',
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                  <Icon size={18} color={isActive ? 'var(--primary)' : 'currentColor'} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    style={{
                      fontSize: '0.65rem',
                      background: 'rgba(220, 38, 38, 0.15)',
                      color: '#f87171',
                      border: '1px solid rgba(220, 38, 38, 0.3)',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 800,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
      </div>

      {/* Footer Info */}
      <div
        style={{
          padding: '14px 16px',
          borderTop: '1px solid var(--border-color)',
          background: 'rgba(0, 0, 0, 0.15)',
        }}
      >
        <div
          style={{
            padding: '10px 12px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
            Padrón SUNAT Conectado
          </div>
          <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>
            Series F001 / B001 / NV01
          </div>
        </div>
      </div>
    </aside>
  );
};
