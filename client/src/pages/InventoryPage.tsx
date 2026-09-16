import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Product, Branch, Category } from '../types';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  SlidersHorizontal,
  Edit,
  Save,
  X,
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const { branches, isSuperAdmin, isBranchManager } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Stock Adjustment Modal
  const [editingStock, setEditingStock] = useState<{
    product: Product;
    branchId: string;
    branchName: string;
    currentQuantity: number;
    minAlert: number;
  } | null>(null);
  const [newQuantity, setNewQuantity] = useState<number>(0);
  const [newMinAlert, setNewMinAlert] = useState<number>(5);
  const [updating, setUpdating] = useState<boolean>(false);

  // New Product Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCost, setNewCost] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newMinStock, setNewMinStock] = useState('5');
  const [creating, setCreating] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const prodData = await api.getProducts({
        categoryId: selectedCategory === 'all' ? undefined : selectedCategory,
        search: search ? search : undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setProducts(prodData.products);

      const catData = await api.getCategories();
      setCategories(catData.categories);
      if (catData.categories.length > 0 && !newCategoryId) {
        setNewCategoryId(catData.categories[0].id);
      }
    } catch (err) {
      console.error('Error al cargar inventario:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [selectedCategory, statusFilter, search]);

  const handleOpenStockModal = (product: Product, branch: Branch) => {
    const bStock = product.branchStocks?.find((s) => s.branchId === branch.id);
    const qty = bStock ? bStock.quantity : 0;
    const alertLvl = bStock ? bStock.minStockAlert : product.minStockAlert;

    setEditingStock({
      product,
      branchId: branch.id,
      branchName: branch.name,
      currentQuantity: qty,
      minAlert: alertLvl,
    });
    setNewQuantity(qty);
    setNewMinAlert(alertLvl);
  };

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStock) return;

    setUpdating(true);
    try {
      await api.updateStock({
        branchId: editingStock.branchId,
        productId: editingStock.product.id,
        quantity: newQuantity,
        minStockAlert: newMinAlert,
      });
      setEditingStock(null);
      fetchInventory();
    } catch (err: any) {
      alert('Error al actualizar stock: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      await api.createProduct({
        sku: newSku,
        name: newName,
        price: parseFloat(newPrice),
        costPrice: newCost ? parseFloat(newCost) : 0,
        categoryId: newCategoryId,
        minStockAlert: parseInt(newMinStock),
      });

      setShowCreateModal(false);
      setNewSku('');
      setNewName('');
      setNewPrice('');
      setNewCost('');
      fetchInventory();
    } catch (err: any) {
      alert('Error al crear producto: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Matriz de Inventario Multi-Sucursal</h1>
          <p className="page-subtitle">
            Control de stock en tiempo real, alertas de nivel mínimo y ajustes por sucursal
          </p>
        </div>

        {(isSuperAdmin || isBranchManager) && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} />
            Nuevo Producto
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div
        className="card"
        style={{
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px' }}>
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
              placeholder="Buscar por código SKU o nombre de producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: '180px' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">Todas las Categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filters */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('all')}
          >
            Todos ({products.length})
          </button>
          <button
            className={`btn btn-sm ${statusFilter === 'LOW_STOCK' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('LOW_STOCK')}
          >
            <AlertTriangle size={14} color="var(--warning)" />
            Stock Bajo
          </button>
          <button
            className={`btn btn-sm ${statusFilter === 'OUT_OF_STOCK' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('OUT_OF_STOCK')}
          >
            <XCircle size={14} color="var(--danger)" />
            Agotados
          </button>
        </div>
      </div>

      {/* Multi-Branch Inventory Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>SKU / Código</th>
              <th>Producto & Categoría</th>
              <th>P. Venta</th>
              {branches.map((b) => (
                <th key={b.id} style={{ textAlign: 'center' }}>
                  {b.name}
                  <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--primary)' }}>
                    ({b.code})
                  </span>
                </th>
              ))}
              <th style={{ textAlign: 'center' }}>Total Global</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5 + branches.length} style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="pulse-indicator" style={{ width: '14px', height: '14px' }} />
                  <div style={{ marginTop: '8px', color: 'var(--text-muted)' }}>
                    Cargando matriz de inventario...
                  </div>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={5 + branches.length} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No se encontraron productos registrados con los filtros aplicados.
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const totalStock = p.branchStocks?.reduce((acc, s) => acc + s.quantity, 0) || 0;
                const hasAnyAlert = p.branchStocks?.some((s) => s.quantity <= s.minStockAlert && s.quantity > 0);
                const hasAnyOut = p.branchStocks?.some((s) => s.quantity === 0);

                return (
                  <tr key={p.id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.82rem' }}>
                        {p.sku}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {p.category?.name}
                      </div>
                    </td>

                    <td style={{ fontWeight: 800, color: 'var(--primary)' }}>
                      ${p.price.toFixed(2)}
                    </td>

                    {/* Stock Column Per Branch */}
                    {branches.map((b) => {
                      const stockRecord = p.branchStocks?.find((s) => s.branchId === b.id);
                      const qty = stockRecord ? stockRecord.quantity : 0;
                      const alertLimit = stockRecord ? stockRecord.minStockAlert : p.minStockAlert;
                      const isZero = qty === 0;
                      const isLow = !isZero && qty <= alertLimit;

                      return (
                        <td key={b.id} style={{ textAlign: 'center' }}>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <span
                              className={`badge ${
                                isZero ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success'
                              }`}
                              style={{ minWidth: '40px', justifyContent: 'center' }}
                            >
                              {qty}
                            </span>

                            {(isSuperAdmin || isBranchManager) && (
                              <button
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: 'var(--text-subtle)',
                                  display: 'flex',
                                  padding: '2px',
                                }}
                                title={`Ajustar stock en ${b.name}`}
                                onClick={() => handleOpenStockModal(p, b)}
                              >
                                <Edit size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    {/* Total Company Stock */}
                    <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.95rem' }}>
                      {totalStock}
                    </td>

                    {/* Overall Status Badge */}
                    <td>
                      {hasAnyOut ? (
                        <span className="badge badge-danger">
                          <XCircle size={12} /> Agotado en sucursales
                        </span>
                      ) : hasAnyAlert ? (
                        <span className="badge badge-warning">
                          <AlertTriangle size={12} /> Stock Mínimo
                        </span>
                      ) : (
                        <span className="badge badge-success">
                          <CheckCircle size={12} /> Normal
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Adjust Stock Modal */}
      {editingStock && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Ajustar Stock de Inventario</h2>
              <button
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setEditingStock(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-body)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 700 }}>{editingStock.product.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                SKU: {editingStock.product.sku} | Sucursal: <strong>{editingStock.branchName}</strong>
              </div>
            </div>

            <form onSubmit={handleSaveStock}>
              <div className="form-group">
                <label className="form-label">Nueva Cantidad de Stock Físico</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  required
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Umbral de Alerta de Stock Mínimo</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  required
                  value={newMinAlert}
                  onChange={(e) => setNewMinAlert(parseInt(e.target.value) || 1)}
                />
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  El sistema emitirá advertencias cuando el stock baje a este valor o menor.
                </span>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setEditingStock(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={updating}>
                  <Save size={18} />
                  {updating ? 'Guardando...' : 'Guardar Ajuste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Registrar Nuevo Producto</h2>
              <button
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setShowCreateModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Código SKU</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="ej. SKU-PROD-100"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select
                    className="form-select"
                    required
                    value={newCategoryId}
                    onChange={(e) => setNewCategoryId(e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nombre del Producto</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  placeholder="ej. Auriculares Inalámbricos Pro"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Precio Venta ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    required
                    placeholder="0.00"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Precio Costo ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    placeholder="0.00"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Alerta Mínima</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    required
                    value={newMinStock}
                    onChange={(e) => setNewMinStock(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={creating}>
                  <Save size={18} />
                  {creating ? 'Registrando...' : 'Registrar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
