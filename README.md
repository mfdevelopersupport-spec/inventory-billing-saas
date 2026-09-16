# 📦 Inventory & Billing SaaS (Multi-Sucursal)

> Plataforma SaaS empresarial de alta fidelidad para el control de inventario en tiempo real, alertas de stock crítico, operaciones multi-sucursal, facturación en Punto de Venta (POS) y emisión de comprobantes en PDF con control de acceso basado en roles (RBAC).

---

## 🚀 Características Principales

- **Arquitectura Multi-Sucursal**: Gestión centralizada y aislada de inventarios por sucursal con transferencias auditadas.
- **Control de Stock y Alertas en Tiempo Real**: Cálculo automático de stock disponible y badges de advertencia cuando se alcanza el umbral mínimo.
- **Punto de Venta (POS) y Facturación**: Terminal de cobro ultrarrápido con selector de productos, cálculo de impuestos, métodos de pago múltiples y validación de stock atómica.
- **Emisión de Facturas y Comprobantes en PDF**: Generación vectorial de comprobantes formales listos para imprimir o descargar.
- **Control de Acceso Basado en Roles (RBAC)**: Roles de `SUPERADMIN`, `BRANCH_MANAGER` y `CASHIER` con permisos estrictos.
- **Dashboard y Analítica**: Métricas en tiempo real de facturación, productos más vendidos y rendimiento por sucursal.
- **Diseño Moderno & UI Dinámica**: Interfaz premium con tema claro y oscuro, microinteracciones y alta accesibilidad.

---

## 🛠️ Stack Tecnológico

- **Backend**: Node.js, Express, TypeScript, Prisma ORM, JWT, bcryptjs, PDFKit.
- **Frontend**: React 18, Vite, TypeScript, Lucide Icons, jsPDF.
- **Base de Datos**: SQLite (Zero-Config inmediata para desarrollo y demos, 100% compatible con PostgreSQL para producción).
- **Estilos**: Vanilla CSS Moderno con CSS Tokens, temas dinámicos y Glassmorphism.

---

## 📁 Estructura del Proyecto

```text
inventory-billing-saas/
├── server/                 # Backend API (Node.js, Express, Prisma)
│   ├── prisma/             # Schema relacional y seeds
│   └── src/
│       ├── controllers/    # Controladores de lógica de negocio
│       ├── middlewares/    # Autenticación y validación RBAC
│       ├── routes/         # Endpoints de la API REST
│       └── utils/          # Utilidades y generador de PDF
├── client/                 # Frontend SPA (React + Vite + TypeScript)
│   ├── src/
│   │   ├── components/     # Componentes reutilizables y modales
│   │   ├── context/        # Estado global (Auth, Sucursal, Carrito)
│   │   ├── pages/          # Vistas (POS, Inventario, Reportes, etc.)
│   │   ├── styles/         # Tokens de diseño y estilos globales
│   │   └── utils/          # Generador de PDF en cliente y helpers
└── package.json            # Scripts de orquestación raíz
```

---

## ⚙️ Instalación y Ejecución Rápida

*Instrucciones detalladas en desarrollo incremental...*
