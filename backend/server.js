// MUST be first to load environment variables before any other imports
import './preload.js';

import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/auth.js';

// Import routes
import authRoutes from './routes/auth.js';
import kycRoutes from './routes/kyc.js';
import walletRoutes from './routes/wallet.js';
import exchangeRateRoutes from './routes/exchangeRates.js';
import matchRoutes from './routes/match.js';
import transactionRoutes from './routes/transactions.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/kyc', kycRoutes);
app.use('/wallet', walletRoutes);
app.use('/exchange-rates', exchangeRateRoutes);
app.use('/match', matchRoutes);
app.use('/transactions', transactionRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    code: 'NOT_FOUND',
    path: req.path
  });
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log('\n════════════════════════════════════════════════════════');
  console.log('🌍 GLOBALPAY - P2P MONEY TRANSFER PLATFORM');
  console.log('════════════════════════════════════════════════════════');
  console.log(`\n✅ Backend API: http://localhost:${PORT}`);
  console.log(`✅ Frontend UI: http://localhost:5173`);
  console.log(`\n📚 API Health: http://localhost:${PORT}/health`);
  console.log(`📚 API Docs: ${PORT}/api/docs`);
  console.log('\n════════════════════════════════════════════════════════\n');
});
