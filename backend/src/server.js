require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const { PORT, CORS_ORIGIN } = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');

const propertiesRoutes = require('./routes/properties');
const leasesRoutes = require('./routes/leases');

const paymentsRoutes = require('./routes/payments');
const receiptsRoutes = require('./routes/receipts');

const maintenanceRoutes = require('./routes/maintenance');
const dashboardRoutes = require('./routes/dashboard');

const aiRoutes = require('./routes/ai');

const usersRoutes = require('./routes/users');

const notificationsRoutes = require('./routes/notifications');

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TOO_MANY_REQUESTS',
    message: 'Trop de tentatives, réessayez dans 15 minutes',
  },
});
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

// Health check
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/properties', propertiesRoutes);
app.use('/api/v1/leases', leasesRoutes);

app.use('/api/v1/payments', paymentsRoutes);
app.use('/api/v1/receipts', receiptsRoutes);

app.use('/api/v1/maintenance-requests', maintenanceRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/ai', aiRoutes);

app.use('/api/v1/users', usersRoutes);

app.use('/api/v1/notifications', notificationsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'NOT_FOUND', message: 'Route introuvable' });
});

// Global error handler
app.use(errorHandler);

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  const pino = require('pino');
  const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
  app.listen(PORT, () => {
    logger.info({ port: PORT }, 'BailPro API running');
    const { startScheduler } = require('./scripts/scheduler');
    startScheduler();
  });
}

module.exports = app;
