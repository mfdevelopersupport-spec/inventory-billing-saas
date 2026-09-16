import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ShieldCheck, User, Store, LogIn, Sparkles } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await api.login({ email, password });
      login(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setError(null);
    setLoading(true);

    try {
      const data = await api.login({ email: quickEmail, password: quickPass });
      login(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '460px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              margin: '0 auto 16px auto',
              boxShadow: '0 8px 20px rgba(59, 130, 246, 0.4)',
            }}
          >
            <Sparkles size={28} />
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800 }}>NexusPOS Cloud</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            Plataforma Multi-Sucursal de Facturación e Inventario
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              color: 'var(--danger)',
              fontSize: '0.85rem',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Correo Electrónico</label>
            <input
              type="email"
              className="form-input"
              required
              placeholder="ej. admin@saas.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              type="password"
              className="form-input"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px', padding: '12px' }}
            disabled={loading}
          >
            <LogIn size={18} />
            {loading ? 'Validando credenciales...' : 'Ingresar al Sistema'}
          </button>
        </form>

        {/* Quick Demo Accoutns */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '10px',
              textAlign: 'center',
            }}
          >
            Acceso Rápido de Demostración (Roles)
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleQuickLogin('admin@saas.com', 'admin123')}
              style={{ justifyContent: 'space-between', padding: '8px 12px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
                <ShieldCheck size={16} color="var(--primary)" />
                <span>SuperAdmin (Acceso Global)</span>
              </div>
              <span className="badge badge-primary">admin123</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleQuickLogin('manager.norte@saas.com', 'manager123')}
              style={{ justifyContent: 'space-between', padding: '8px 12px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
                <Store size={16} color="var(--warning)" />
                <span>Gerente Sucursal Norte</span>
              </div>
              <span className="badge badge-warning">manager123</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => handleQuickLogin('cajero.central@saas.com', 'cajero123')}
              style={{ justifyContent: 'space-between', padding: '8px 12px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem' }}>
                <User size={16} color="var(--success)" />
                <span>Cajero Matriz Central (POS)</span>
              </div>
              <span className="badge badge-success">cajero123</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
