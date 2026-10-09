const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { testConnection } = require('./config/db');
const initializeDatabase = require('./scripts/initDb');
const authRoutes = require('./routes/authRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const publicRoutes = require('./routes/publicRoutes');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'NyaySetu API Platform',
    timestamp: new Date().toISOString()
  });
});

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/public', publicRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found.`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Something went wrong. Please try again.'
  });
});

// Start server after verifying DB connection
async function startServer() {
  console.log('[Server] Starting NyaySetu Express backend...');
  
  // Initialize database schema & seed data safely
  await initializeDatabase();

  const dbConnected = await testConnection();

  if (!dbConnected) {
    console.error('CRITICAL: Unable to establish database connection. Server starting aborted.');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 NyaySetu Server is running on port ${PORT}`);
    console.log(`🔗 API Base: http://localhost:${PORT}/api`);
    console.log(`====================================================`);
  });
}

startServer();
