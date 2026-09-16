import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Product, Category, CartItem, PaymentMethod, DocumentType, Sale } from '../types';
import { generateClientReceiptPDF } from '../utils/pdfReceipt';
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
  QrCode,
  Smartphone,
  Share2,
  MessageCircle,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const POSPage: React.FC = () => {
  const { selectedBranch } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Document & Customer State
  const [documentType, setDocumentType] = useState<DocumentType>('BOLETA');
  const [customerName, setCustomerName] = useState<string>('Clientes Varios');
  const [customerDoc, setCustomerDoc] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [searchingDoc, setSearchingDoc] = useState<boolean>(false);
  const [docFeedback, setDocFeedback] = useState<string | null>(null);

  // Cart & Payment State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [operationCode, setOperationCode] = useState<string>('');

  // Checkout & Modals
  const [processingSale, setProcessingSale] = useState<boolean>(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState<'YAPE' | 'PLIN' | null>(null);

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

  // Cart Management
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

  const clearCart = () => {
    setCart([]);
    setCustomerName('Clientes Varios');
    setCustomerDoc('');
    setCustomerAddress('');
    setCustomerPhone('');
    setAmountPaid('');
    setOperationCode('');
    setDocFeedback(null);
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const tax = Number((subtotal * 0.18).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));

  const numericPaid = parseFloat(amountPaid) || 0;
  const change = numericPaid > total ? Number((numericPaid - total).toFixed(2)) : 0;

  // Search RUC or DNI from SUNAT / RENIEC
  const handleLookupDoc = async () => {
    if (!customerDoc || customerDoc.trim().length < 8) {
      setDocFeedback('Ingrese al menos 8 dígitos para consultar');
      return;
    }

    setSearchingDoc(true);
    setDocFeedback(null);

    try {
      const res = await api.lookupDoc(customerDoc.trim());
      if (res.found) {
        if (res.type === 'RUC') {
          setCustomerName(res.data.razonSocial);
          setCustomerAddress(res.data.direccion);
          setDocumentType('FACTURA');
          setDocFeedback(`✓ RUC Validado: ${res.data.estado} - ${res.data.condicion}`);
        } else if (res.type === 'DNI') {
          setCustomerName(res.data.nombreCompleto);
          setDocumentType('BOLETA');
          setDocFeedback('✓ DNI Encontrado en Padrón RENIEC');
        }
      }
    } catch (err: any) {
      setDocFeedback('Documento no encontrado o no disponible en padrón');
    } finally {
      setSearchingDoc(false);
    }
  };

  // Submit Sale with SUNAT integration
  const handleCheckout = async () => {
    if (!selectedBranch) {
      alert('Por favor seleccione una sucursal activa');
      return;
    }

    if (cart.length === 0) {
      alert('El carrito de compras está vacío');
      return;
    }

    if (documentType === 'FACTURA' && (!customerDoc || customerDoc.length !== 11)) {
      alert('Para emitir Factura Electrónica se requiere un RUC de 11 dígitos');
      return;
    }

    setProcessingSale(true);
    setSaleError(null);

    try {
      const payload = {
        branchId: selectedBranch.id,
        documentType,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        customerName,
        customerDoc: customerDoc || undefined,
        customerAddress: customerAddress || undefined,
        customerPhone: customerPhone || undefined,
        paymentMethod,
        operationCode: operationCode || undefined,
        amountPaid: paymentMethod === 'CASH' && numericPaid ? numericPaid : total,
        currency: 'PEN',
      };

      const result = await api.createSale(payload);
      setLastSale(result.sale);

      // Trigger Confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      clearCart();
      fetchProducts();
    } catch (err: any) {
      setSaleError(err.message || 'Error al emitir el comprobante');
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

  const handleShareWhatsApp = (sale: Sale) => {
    const phone = sale.customerPhone || customerPhone || '';
    const cleanPhone = phone.replace(/\D/g, '');
    const targetPhone = cleanPhone.length === 9 ? `51${cleanPhone}` : cleanPhone;

    const message = `¡Hola ${sale.customerName}! Gracias por tu compra en NexusPOS. Te adjuntamos tu ${sale.documentType} ${sale.saleNumber} por un total de S/ ${sale.total.toFixed(2)}. Descarga tu comprobante aquí: http://localhost:5000/api/sales/${sale.id}/pdf`;
    const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Punto de Venta & Facturación SUNAT</h1>
          <p className="page-subtitle">
            Emisión de Facturas, Boletas y Notas de Venta en Soles (S/) - {selectedBranch?.name} ({selectedBranch?.code})
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="badge badge-success" style={{ padding: '6px 12px' }}>
            <span className="pulse-indicator" style={{ width: '6px', height: '6px' }} />
            OSE / SUNAT Activo
          </span>
          <button className="btn btn-secondary btn-sm" onClick={fetchProducts}>
            Sincronizar Stock
          </button>
        </div>
      </div>

      {/* POS Grid: Catalog on Left, Checkout Drawer on Right */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 440px',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Product Search & Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Search & Category Filter Bar */}
          <div className="card" style={{ padding: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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
                placeholder="Buscar por nombre, código SKU o escanear código de barras..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

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

          {/* Products Cards */}
          {loading ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 0' }}>
              <div className="pulse-indicator" style={{ width: '16px', height: '16px' }} />
              <div style={{ marginTop: '12px', color: 'var(--text-muted)' }}>Cargando catálogo en soles...</div>
            </div>
          ) : products.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 0' }}>
              <Package size={42} style={{ color: 'var(--text-subtle)', margin: '0 auto 12px auto' }} />
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>No hay productos coincidentes</div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
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
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {product.sku}
                        </span>
                        <span
                          className={`badge ${
                            isOutOfStock ? 'badge-danger' : isLowStock ? 'badge-warning' : 'badge-success'
                          }`}
                        >
                          {isOutOfStock ? 'Agotado' : `Stock: ${product.currentStock}`}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '0.92rem', fontWeight: 700, lineHeight: 1.3, marginBottom: '4px' }}>
                        {product.name}
                      </h3>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {product.category?.name}
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '12px',
                        paddingTop: '10px',
                        borderTop: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ fontSize: '1.18rem', fontWeight: 800, color: 'var(--primary)' }}>
                        S/ {product.price.toFixed(2)}
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        disabled={isOutOfStock}
                        onClick={() => addToCart(product)}
                      >
                        <Plus size={14} />
                        Agregar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Checkout Drawer (SUNAT + Cart + Payments) */}
        <div
          className="card"
          style={{
            position: 'sticky',
            top: '85px',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'calc(100vh - 105px)',
            padding: '18px',
          }}
        >
          {/* Document Type Selector (SUNAT) */}
          <div style={{ marginBottom: '14px' }}>
            <label className="form-label" style={{ fontSize: '0.72rem' }}>
              Tipo de Comprobante SUNAT
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
              <button
                type="button"
                className={`btn btn-sm ${documentType === 'BOLETA' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setDocumentType('BOLETA')}
                style={{ fontSize: '0.78rem', padding: '7px 4px' }}
              >
                Boleta (B001)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${documentType === 'FACTURA' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setDocumentType('FACTURA')}
                style={{ fontSize: '0.78rem', padding: '7px 4px' }}
              >
                Factura (F001)
              </button>
              <button
                type="button"
                className={`btn btn-sm ${documentType === 'NOTA_VENTA' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setDocumentType('NOTA_VENTA')}
                style={{ fontSize: '0.78rem', padding: '7px 4px' }}
              >
                Nota Venta
              </button>
            </div>
          </div>

          {/* Customer & RUC/DNI Lookup Bar */}
          <div
            style={{
              padding: '10px 12px',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              marginBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
              <input
                type="text"
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '0.82rem', flex: 1 }}
                placeholder={documentType === 'FACTURA' ? 'RUC (11 dígitos)...' : 'DNI (8 dígitos) o RUC...'}
                value={customerDoc}
                onChange={(e) => setCustomerDoc(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLookupDoc();
                }}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleLookupDoc}
                disabled={searchingDoc}
                title="Consultar Padrón SUNAT / RENIEC"
              >
                {searchingDoc ? '...' : <Search size={14} />}
                Consultar
              </button>
            </div>

            {docFeedback && (
              <div style={{ fontSize: '0.72rem', color: docFeedback.startsWith('✓') ? 'var(--success)' : 'var(--warning)', marginBottom: '6px' }}>
                {docFeedback}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <input
                type="text"
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                placeholder="Razón Social / Nombre"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <input
                type="text"
                className="form-input"
                style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                placeholder="Teléfono / WhatsApp"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
            }}
          >
            <span>Ítems en Orden ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
            {cart.length > 0 && (
              <button
                className="btn btn-danger btn-sm"
                style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                onClick={clearCart}
              >
                <Trash2 size={11} /> Vaciar
              </button>
            )}
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              maxHeight: '180px',
              minHeight: '120px',
            }}
          >
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                Seleccione productos del catálogo para facturar
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.82rem',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, marginRight: '8px' }}>
                    <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.product.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      S/ {item.product.price.toFixed(2)} c/u
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '2px 6px' }}
                      onClick={() => updateQuantity(item.product.id, -1)}
                    >
                      <Minus size={11} />
                    </button>
                    <span style={{ fontWeight: 700, minWidth: '18px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '2px 6px' }}
                      onClick={() => updateQuantity(item.product.id, 1)}
                    >
                      <Plus size={11} />
                    </button>
                  </div>

                  <div style={{ fontWeight: 700, minWidth: '60px', textAlign: 'right' }}>
                    S/ {(item.product.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Peruvian Payment Methods */}
          <div style={{ marginTop: '10px' }}>
            <label className="form-label" style={{ fontSize: '0.72rem' }}>
              Medio de Pago
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
              <button
                type="button"
                className={`btn btn-sm ${paymentMethod === 'CASH' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPaymentMethod('CASH')}
                style={{ padding: '6px 2px', fontSize: '0.72rem' }}
              >
                <Banknote size={13} /> Efec.
              </button>
              <button
                type="button"
                className={`btn btn-sm ${paymentMethod === 'YAPE' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setPaymentMethod('YAPE');
                  setShowQrModal('YAPE');
                }}
                style={{ padding: '6px 2px', fontSize: '0.72rem', color: paymentMethod === 'YAPE' ? '#fff' : '#a855f7' }}
              >
                <Smartphone size={13} /> Yape
              </button>
              <button
                type="button"
                className={`btn btn-sm ${paymentMethod === 'PLIN' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => {
                  setPaymentMethod('PLIN');
                  setShowQrModal('PLIN');
                }}
                style={{ padding: '6px 2px', fontSize: '0.72rem', color: paymentMethod === 'PLIN' ? '#fff' : '#06b6d4' }}
              >
                <QrCode size={13} /> Plin
              </button>
              <button
                type="button"
                className={`btn btn-sm ${paymentMethod === 'CARD' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPaymentMethod('CARD')}
                style={{ padding: '6px 2px', fontSize: '0.72rem' }}
              >
                <CreditCard size={13} /> Tarj.
              </button>
              <button
                type="button"
                className={`btn btn-sm ${paymentMethod === 'TRANSFER' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPaymentMethod('TRANSFER')}
                style={{ padding: '6px 2px', fontSize: '0.72rem' }}
              >
                <Building size={13} /> BCP
              </button>
            </div>

            {/* If Cash: Quick Soles Bills & Change Calculator */}
            {paymentMethod === 'CASH' && (
              <div
                style={{
                  marginTop: '8px',
                  padding: '8px 10px',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', gap: '4px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  {[10, 20, 50, 100, 200].map((bill) => (
                    <button
                      key={bill}
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '3px 7px', fontSize: '0.7rem' }}
                      onClick={() => setAmountPaid(String(bill))}
                    >
                      S/ {bill}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '3px 7px', fontSize: '0.7rem' }}
                    onClick={() => setAmountPaid(String(total))}
                  >
                    Exacto
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <input
                      type="number"
                      step="0.10"
                      className="form-input"
                      style={{ padding: '5px 8px', fontSize: '0.82rem' }}
                      placeholder="Paga con S/..."
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                    />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>VUELTO:</div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--success)' }}>
                      S/ {change.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* If Yape or Plin or Card: Operation Code */}
            {(paymentMethod === 'YAPE' || paymentMethod === 'PLIN' || paymentMethod === 'CARD') && (
              <div style={{ marginTop: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                  placeholder={`N° de Operación ${paymentMethod} / Voucher...`}
                  value={operationCode}
                  onChange={(e) => setOperationCode(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Pricing Totals */}
          <div
            style={{
              marginTop: '10px',
              padding: '10px 12px',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              fontSize: '0.82rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Op. Gravada:</span>
              <span>S/ {subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginTop: '2px' }}>
              <span>I.G.V. (18%):</span>
              <span>S/ {tax.toFixed(2)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.2rem',
                fontWeight: 800,
                color: 'var(--primary)',
                marginTop: '6px',
                paddingTop: '6px',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <span>TOTAL A COBRAR:</span>
              <span>S/ {total.toFixed(2)}</span>
            </div>
          </div>

          {saleError && (
            <div
              style={{
                marginTop: '8px',
                padding: '8px',
                background: 'var(--danger-bg)',
                color: 'var(--danger)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                display: 'flex',
                gap: '6px',
              }}
            >
              <AlertCircle size={14} />
              <span>{saleError}</span>
            </div>
          )}

          {/* Checkout Button */}
          <button
            className="btn btn-success btn-lg"
            style={{ marginTop: '10px', width: '100%', fontWeight: 800 }}
            disabled={cart.length === 0 || processingSale}
            onClick={handleCheckout}
          >
            {processingSale ? (
              'Emitiendo a SUNAT...'
            ) : (
              <>
                <CheckCircle2 size={18} />
                Emitir {documentType} (S/ {total.toFixed(2)})
              </>
            )}
          </button>
        </div>
      </div>

      {/* QR Code Modal for Yape / Plin */}
      {showQrModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '380px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px' }}>
              Código QR {showQrModal}
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Escanea con la app de {showQrModal} para pagar al instante
            </p>

            {/* Simulated Peruvian QR Box */}
            <div
              style={{
                width: '190px',
                height: '190px',
                margin: '0 auto 16px auto',
                background: '#ffffff',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <QrCode size={140} color={showQrModal === 'YAPE' ? '#702283' : '#00aae4'} />
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                987 654 321
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '14px' }}>
              Titular: Nexus POS Perú S.A.C.
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowQrModal(null)}>
              <Check size={16} /> Confirmar Escaneo
            </button>
          </div>
        </div>
      )}

      {/* Success Modal (SUNAT Approved + WhatsApp Sharing) */}
      {lastSale && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px', textAlign: 'center' }}>
            <div
              style={{
                width: '58px',
                height: '58px',
                borderRadius: '50%',
                background: 'var(--success-bg)',
                color: 'var(--success)',
                border: '2px solid var(--success-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px auto',
              }}
            >
              <CheckCircle2 size={32} />
            </div>

            <span className="badge badge-success" style={{ marginBottom: '6px' }}>
              ACEPTADO POR SUNAT (CDR Generado)
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>¡Comprobante Emitido!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>
              El inventario y kardex se han actualizado automáticamente.
            </p>

            {/* Receipt Summary Box */}
            <div
              style={{
                margin: '16px 0',
                padding: '14px',
                background: 'var(--bg-body)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                textAlign: 'left',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Serie y Número:</span>
                <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontSize: '1rem' }}>
                  {lastSale.saleNumber}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Cliente:</span>
                <span>{lastSale.customerName}</span>
              </div>
              {lastSale.customerDoc && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>RUC / DNI:</span>
                  <span>{lastSale.customerDoc}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Medio de Pago:</span>
                <span className="badge badge-primary">{lastSale.paymentMethod}</span>
              </div>
              {lastSale.changeAmount !== null && lastSale.changeAmount !== undefined && lastSale.changeAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Vuelto en Soles:</span>
                  <strong style={{ color: 'var(--success)' }}>S/ {lastSale.changeAmount.toFixed(2)}</strong>
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '6px',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '1.15rem',
                  fontWeight: 800,
                }}
              >
                <span>Total Facturado:</span>
                <span style={{ color: 'var(--primary)' }}>S/ {lastSale.total.toFixed(2)} PEN</span>
              </div>
            </div>

            {/* Direct WhatsApp Share Button */}
            <div style={{ marginBottom: '14px' }}>
              <button
                className="btn btn-success"
                style={{
                  width: '100%',
                  background: '#25D366',
                  borderColor: '#25D366',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                }}
                onClick={() => handleShareWhatsApp(lastSale)}
              >
                <MessageCircle size={18} />
                Enviar Comprobante por WhatsApp
              </button>
            </div>

            {/* PDF and Ticket Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                className="btn btn-primary"
                onClick={() => handleDownloadPdf(lastSale.id, lastSale.saleNumber)}
              >
                <FileDown size={16} />
                Factura A4 (PDF)
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => generateClientReceiptPDF(lastSale)}
              >
                <Printer size={16} />
                Ticket Térmico (80mm)
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
