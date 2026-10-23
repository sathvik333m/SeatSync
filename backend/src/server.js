const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const db = require('./config/db');
const { requestLogger } = require('./middleware/logger');
const { errorHandler } = require('./middleware/errorHandler');

// Route Imports
const authRoutes = require('./routes/auth.routes');
const resourceRoutes = require('./routes/resource.routes');
const listingRoutes = require('./routes/listing.routes');
const requestRoutes = require('./routes/request.routes');
const sessionRoutes = require('./routes/session.routes');
const reportRoutes = require('./routes/report.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// Global Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// System Health and Database Verification Endpoint
app.get('/api/health', async (req, res) => {
  const dbStatus = await db.testConnection();
  return res.json({
    status: dbStatus.connected ? 'healthy' : 'database_disconnected',
    platform: 'SeatSync DBMS Platform',
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
});

// Mount Module APIs
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'NotFound',
    message: `API endpoint ${req.method} ${req.originalUrl} not found.`,
  });
});

// Central DBMS Error Handler
app.use(errorHandler);

// Server startup
const PORT = config.PORT;
app.listen(PORT, async () => {
  console.log(`\n======================================================`);
  console.log(`🚀 SeatSync Backend running on http://localhost:${PORT}`);
  console.log(`📡 Health Check & DB: http://localhost:${PORT}/api/health`);
  console.log(`======================================================\n`);

  // Verify DB on boot
  const status = await db.testConnection();
  if (status.connected) {
    console.log(`✅ Connected to PostgreSQL database "${status.database}"`);
    console.log(`✅ GiST Exclusion Extension (btree_gist): ${status.btreeGistActive ? 'Active' : 'Missing'}`);
  } else {
    console.warn(`⚠️ PostgreSQL is not currently reachable (${status.error}).`);
    console.warn(`👉 Run "docker compose up -d" to start your Docker PostgreSQL container.`);
  }
});
