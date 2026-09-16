import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CashRegister } from '../types';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Lock,
  Unlock,
  Receipt,
  PlusCircle,
  X,
  History,
  Calendar,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const CashRegisterPage: React.FC = () => {
  const { user, selectedBranch } = useAuth();
  const [currentShift, setCurrentShift] = useState<CashRegister | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [history, setHistory] = useState<CashRegister[]>([]);

  // Open Shift Modal
  const [showOpenModal, setShowOpenModal] = useState<boolean>(false);
  const [initialAmount, setInitialAmount] = useState<string>('100.00');

  // Movement Modal (Ingreso / Egreso)
  const [showMovementModal, setShowMovementModal] = useState<boolean>(false);
  const [movType, setMovType] = useState<'INGRESO' | 'EGRESO'>('EGRESO');
  const [movAmount, setMovAmount] = useState<string>('');
  const [movConcept, setMovConcept] = useState<string>('');

  // Close Shift Modal
  const [showCloseModal, setShowCloseModal] = useState<boolean>(false);
  const [countedCash, setCountedCash] = useState<string>('');
  const [closeNotes, setCloseNotes] = useState<string>('');
  const [closing, setClosing] = useState<boolean>(false);

  const fetchShiftData = async () => {
    setLoading(true);
    try {
      const res = await api.getCurrentShift(selectedBranch?.id);
      setIsOpen(res.isOpen);
      setCurrentShift(res.cashRegister);

      const histRes = await api.getShiftsHistory(selectedBranch?.id);
      setHistory(histRes.history);
    } catch (err) {
      console.error('Error cargando estado de caja:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShiftData();
  }, [selectedBranch]);

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch) return;

    try {
      await api.openShift(selectedBranch.id, parseFloat(initialAmount) || 0);
      setShowOpenModal(false);
      fetchShiftData();
    } catch (err: any) {
      alert(err.message || 'Error al abrir caja');
    }
  };

  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShift) return;

    try {
      await api.addCashMovement({
        cashRegisterId: currentShift.id,
        type: movType,
        amount: parseFloat(movAmount) || 0,
        concept: movConcept,
      });

      setShowMovementModal(false);
      setMovAmount('');
      setMovConcept('');
      fetchShiftData();
    } catch (err: any) {
      alert(err.message || 'Error registrando movimiento');
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShift) return;

    setClosing(true);
    try {
      await api.closeShift(
        currentShift.id,
        parseFloat(countedCash) || 0,
        closeNotes || undefined
      );

      confetti({ particleCount: 50, spread: 60 });
      setShowCloseModal(false);
      setCountedCash('');
      setCloseNotes('');
      fetchShiftData();
    } catch (err: any) {
      alert(err.message || 'Error al cerrar caja');
    } finally {
      setClosing(false);
    }
  };

  const countedNumeric = parseFloat(countedCash) || 0;
  const expectedNumeric = currentShift?.expectedCashInDrawer || 0;
  const difference = countedNumeric - expectedNumeric;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Control de Caja Chica & Arqueo de Turno</h1>
          <p className="page-subtitle">
            Gestión de turnos de cajero, ingresos/egresos y cuadre físico de gaveta (Corte Z)
          </p>
        </div>

        {isOpen ? (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => setShowMovementModal(true)}>
              <PlusCircle size={16} />
              Gasto / Ingreso Menor
            </button>
            <button className="btn btn-danger" onClick={() => setShowCloseModal(true)}>
              <Lock size={16} />
              Arqueo & Cerrar Caja
            </button>
          </div>
        ) : (
          <button className="btn btn-primary" onClick={() => setShowOpenModal(true)}>
            <Unlock size={16} />
            Aperturar Turno de Caja
          </button>
        )}
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 0' }}>
          <div className="pulse-indicator" style={{ width: '16px', height: '16px' }} />
          <div style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Consultando estado de caja...</div>
        </div>
      ) : !isOpen ? (
        /* Box when closed */
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '50px 20px',
            maxWidth: '600px',
            margin: '0 auto 30px auto',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--warning-bg)',
              color: 'var(--warning)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
            }}
          >
            <Lock size={32} />
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>No hay ningún turno de caja abierto</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '8px 0 20px 0' }}>
            Para registrar ventas en efectivo y mantener el cuadre contable, debe aperturar un turno con el saldo inicial
            en gaveta.
          </p>

          <button className="btn btn-primary btn-lg" onClick={() => setShowOpenModal(true)}>
            <Unlock size={18} />
            Abrir Caja con Saldo Inicial
          </button>
        </div>
      ) : (
        /* Active Shift Dashboard */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Top Status Strip */}
          <div
            className="card"
            style={{
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              borderLeft: '4px solid var(--success)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--success-bg)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Wallet size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>
                  Caja Abierta por: {currentShift?.user?.name || user?.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Aperturado el {new Date(currentShift!.openedAt).toLocaleString('es-PE')} en {currentShift?.branch?.name}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>SALDO INICIAL</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  S/ {currentShift?.initialAmount.toFixed(2)}
                </div>
              </div>

              <div style={{ textAlign: 'right', paddingLeft: '12px', borderLeft: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>EFECTIVO ESPERADO GAVETA</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)' }}>
                  S/ {currentShift?.expectedCashInDrawer?.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods Breakdown Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
            }}
          >
            <div className="card" style={{ padding: '14px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>VENTAS EFECTIVO</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                S/ {currentShift?.cashSalesAmount.toFixed(2)}
              </div>
            </div>

            <div className="card" style={{ padding: '14px' }}>
              <div style={{ fontSize: '0.75rem', color: '#a855f7', fontWeight: 700 }}>VENTAS YAPE</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#a855f7', marginTop: '4px' }}>
                S/ {currentShift?.yapeSalesAmount.toFixed(2)}
              </div>
            </div>

            <div className="card" style={{ padding: '14px' }}>
              <div style={{ fontSize: '0.75rem', color: '#06b6d4', fontWeight: 700 }}>VENTAS PLIN</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#06b6d4', marginTop: '4px' }}>
                S/ {currentShift?.plinSalesAmount.toFixed(2)}
              </div>
            </div>

            <div className="card" style={{ padding: '14px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>VENTAS TARJETA</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
                S/ {currentShift?.cardSalesAmount.toFixed(2)}
              </div>
            </div>

            <div className="card" style={{ padding: '14px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 700 }}>TOTAL VENDIDO</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--warning)', marginTop: '4px' }}>
                S/ {currentShift?.totalSalesAllMethods?.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Cash Movements Table (Ingresos y Gastos de Caja Chica) */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Gastos e Ingresos de Caja Chica</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowMovementModal(true)}>
                <PlusCircle size={14} />
                Nuevo Movimiento
              </button>
            </div>

            <div className="table-container">
              <table className="custom-table" style={{ fontSize: '0.84rem' }}>
                <thead>
                  <tr>
                    <th>Fecha / Hora</th>
                    <th>Tipo</th>
                    <th>Concepto / Motivo</th>
                    <th style={{ textAlign: 'right' }}>Monto (S/)</th>
                  </tr>
                </thead>
                <tbody>
                  {!currentShift?.movements || currentShift.movements.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                        No hay ingresos ni egresos menores registrados en este turno.
                      </td>
                    </tr>
                  ) : (
                    currentShift.movements.map((m) => (
                      <tr key={m.id}>
                        <td>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td>
                          {m.type === 'INGRESO' ? (
                            <span className="badge badge-success">
                              <ArrowUpRight size={12} /> Ingreso
                            </span>
                          ) : (
                            <span className="badge badge-danger">
                              <ArrowDownRight size={12} /> Egreso / Gasto
                            </span>
                          )}
                        </td>
                        <td>{m.concept}</td>
                        <td
                          style={{
                            textAlign: 'right',
                            fontWeight: 800,
                            color: m.type === 'INGRESO' ? 'var(--success)' : 'var(--danger)',
                          }}
                        >
                          {m.type === 'INGRESO' ? '+' : '-'} S/ {m.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Historical Shifts Table */}
      <div className="card" style={{ marginTop: '28px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={18} color="var(--primary)" />
          Historial de Cierres de Caja (Auditoría de Turnos)
        </h3>

        <div className="table-container">
          <table className="custom-table" style={{ fontSize: '0.84rem' }}>
            <thead>
              <tr>
                <th>Cajero</th>
                <th>Apertura</th>
                <th>Cierre</th>
                <th>Total Ventas</th>
                <th>Esperado</th>
                <th>Contado Físico</th>
                <th>Diferencia</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No hay registros históricos de cajas cerradas aún.
                  </td>
                </tr>
              ) : (
                history.map((h) => {
                  const diff = h.differenceAmount || 0;
                  const isMatch = Math.abs(diff) < 0.01;
                  const isSurplus = diff > 0;

                  return (
                    <tr key={h.id}>
                      <td style={{ fontWeight: 600 }}>{h.user?.name}</td>
                      <td>{new Date(h.openedAt).toLocaleString('es-PE')}</td>
                      <td>{h.closedAt ? new Date(h.closedAt).toLocaleString('es-PE') : '-'}</td>
                      <td style={{ fontWeight: 700 }}>
                        S/ {(h.cashSalesAmount + h.yapeSalesAmount + h.plinSalesAmount + h.cardSalesAmount).toFixed(2)}
                      </td>
                      <td>S/ {(h.expectedAmount || 0).toFixed(2)}</td>
                      <td style={{ fontWeight: 800 }}>S/ {(h.finalAmount || 0).toFixed(2)}</td>
                      <td>
                        {isMatch ? (
                          <span className="badge badge-success">S/ 0.00 (Exacto)</span>
                        ) : isSurplus ? (
                          <span className="badge badge-primary">+ S/ {diff.toFixed(2)} (Sobrante)</span>
                        ) : (
                          <span className="badge badge-danger">S/ {diff.toFixed(2)} (Faltante)</span>
                        )}
                      </td>
                      <td>
                        <span className="badge badge-secondary">Cerrado</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Open Shift */}
      {showOpenModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Aperturar Turno de Caja</h2>
              <button
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setShowOpenModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleOpenShift}>
              <div className="form-group">
                <label className="form-label">Monto Inicial en Gaveta (Sencillo S/)</label>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  className="form-input"
                  required
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(e.target.value)}
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Monto en monedas y billetes con el que inicia la atención del día.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
                {['50', '100', '150', '200'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => setInitialAmount(val)}
                  >
                    S/ {val}
                  </button>
                ))}
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                <Unlock size={18} />
                Confirmar Apertura de Caja
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Movement (Ingreso / Egreso) */}
      {showMovementModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Movimiento de Caja Chica</h2>
              <button
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setShowMovementModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddMovement}>
              <div className="form-group">
                <label className="form-label">Tipo de Movimiento</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${movType === 'EGRESO' ? 'btn-danger' : 'btn-secondary'}`}
                    onClick={() => setMovType('EGRESO')}
                  >
                    <ArrowDownRight size={14} /> Salida / Gasto Menor
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${movType === 'INGRESO' ? 'btn-success' : 'btn-secondary'}`}
                    onClick={() => setMovType('INGRESO')}
                  >
                    <ArrowUpRight size={14} /> Ingreso de Dinero
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Monto (S/)</label>
                <input
                  type="number"
                  step="0.50"
                  min="0.10"
                  className="form-input"
                  required
                  placeholder="0.00"
                  value={movAmount}
                  onChange={(e) => setMovAmount(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Concepto / Motivo</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="ej. Pago delivery de insumos, Compra de bolsas..."
                  value={movConcept}
                  onChange={(e) => setMovConcept(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                Registrar Movimiento
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Close Shift & Arqueo (Corte Z) */}
      {showCloseModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Arqueo y Cierre de Turno (Corte Z)</h2>
              <button
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setShowCloseModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Shift financial summary */}
            <div
              style={{
                padding: '12px 14px',
                background: 'var(--bg-body)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '16px',
                fontSize: '0.84rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Saldo Inicial:</span>
                <span>S/ {currentShift?.initialAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Ventas Efectivo:</span>
                <span>+ S/ {currentShift?.cashSalesAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Ingresos Extra:</span>
                <span>+ S/ {currentShift?.totalIncomes.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Gastos Menores:</span>
                <span>- S/ {currentShift?.totalExpenses.toFixed(2)}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  paddingTop: '6px',
                  borderTop: '1px solid var(--border-color)',
                  color: 'var(--primary)',
                }}
              >
                <span>Efectivo Esperado en Gaveta:</span>
                <span>S/ {expectedNumeric.toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={handleCloseShift}>
              <div className="form-group">
                <label className="form-label">Efectivo Físico Contado en Gaveta (S/)</label>
                <input
                  type="number"
                  step="0.10"
                  min="0"
                  className="form-input"
                  required
                  placeholder="Ingrese el monto que contó físicamente..."
                  value={countedCash}
                  onChange={(e) => setCountedCash(e.target.value)}
                />
              </div>

              {/* Difference feedback indicator */}
              {countedCash && (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '14px',
                    background:
                      Math.abs(difference) < 0.01
                        ? 'var(--success-bg)'
                        : difference > 0
                        ? 'var(--primary-glow)'
                        : 'var(--danger-bg)',
                    border: `1px solid ${
                      Math.abs(difference) < 0.01
                        ? 'var(--success-border)'
                        : difference > 0
                        ? 'rgba(59,130,246,0.3)'
                        : 'var(--danger-border)'
                    }`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.86rem',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>Diferencia de Cuadre:</span>
                  <strong
                    style={{
                      color:
                        Math.abs(difference) < 0.01
                          ? 'var(--success)'
                          : difference > 0
                          ? 'var(--primary)'
                          : 'var(--danger)',
                    }}
                  >
                    {Math.abs(difference) < 0.01
                      ? '✓ Conforme (S/ 0.00)'
                      : difference > 0
                      ? `+ S/ ${difference.toFixed(2)} (Sobrante)`
                      : `S/ ${difference.toFixed(2)} (Faltante)`}
                  </strong>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Observaciones del Cierre (Opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="ej. Todo conforme sin novedades en el turno"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowCloseModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-danger" style={{ flex: 1 }} disabled={closing}>
                  <Lock size={16} />
                  {closing ? 'Cerrando...' : 'Confirmar Cierre de Caja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
