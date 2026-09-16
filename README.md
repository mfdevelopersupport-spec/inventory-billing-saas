# 🇵🇪 NexusPOS Perú | SaaS Multi-Sucursal de Facturación Electrónica SUNAT & Gestión de Inventarios

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![SUNAT Ready](https://img.shields.io/badge/SUNAT-Facturación%20Electrónica%20Ready-red.svg)](https://www.sunat.gob.pe)
[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18%2B-61dafb.svg)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2d3748.svg)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6.svg)](https://www.typescriptlang.org/)

**NexusPOS Perú** es una solución SaaS empresarial de alto impacto comercial, diseñada específicamente para el mercado peruano y lista para comercializarse ultra rápido frente a competidores como TumiSoft, Bsale Perú, Facturalo, Wally POS y Alegra Perú.

Resuelve de forma nativa la **Facturación Electrónica SUNAT**, cobros con **Yape y Plin**, control y arqueo de **Caja Chica (Corte Z)**, trazabilidad de **Kardex**, exportación contable **SIRE SUNAT** y envío instantáneo de comprobantes por **WhatsApp**.

---

## 🚀 ¿Por qué se vende ultra rápido a negocios en Perú?

| Necesidad del Negocio Peruano | Solución Integrada en NexusPOS |
| :--- | :--- |
| **Facturación Oficial SUNAT** | Emisión de **Facturas Electrónicas (`F001`)**, **Boletas de Venta (`B001`)** y **Notas de Venta (`NV01`)** con cálculo de IGV 18%, código Hash SHA-256 y código QR oficial. |
| **Validación RUC / DNI** | Autocompletado inteligente de Razón Social y Nombres al ingresar los 8 dígitos (DNI) u 11 dígitos (RUC) sin salir de la pantalla de cobro. |
| **Billeteras Digitales (Yape / Plin)** | Cobro con código QR en pantalla y registro del N° de operación para cuadres bancarios. |
| **Efectivo y Vuelto Rápido** | Calculadora con botones rápidos de billetes peruanos (S/ 10, S/ 20, S/ 50, S/ 100, S/ 200) y cálculo automático del vuelto en soles. |
| **Envío por WhatsApp** | Botón directo que abre WhatsApp con mensaje comercial predeterminado y enlace de descarga del comprobante en PDF para el cliente. |
| **Control de Caja Chica & Arqueo** | Apertura con saldo inicial, registro de gastos menores del día (delivery, compras) y **Arqueo de Cierre de Turno (Corte Z)** con detección automática de sobrantes o faltantes. |
| **Kardex y Contabilidad SIRE** | Trazabilidad de entradas/salidas y exportación en formato oficial **SIRE SUNAT (Registro de Ventas e Ingresos Electrónico)** para el contador. |
| **Operación Multi-Sucursal** | Control independiente de inventario por sede con transferencias auditadas en tiempo real. |

---

## 🛠️ Stack Tecnológico

- **Backend**: Node.js, Express, TypeScript, Prisma ORM, JWT, PDFKit, SHA-256 Hash.
- **Frontend**: React 18, Vite, TypeScript, Lucide Icons, Canvas-Confetti, jsPDF (Tickets 80mm térmicos).
- **Base de Datos**: SQLite (Zero-Config inmediata para demostraciones, 100% compatible con PostgreSQL mediante cadena de conexión).
- **Estilos**: Sistema de diseño moderno en CSS Vanilla con variables de diseño, modo claro/oscuro (Dark/Light Mode) y estética Glassmorphism.

---

## 👥 Credenciales de Demostración (Roles RBAC)

La plataforma incluye botones de **Acceso Rápido** en la pantalla de inicio de sesión:

| Rol | Correo Electrónico | Contraseña | Sucursal Asignada | Capacidades |
| :--- | :--- | :--- | :--- | :--- |
| **SuperAdmin** | `admin@saas.com` | `admin123` | Global / Todas | Control total, cambio dinámico de sucursal, apertura de sedes, creación de productos y analítica consolidada. |
| **Gerente de Sucursal** | `manager.norte@saas.com` | `manager123` | Sucursal Norte | Gestión de inventario local, ajustes de stock, transferencias inter-sucursal y reportes. |
| **Cajero POS** | `cajero.central@saas.com` | `cajero123` | Sucursal Central | Punto de Venta (POS), control de caja chica, arqueo de turno y emisión de boletas/facturas. |

---

## ⚡ Instalación y Puesta en Marcha en 2 Minutos

### 1. Clonar el Repositorio
```bash
git clone https://github.com/mfdevelopersupport-spec/inventory-billing-saas.git
cd inventory-billing-saas
```

### 2. Iniciar Backend (Puerto 5000)
```bash
cd server
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

### 3. Iniciar Frontend (Puerto 5173)
En otra terminal:
```bash
cd client
npm install
npm run dev
```

Acceda a **`http://localhost:5173`** en su navegador web.

---

## 💡 Guía de Demostración Comercial para Clientes

1. **Aperturar Caja Chica**:
   - Vaya a **Caja Chica & Turnos** y haga clic en **Aperturar Turno de Caja** con S/ 100.00.
2. **Facturar en el Punto de Venta**:
   - Vaya a **Punto de Venta (POS)**.
   - Seleccione **Factura (F001)** e ingrese el RUC `20601234567` (haga clic en *Consultar* para ver el autocompletado de la Razón Social y Dirección Fiscal).
   - Agregue productos al carrito y elija **Yape** ingresando el código de operación o **Efectivo** pagando con S/ 200 para ver el cálculo del vuelto.
   - Presione **Emitir Factura** (se detonará la animación de éxito con comprobante SUNAT).
   - Pruebe el botón **Enviar Comprobante por WhatsApp** o descargue la **Factura PDF** / **Ticket Térmico de 80mm**.
3. **Registrar un Gasto de Caja Chica**:
   - Vaya a **Caja Chica & Turnos** > **Gasto / Ingreso Menor**, registre un egreso de S/ 15.00 por "Pago de delivery de bolsas".
4. **Cierre de Caja y Arqueo (Corte Z)**:
   - Haga clic en **Arqueo & Cerrar Caja**, ingrese el dinero contado y observe la conciliación automática entre el sistema y la gaveta física.
5. **Kardex y Reporte SIRE SUNAT**:
   - Vaya a **Kardex & SIRE SUNAT** para auditar el movimiento de salida y descargue el archivo compatible con el Registro de Ventas de SUNAT en un solo clic.

---

## 📄 Licencia
Distribuido bajo la Licencia MIT. Consulte el archivo `LICENSE` para más información.
