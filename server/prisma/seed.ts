import { PrismaClient, Role, PaymentMethod, SaleStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando carga de datos de prueba (Seed)...');

  // 1. Limpieza de tablas (en orden inverso de dependencia)
  await prisma.transferItem.deleteMany();
  await prisma.stockTransfer.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.branchStock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();

  // 2. Crear Sucursales
  const branchCentral = await prisma.branch.create({
    data: {
      name: 'Sucursal Central (Matriz)',
      code: 'SUC-01',
      address: 'Av. Javier Prado Este 2450, San Isidro',
      phone: '+51 1 450-1000',
      isMain: true,
      active: true,
    },
  });

  const branchNorte = await prisma.branch.create({
    data: {
      name: 'Sucursal Norte (Plaza Mall)',
      code: 'SUC-02',
      address: 'Av. Alfredo Mendiola 1400, Los Olivos',
      phone: '+51 1 520-2200',
      isMain: false,
      active: true,
    },
  });

  const branchSur = await prisma.branch.create({
    data: {
      name: 'Sucursal Sur (Centro Financiero)',
      code: 'SUC-03',
      address: 'Av. Primavera 980, Surco',
      phone: '+51 1 310-4400',
      isMain: false,
      active: true,
    },
  });

  console.log('✓ Sucursales creadas');

  // 3. Crear Usuarios con roles
  const hashedPasswordAdmin = await bcrypt.hash('admin123', 10);
  const hashedPasswordManager = await bcrypt.hash('manager123', 10);
  const hashedPasswordCashier = await bcrypt.hash('cajero123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Carlos Mendoza (SuperAdmin)',
      email: 'admin@saas.com',
      password: hashedPasswordAdmin,
      role: Role.SUPERADMIN,
      branchId: branchCentral.id,
      active: true,
    },
  });

  const managerNorte = await prisma.user.create({
    data: {
      name: 'Lucía Fernández (Gerente Norte)',
      email: 'manager.norte@saas.com',
      password: hashedPasswordManager,
      role: Role.BRANCH_MANAGER,
      branchId: branchNorte.id,
      active: true,
    },
  });

  const cashierCentral = await prisma.user.create({
    data: {
      name: 'Martín Rojas (Cajero Central)',
      email: 'cajero.central@saas.com',
      password: hashedPasswordCashier,
      role: Role.CASHIER,
      branchId: branchCentral.id,
      active: true,
    },
  });

  const cashierNorte = await prisma.user.create({
    data: {
      name: 'Sofía Castro (Cajera Norte)',
      email: 'cajero.norte@saas.com',
      password: hashedPasswordCashier,
      role: Role.CASHIER,
      branchId: branchNorte.id,
      active: true,
    },
  });

  console.log('✓ Usuarios creados con roles RBAC');

  // 4. Crear Categorías
  const catTech = await prisma.category.create({
    data: { name: 'Laptops & Cómputo', description: 'Equipos portátiles y estaciones de trabajo' },
  });

  const catAcc = await prisma.category.create({
    data: { name: 'Periféricos & Accesorios', description: 'Teclados, ratones y cables de alta gama' },
  });

  const catAudio = await prisma.category.create({
    data: { name: 'Audio & Sonido', description: 'Audífonos, micrófonos y altavoces inalámbricos' },
  });

  const catMobile = await prisma.category.create({
    data: { name: 'Smartphones & Gadgets', description: 'Teléfonos móviles y cargadores rápidos' },
  });

  console.log('✓ Categorías creadas');

  // 5. Crear Productos
  const productsData = [
    {
      sku: 'SKU-LNV-T14',
      barcode: '77501001',
      name: 'Lenovo ThinkPad T14 Gen 4 Core i7 16GB 512GB',
      description: 'Laptop empresarial ultrarresistente con lector de huella y pantalla FHD IPS.',
      price: 1250.0,
      costPrice: 950.0,
      categoryId: catTech.id,
      minStockAlert: 5,
      stocks: [
        { branchId: branchCentral.id, quantity: 14, minStockAlert: 5 },
        { branchId: branchNorte.id, quantity: 3, minStockAlert: 5 }, // Alerta stock bajo
        { branchId: branchSur.id, quantity: 8, minStockAlert: 4 },
      ],
    },
    {
      sku: 'SKU-APL-M2',
      barcode: '77501002',
      name: 'Apple MacBook Air 13" M2 8GB 256GB Midnight',
      description: 'Diseño ultrafino con pantalla Liquid Retina y hasta 18 horas de batería.',
      price: 1450.0,
      costPrice: 1100.0,
      categoryId: catTech.id,
      minStockAlert: 4,
      stocks: [
        { branchId: branchCentral.id, quantity: 9, minStockAlert: 4 },
        { branchId: branchNorte.id, quantity: 2, minStockAlert: 4 }, // Alerta stock bajo
        { branchId: branchSur.id, quantity: 0, minStockAlert: 4 }, // Agotado
      ],
    },
    {
      sku: 'SKU-MON-LG27',
      barcode: '77501003',
      name: 'Monitor LG UltraGear 27" 144Hz 1ms IPS HDR',
      description: 'Monitor gamer profesional con resolución QHD y compatibilidad G-Sync.',
      price: 340.0,
      costPrice: 240.0,
      categoryId: catTech.id,
      minStockAlert: 5,
      stocks: [
        { branchId: branchCentral.id, quantity: 18, minStockAlert: 5 },
        { branchId: branchNorte.id, quantity: 7, minStockAlert: 5 },
        { branchId: branchSur.id, quantity: 12, minStockAlert: 5 },
      ],
    },
    {
      sku: 'SKU-LOG-GPRO',
      barcode: '77501004',
      name: 'Teclado Mecánico Logitech G PRO RGB Lightsync',
      description: 'Switches táctiles GX Blue con diseño compacto Tenkeyless.',
      price: 129.0,
      costPrice: 85.0,
      categoryId: catAcc.id,
      minStockAlert: 6,
      stocks: [
        { branchId: branchCentral.id, quantity: 24, minStockAlert: 6 },
        { branchId: branchNorte.id, quantity: 4, minStockAlert: 6 }, // Alerta stock bajo
        { branchId: branchSur.id, quantity: 15, minStockAlert: 6 },
      ],
    },
    {
      sku: 'SKU-LOG-MX3S',
      barcode: '77501005',
      name: 'Mouse Inalámbrico Logitech MX Master 3S Dark Grey',
      description: 'Sensor óptico de 8000 DPI con clics silenciosos y scroll MagSpeed.',
      price: 99.0,
      costPrice: 65.0,
      categoryId: catAcc.id,
      minStockAlert: 8,
      stocks: [
        { branchId: branchCentral.id, quantity: 35, minStockAlert: 8 },
        { branchId: branchNorte.id, quantity: 14, minStockAlert: 8 },
        { branchId: branchSur.id, quantity: 20, minStockAlert: 8 },
      ],
    },
    {
      sku: 'SKU-SNY-XM5',
      barcode: '77501006',
      name: 'Audífonos Sony WH-1000XM5 Noise Cancelling',
      description: 'Líder en cancelación de ruido con audio de alta resolución y 30 horas de batería.',
      price: 389.0,
      costPrice: 280.0,
      categoryId: catAudio.id,
      minStockAlert: 5,
      stocks: [
        { branchId: branchCentral.id, quantity: 12, minStockAlert: 5 },
        { branchId: branchNorte.id, quantity: 1, minStockAlert: 5 }, // Alerta crítica
        { branchId: branchSur.id, quantity: 6, minStockAlert: 5 },
      ],
    },
    {
      sku: 'SKU-IPH-15PM',
      barcode: '77501007',
      name: 'Apple iPhone 15 Pro Max 256GB Titanio Natural',
      description: 'Chip A17 Pro con cámara tetraprisma de 5x y acabado en titanio de grado aeroespacial.',
      price: 1399.0,
      costPrice: 1120.0,
      categoryId: catMobile.id,
      minStockAlert: 3,
      stocks: [
        { branchId: branchCentral.id, quantity: 7, minStockAlert: 3 },
        { branchId: branchNorte.id, quantity: 5, minStockAlert: 3 },
        { branchId: branchSur.id, quantity: 3, minStockAlert: 3 },
      ],
    },
    {
      sku: 'SKU-ANK-65W',
      barcode: '77501008',
      name: 'Cargador Anker Nano II 65W GaN USB-C Tríple Puerto',
      description: 'Carga ultrarrápida compacta compatible con laptops, tablets y smartphones.',
      price: 49.9,
      costPrice: 28.0,
      categoryId: catMobile.id,
      minStockAlert: 10,
      stocks: [
        { branchId: branchCentral.id, quantity: 45, minStockAlert: 10 },
        { branchId: branchNorte.id, quantity: 22, minStockAlert: 10 },
        { branchId: branchSur.id, quantity: 30, minStockAlert: 10 },
      ],
    },
  ];

  for (const item of productsData) {
    const { stocks, ...productInfo } = item;
    const prod = await prisma.product.create({
      data: productInfo,
    });

    for (const stockItem of stocks) {
      await prisma.branchStock.create({
        data: {
          branchId: stockItem.branchId,
          productId: prod.id,
          quantity: stockItem.quantity,
          minStockAlert: stockItem.minStockAlert,
        },
      });
    }
  }

  console.log('✓ Catálogo de productos y matriz de stock por sucursal creados');

  // 6. Crear Ventas de prueba para estadísticas iniciales
  const p1 = await prisma.product.findFirst({ where: { sku: 'SKU-LNV-T14' } });
  const p2 = await prisma.product.findFirst({ where: { sku: 'SKU-LOG-MX3S' } });
  const p3 = await prisma.product.findFirst({ where: { sku: 'SKU-ANK-65W' } });

  if (p1 && p2 && p3) {
    // Venta 1 - Central
    const subtotal1 = p1.price + p2.price;
    const tax1 = Number((subtotal1 * 0.18).toFixed(2));
    const total1 = Number((subtotal1 + tax1).toFixed(2));

    await prisma.sale.create({
      data: {
        saleNumber: 'FAC-001-0001',
        branchId: branchCentral.id,
        userId: cashierCentral.id,
        customerName: 'Tech Innovators S.A.C.',
        customerDoc: '20601234567',
        customerEmail: 'contacto@techinnovators.com',
        paymentMethod: PaymentMethod.CARD,
        subtotal: subtotal1,
        tax: tax1,
        total: total1,
        status: SaleStatus.COMPLETED,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Hace 2 días
        items: {
          create: [
            { productId: p1.id, quantity: 1, unitPrice: p1.price, subtotal: p1.price },
            { productId: p2.id, quantity: 1, unitPrice: p2.price, subtotal: p2.price },
          ],
        },
      },
    });

    // Venta 2 - Norte
    const subtotal2 = p3.price * 2;
    const tax2 = Number((subtotal2 * 0.18).toFixed(2));
    const total2 = Number((subtotal2 + tax2).toFixed(2));

    await prisma.sale.create({
      data: {
        saleNumber: 'BOL-002-0001',
        branchId: branchNorte.id,
        userId: cashierNorte.id,
        customerName: 'Juan Pérez Díaz',
        customerDoc: '72819034',
        customerEmail: 'juan.perez@gmail.com',
        paymentMethod: PaymentMethod.CASH,
        subtotal: subtotal2,
        tax: tax2,
        total: total2,
        status: SaleStatus.COMPLETED,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Ayer
        items: {
          create: [
            { productId: p3.id, quantity: 2, unitPrice: p3.price, subtotal: subtotal2 },
          ],
        },
      },
    });
  }

  console.log('✓ Ventas de prueba cargadas');
  console.log('Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
