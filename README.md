# 📦 NexusPOS | Plataforma SaaS de Inventario & Facturación Multi-Sucursal

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18%2B-61dafb.svg)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2d3748.svg)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6.svg)](https://www.typescriptlang.org/)

Plataforma SaaS empresarial de alta disponibilidad diseñada para resolver de forma integral el control de stock en tiempo real, alertas automáticas de reposición crítica, transferencias entre sucursales, facturación rápida en Punto de Venta (POS) y emisión digital de comprobantes en formato PDF.

---

## 🌟 Valor de Negocio y Portafolio

Este proyecto demuestra competencias técnicas avanzadas en:
1. **Lógica Transaccional ACID**: Decremento atómico de inventario por sucursal durante la venta con `prisma.$transaction`, garantizando consistencia absoluta ante concurrencia.
2. **Arquitectura Multi-Sucursal (Multi-Tenant/Multi-Branch)**: Aislamiento y consolidación de stock entre sedes (Central, Norte, Sur) con transferencias inter-sucursal auditadas.
3. **Control de Acceso Basado en Roles (RBAC)**: Permisos diferenciados para `SUPERADMIN` (gestión global), `BRANCH_MANAGER` (operaciones de sucursal) y `CASHIER` (facturación en terminal POS).
4. **Motor de Facturación y Emisión de PDF**: Generación vectorial de Facturas Electrónicas, Boletas de Venta y Tickets térmicos imprimibles con desglose de impuestos (IVA/IGV 18%).
5. **UI/UX Moderna & Accesible**: Sistema de diseño con CSS moderno, modo claro/oscuro (Dark/Light mode), microinteracciones y feedback inmediato.

---

## 🏗️ Arquitectura del Sistema

```text
inventory-billing-saas/
├── server/                     # Backend API REST
│   ├── prisma/
│   │   ├── schema.prisma       # Esquema relacional (Branch, User, Product, Stock, Sale, Transfer)
│   │   └── seed.ts             # Carga inicial con 3 sucursales, usuarios, catálogo y ventas
│   └── src/
│       ├── controllers/        # Controladores de negocio (Auth, Branch, Product, Sale, Transfer, Dashboard)
│       ├── middlewares/        # Autenticación JWT y validación RBAC
│       ├── routes/             # Endpoints versionados (/api/*)
│       ├── utils/              # Generador vectorial de facturas con PDFKit
│       ├── prisma.ts           # Cliente singleton de base de datos
│       └── index.ts            # Entrypoint del servidor Express
│
├── client/                     # Frontend SPA (React + Vite + TypeScript)
│   └── src/
│       ├── components/         # Header, Sidebar, LoginModal, etc.
│       ├── context/            # AuthContext (Sesión, Sucursal Activa, Tema Dark/Light)
│       ├── pages/
│       │   ├── DashboardPage.tsx     # Analítica ejecutiva, KPIs y gráficos
│       │   ├── POSPage.tsx           # Terminal de cobranza rápida y carrito
│       │   ├── InventoryPage.tsx     # Matriz de stock multi-sucursal y ajustes
│       │   ├── TransfersPage.tsx     # Logística de transferencias entre sedes
│       │   ├── SalesHistoryPage.tsx  # Historial auditado y descarga de PDF
│       │   └── BranchesPage.tsx      # Gestión de sucursales activas
│       ├── services/api.ts     # Cliente HTTP tipado con inyección de JWT
│       ├── utils/pdfReceipt.ts # Generador cliente de tickets POS con jsPDF
│       └── index.css           # Sistema de diseño con CSS Tokens
└── package.json                # Orquestador de scripts
```

---

## 👥 Credenciales de Demostración (Roles RBAC)

La base de datos viene precargada con cuentas para evaluar cada rol:

| Rol | Correo Electrónico | Contraseña | Sucursal Asignada | Permisos |
| :--- | :--- | :--- | :--- | :--- |
| **SuperAdmin** | `admin@saas.com` | `admin123` | Global / Central | Acceso total, cambio de sucursal dinámico, creación de sedes y productos. |
| **Gerente Sucursal** | `manager.norte@saas.com` | `manager123` | Sucursal Norte | Gestión de inventario local, ajustes de stock, transferencias y reportes. |
| **Cajero POS** | `cajero.central@saas.com` | `cajero123` | Sucursal Central | Terminal de Punto de Venta, registro de ventas y emisión de facturas/boletas. |

*Nota: La pantalla de login cuenta con botones de acceso rápido para alternar entre roles con un solo clic.*

---

## ⚙️ Instalación y Puesta en Marcha

### Prerrequisitos
- **Node.js**: v18 o superior (`node -v`)
- **npm**: v9 o superior (`npm -v`)

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/inventory-billing-saas.git
cd inventory-billing-saas
```

### 2. Configurar y Levantar el Servidor Backend
```bash
cd server
npm install

# Generar cliente y migrar base de datos (SQLite Zero-Config precargado)
npx prisma db push
npx tsx prisma/seed.ts

# Iniciar servidor backend en modo desarrollo (Puerto 5000)
npm run dev
```

### 3. Configurar y Levantar el Cliente Frontend
En una nueva terminal:
```bash
cd client
npm install

# Iniciar servidor frontend con Vite (Puerto 5173)
npm run dev
```

Abra su navegador en **`http://localhost:5173`**.

---

## 🧪 Pruebas de Flujos Clave

1. **Venta en Punto de Venta (POS)**:
   - Inicie sesión como Cajero o SuperAdmin.
   - Navegue a **Punto de Venta (POS)**.
   - Agregue productos al carrito (observe cómo el stock disponible restringe la cantidad máxima).
   - Ingrese los datos del cliente y método de pago (Efectivo, Tarjeta o Transferencia).
   - Haga clic en **Cobrar & Emitir Factura** (se detonará la animación de confeti y se generará el comprobante).
   - Descargue el comprobante en **PDF** con membrete oficial o imprima el ticket térmico.

2. **Alertas de Stock en Tiempo Real**:
   - En la cabecera superior, observe el ícono de la campana con el badge numérico.
   - Los productos con stock igual o inferior al umbral mínimo se resaltan automáticamente en color amarillo (`Stock Bajo`) o rojo (`Agotado`).

3. **Transferencia entre Sucursales**:
   - Inicie sesión como SuperAdmin o Gerente.
   - Vaya a **Transferencias** > **Nueva Transferencia**.
   - Seleccione la sucursal emisora y receptora, indique la cantidad y confirme.
   - Verifique en la **Matriz de Inventario** cómo el balance se actualizó inmediatamente en ambas sedes.

---

## 📄 Licencia
Este proyecto se distribuye bajo la licencia MIT. Consulta el archivo `LICENSE` para más detalles.
