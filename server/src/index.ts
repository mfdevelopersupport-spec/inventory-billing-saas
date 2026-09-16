import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import branchRoutes from './routes/branch.routes.js';
import productRoutes from './routes/product.routes.js';
import saleRoutes from './routes/sale.routes.js';
import transferRoutes from './routes/transfer.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import sunatRoutes from './routes/sunat.routes.js';
import cashRegisterRoutes from './routes/cashRegister.routes.js';
import kardexRoutes from './routes/kardex.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sunat', sunatRoutes);
app.use('/api/cash-register', cashRegisterRoutes);
app.use('/api/kardex', kardexRoutes);

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'nexuspos-peru-saas-api',
    country: 'PE',
    sunatStatus: 'CONNECTED',
    timestamp: new Date().toISOString(),
  });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    message: 'Error interno en el servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor NexusPOS ejecutándose en http://localhost:${PORT}`);
});
