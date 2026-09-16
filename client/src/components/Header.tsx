import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sun,
  Moon,
  Building2,
  Bell,
  LogOut,
  ShieldCheck,
  User as UserIcon,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import { api } from '../services/api';

export const Header: React.FC = () => {
  const {
    user,
    branches,
    selectedBranch,
    setSelectedBranch,
    theme,
    toggleTheme,
    logout,
    isSuperAdmin,
  } = useAuth();

  const [alerts, setAlerts] = useState<any[]>([]);
  const [showAlertsPopover, setShowAlertsPopover] = useState(false);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const stats = await api.getDashboardStats(selectedBranch?.id);
        const combinedAlerts = [
          ...stats.outOfStockAlerts.map((a: any) => ({ ...a, type: 'danger', label: 'Agotado' })),
          ...stats.lowStockAlerts.map((a: any) => ({ ...a, type: 'warning', label: 'Stock Bajo' })),
        ];
        setAlerts(combinedAlerts);
      } catch (e) {
        // quiet error
      }
    };

    if (user) {
      fetchAlerts();
      const interval = setInterval(fetchAlerts, 20000);
      return () => clearInterval(interval);
    }
  }, [user, selectedBranch]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPERADMIN':
        return <span className="badge badge-primary"><ShieldCheck size={12} /> SuperAdmin</span>;
      case 'BRANCH_MANAGER':
        return <span className="badge badge-warning"><ShieldCheck size={12} /> Gerente Sucursal</span>;
      case 'CASHIER':
        return <span className="badge badge-success"><UserIcon size={12} /> Cajero / POS</span>;
      default:
        return null;
    }
  };

  return (
    <header
      style={{
        height: '70px',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Left: Active Branch selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              background: 'var(--primary-glow)',
              color: 'var(--primary)',
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
            }}
          >
            <Building2 size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontWeight: 600 }}>
              SUCURSAL ACTIVA
            </div>
            {isSuperAdmin ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <select
                  value={selectedBranch?.id || ''}
                  onChange={(e) => {
                    const branch = branches.find((b) => b.id === e.target.value);
                    if (branch) setSelectedBranch(branch);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-main)',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    outline: 'none',
                    paddingRight: '18px',
                  }}
                >
                  {branches.map((b) => (
                    <option
                      key={b.id}
                      value={b.id}
                      style={{ background: 'var(--bg-surface)', color: 'var(--text-main)' }}
                    >
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    pointerEvents: 'none',
                    color: 'var(--text-muted)',
                  }}
                />
              </div>
            ) : (
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                {selectedBranch ? `${selectedBranch.name} (${selectedBranch.code})` : 'Cargando...'}
              </div>
            )}
          </div>
        </div>

        {/* Live sync pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: 'var(--border-subtle)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
          }}
        >
          <span className="pulse-indicator" />
          <span>Tiempo Real</span>
        </div>
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Notifications / Low Stock Alert Bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowAlertsPopover(!showAlertsPopover)}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.2s',
            }}
            title="Alertas de Inventario"
          >
            <Bell size={18} />
            {alerts.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: 'var(--danger)',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)',
                }}
              >
                {alerts.length}
              </span>
            )}
          </button>

          {/* Alerts Popover */}
          {showAlertsPopover && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '48px',
                width: '340px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: '16px',
                zIndex: 100,
                animation: 'slideUp 0.2s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '10px',
                  marginBottom: '12px',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertTriangle size={16} color="var(--warning)" />
                  Alertas de Stock ({alerts.length})
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {selectedBranch?.code}
                </span>
              </div>

              {alerts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  🎉 Todo el inventario se encuentra en niveles óptimos.
                </div>
              ) : (
                <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {alerts.map((al, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        background: al.type === 'danger' ? 'var(--danger-bg)' : 'var(--warning-bg)',
                        border: `1px solid ${al.type === 'danger' ? 'var(--danger-border)' : 'var(--warning-border)'}`,
                        fontSize: '0.8rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                        <span style={{ color: 'var(--text-main)' }}>{al.product}</span>
                        <span className={`badge ${al.type === 'danger' ? 'badge-danger' : 'badge-warning'}`}>
                          {al.quantity} unid.
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        SKU: {al.sku} | Sucursal: {al.branchCode || selectedBranch?.code}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-main)',
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
        >
          {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
        </button>

        {/* User profile capsule */}
        {user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '6px 14px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-full)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {user.name}
              </span>
              {getRoleBadge(user.role)}
            </div>

            <button
              onClick={logout}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-subtle)',
                cursor: 'pointer',
                display: 'flex',
                padding: '4px',
                borderRadius: '4px',
                transition: 'color 0.2s',
              }}
              title="Cerrar sesión"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
