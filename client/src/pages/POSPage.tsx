import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Product, Category, CartItem, PaymentMethod } from '../types';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  FileDown,
  Printer,
  CreditCard,
  Banknote,
  Building,
  AlertCircle,
  Package,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const POSPage: React.FC = () => {
  const { selectedBranch } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState<string>('Consumidor Final');
  const [customerDoc, setCustomerDoc] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');

  // Checkout & Modal State
  const [processingSale, setProcessingSale] = useState<boolean>(false);
  const [lastSale, setLastSale] = useState<any | null>(null);
  const [saleError, setSaleError] = useState<string | null>(null);

  const fetchProducts = async () => {
    if (!selectedBranch) return;
    setLoading(true);
    try {
      const data = await api.getProducts({
        branchId: selectedBranch.id,
        categoryId: selectedCategory === 'all' ? undefined : selectedCategory,
        search: search ? search : undefined,
      });
      setProducts(data.products);
    } catch (err) {
      console.error('Error al cargar productos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const catData = await api.getCategories();
        setCategories(catData.categories);
      } catch (err) {
        console.error('Error cargando categorías:', err);
      }
    };
    fetchCats();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedBranch, selectedCategory, search]);

  // Cart Handlers
  const addToCart = (product: Product) => {
    if (product.currentStock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.currentStock) {
          alert(`Stock máximo disponible para ${product.name}: ${product.currentStock} unidades`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.currentStock) {
              alert(`Stock máximo disponible: ${item.product.currentStock}`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('Consumidor Final');
    setCustomerDoc('');
    setCustomerEmail('');
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = Number((subtotal * 0.18).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));

  // Submit Sale
  const handleCheckout = async () => {
    if (!selectedBranch) {
      alert('Por favor seleccione una sucursal activa');
      return;
    }

    if (cart.length === 0) {
      alert('El carrito de compras está vacío');
      return;
    }

    setProcessingSale(true);
    setSaleError(null);

    try {
      const payload = {
        branchId: selectedBranch.id,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        customerName,
        customerDoc: customerDoc || undefined,
        customerEmail: customerEmail || undefined,
        paymentMethod,
      };

      const result = await api.createSale(payload);
      setLastSale(result.sale);

      // Trigger Confetti Celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Clear cart & refresh stock
      clearCart();
      fetchProducts();
    } catch (err: any) {
      setSaleError(err.message || 'Error al emitir la factura');
    } finally {
      setProcessingSale(false);
    }
  };

  const handleDownloadPdf = async (saleId: string, saleNum: string) => {
    try {
      await api.downloadSalePdf(saleId, saleNum);
    } catch (e: any) {
      alert('Error descargando comprobante: ' + e.message);
    }
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Punto de Venta & Facturación</h1>
          <p className="page-subtitle">
            Terminal de caja para emisión de comprobantes en {selectedBranch?.name} ({selectedBranch?.code})
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchProducts}
            title="Refrescar catálogo y stock"
          >
            Sincronizar Stock
          </button>
        </div>
      </div>

      {/* POS Grid: Left side catalog, Right side cart */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 420px',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Product Search & Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Filter Bar */}
          <div
            className="card"
            style={{
              padding: '16px',
              display: 'flex',
              gap: '12px',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            {/* Search input */}
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
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
                placeholder="Buscar por nombre, SKU o código de barras..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Category Pills */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', maxWidth: '100%' }}>
              <button
                className={`btn btn-sm ${selectedCategory === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedCategory('all')}
              >
                Todas
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  className={`btn btn-sm ${selectedCategory === c.id ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSelectedCategory(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 0' }}>
              <div className="pulse-indicator" style={{ width: '16px', height: '16px' }} />
              <div style={{ marginTop: '12px', color: 'var(--text-muted)' }}>
                Cargando inventario de la sucursal...
              </div>
            </div>
          ) : products.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 0' }}>
              <Package size={42} style={{ color: 'var(--text-subtle)', margin: '0 auto 12px auto' }} />
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>No se encontraron productos</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Pruebe con otro término de búsqueda o seleccione otra categoría.
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '16px',
              }}
            >
              {products.map((product) => {
                const isOutOfStock = product.currentStock <= 0;
                const isLowStock = !isOutOfStock && product.currentStock <= product.minStockAlert;

                return (
                  <div
                    key={product.id}
                    className="card card-hover"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '16px',
                      opacity: isOutOfStock ? 0.6 : 1,
                      position: 'relative',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px',
                        }}
                      >
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {product.sku}
                        </span>
                        {isOutOfStock ? (
                          <span className="badge badge-danger">Agotado</span>
                        ) : isLowStock ? (
                          <span className="badge badge-warning">Stock: {product.currentStock}</span>
                        ) : (
                          <span className="badge badge-success">Stock: {product.currentStock}</span>
                        )}
                      </div>

                      <h3
                        style={{
                          fontSize: '0.95rem',
                          fontWeight: 700,
                          lineHeight: 1.3,
                          marginBottom: '6px',
                        }}
                      >
                        {product.name}
                      </h3>

                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                        {product.category?.name}
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '10px',
                        paddingTop: '10px',
                        borderTop: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
                        ${product.price.toFixed(2)}
                      </div>

                      <button
                        className="btn btn-primary btn-sm"
                        disabled={isOutOfStock}
                        onClick={() => addToCart(product)}
                      >
                        <Plus size={15} />
                        Agregar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Checkout Drawer & Cart */}
        <div
          className="card"
          style={{
            position: 'sticky',
            top: '90px',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'calc(100vh - 120px)',
            padding: '20px',
          }}
        >
          {/* Cart Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '12px',
              marginBottom: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '1.05rem' }}>
              <ShoppingCart size={20} color="var(--primary)" />
              <span>Carrito ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
            </div>

            {cart.length > 0 && (
              <button
                className="btn btn-danger btn-sm"
                onClick={clearCart}
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
              >
                <Trash2 size={13} />
                Vaciar
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              paddingRight: '4px',
              minHeight: '160px',
              maxHeight: '260px',
            }}
          >
            {cart.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 0',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                }}
              >
                No hay productos en la orden de venta
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, marginRight: '10px' }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: '0.84rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.product.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ${item.product.price.toFixed(2)} c/u
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px' }}
                      onClick={() => updateQuantity(item.product.id, -1)}
                    >
                      <Minus size={12} />
                    </button>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', minWidth: '20px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '4px 8px' }}
                      onClick={() => updateQuantity(item.product.id, 1)}
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  <div style={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '65px', textAlign: 'right' }}>
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Customer & Payment Options */}
          <div
            style={{
              marginTop: '14px',
              paddingTop: '12px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>
                  Nombre Cliente
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ padding: '6px 10px', fontSize: '0.82rem' }}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.7rem' }}>
                  DNI / RUC
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ padding: '6px 10px', fontSize: '0.82rem' }}
                  placeholder="Doc. tributario"
                  value={customerDoc}
                  onChange={(e) => setCustomerDoc(e.target.value)}
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="form-label" style={{ fontSize: '0.7rem' }}>
                Método de Pago
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${paymentMethod === 'CASH' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPaymentMethod('CASH')}
                >
                  <Banknote size={14} />
                  Efectivo
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${paymentMethod === 'CARD' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPaymentMethod('CARD')}
                >
                  <CreditCard size={14} />
                  Tarjeta
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${paymentMethod === 'TRANSFER' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setPaymentMethod('TRANSFER')}
                >
                  <Building size={14} />
                  Transf.
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Totals */}
          <div
            style={{
              marginTop: '14px',
              padding: '12px',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              <span>Impuestos (IVA 18%):</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                marginTop: '8px',
                paddingTop: '8px',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <span>Total a Cobrar:</span>
              <span style={{ color: 'var(--primary)' }}>${total.toFixed(2)} USD</span>
            </div>
          </div>

          {saleError && (
            <div
              style={{
                marginTop: '10px',
                padding: '8px 10px',
                background: 'var(--danger-bg)',
                border: '1px solid var(--danger-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--danger)',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <AlertCircle size={15} />
              <span>{saleError}</span>
            </div>
          )}

          {/* Checkout button */}
          <button
            className="btn btn-success btn-lg"
            style={{ marginTop: '14px', width: '100%', fontWeight: 800 }}
            disabled={cart.length === 0 || processingSale}
            onClick={handleCheckout}
          >
            {processingSale ? (
              'Procesando Venta Atómica...'
            ) : (
              <>
                <CheckCircle2 size={20} />
                Cobrar & Emitir Factura
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Modal with Invoice & Download */}
      {lastSale && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px', textAlign: 'center' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'var(--success-bg)',
                color: 'var(--success)',
                border: '2px solid var(--success-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
              }}
            >
              <CheckCircle2 size={34} />
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>¡Venta Emitida Exitosamente!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
              El stock se ha decrementado y sincronizado automáticamente en tiempo real.
            </p>

            <div
              style={{
                margin: '20px 0',
                padding: '16px',
                background: 'var(--bg-body)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                textAlign: 'left',
                fontSize: '0.88rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>N° Comprobante:</span>
                <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>
                  {lastSale.saleNumber}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Sucursal:</span>
                <span>{lastSale.branch?.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Cliente:</span>
                <span>{lastSale.customerName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Método de Pago:</span>
                <span className="badge badge-primary">{lastSale.paymentMethod}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '1.1rem',
                  fontWeight: 800,
                }}
              >
                <span>Total Pagado:</span>
                <span style={{ color: 'var(--success)' }}>${lastSale.total.toFixed(2)} USD</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                className="btn btn-primary"
                onClick={() => handleDownloadPdf(lastSale.id, lastSale.saleNumber)}
              >
                <FileDown size={18} />
                Descargar Factura PDF
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  handleDownloadPdf(lastSale.id, lastSale.saleNumber);
                }}
              >
                <Printer size={18} />
                Imprimir Ticket
              </button>
            </div>

            <button
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '10px' }}
              onClick={() => setLastSale(null)}
            >
              Cerrar y Nueva Venta
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
