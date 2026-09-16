import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Building2, Plus, Users, ShoppingBag, MapPin, Phone, CheckCircle, X } from 'lucide-react';

export const BranchesPage: React.FC = () => {
  const { branches, refreshBranches, isSuperAdmin } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await api.createBranch({
        name,
        code,
        address,
        phone,
      });

      await refreshBranches();
      setShowModal(false);
      setName('');
      setCode('');
      setAddress('');
      setPhone('');
    } catch (err: any) {
      setError(err.message || 'Error al crear la sucursal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de Sucursales</h1>
          <p className="page-subtitle">
            Administración de sedes comerciales, almacenes y puntos de venta activos
          </p>
        </div>

        {isSuperAdmin && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} />
            Nueva Sucursal
          </button>
        )}
      </div>

      {/* Branches Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px',
        }}
      >
        {branches.map((b) => (
          <div key={b.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: 'var(--primary)',
                    background: 'var(--primary-glow)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  {b.code}
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginTop: '8px' }}>{b.name}</h3>
              </div>

              {b.isMain ? (
                <span className="badge badge-primary">Sede Central</span>
              ) : (
                <span className="badge badge-success">Operativa</span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={15} color="var(--primary)" />
                <span>{b.address}</span>
              </div>
              {b.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={15} color="var(--primary)" />
                  <span>{b.phone}</span>
                </div>
              )}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-subtle)',
                marginTop: 'auto',
              }}
            >
              <div
                style={{
                  padding: '8px 12px',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Personal</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {b._count?.users || 0}
                </div>
              </div>

              <div
                style={{
                  padding: '8px 12px',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Ventas Realizadas</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {b._count?.sales || 0}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Branch Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Aperturar Nueva Sucursal</h2>
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
                  padding: '10px',
                  background: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  color: 'var(--danger)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  marginBottom: '14px',
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Nombre Comercial de la Sucursal</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="ej. Sucursal Callao - Puerto"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Código Único (Alfanumérico)</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="ej. SUC-04"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Dirección Física</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="ej. Av. Sáenz Peña 450"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Teléfono de Contacto</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="ej. +51 1 429-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
                  <Building2 size={18} />
                  {submitting ? 'Aperturando...' : 'Crear Sucursal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
