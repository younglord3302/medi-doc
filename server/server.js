// Security and utilities
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware - helmet first
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting - prevent DoS attacks (increased for development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 500, // More requests in development
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));

// Request size limits for security
app.use(express.json({
  limit: '10mb',
  strict: true
}));
app.use(express.urlencoded({
  limit: '10mb',
  extended: true,
  parameterLimit: 1000
}));

// MongoDB connection - only connect in non-test environments
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medi-doc', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log('MongoDB connected');

    // Only seed admin in development environment or if explicitly requested
    if (process.env.NODE_ENV !== 'production' || process.env.SEED_ADMIN === 'true') {
      const User = require('./models/User');
      try {
        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists) {
          const adminUser = await User.create({
            firstName: 'System',
            lastName: 'Administrator',
            email: 'admin@medidoc.com',
            password: 'admin123!',
            role: 'admin'
          });
          console.log('Default admin user created:');
          console.log('Email: admin@medidoc.com');
          console.log('Password: admin123!');
          console.log('Please change these credentials after first login!');
        }
      } catch (error) {
        console.error('Error creating admin user:', error);
      }
    }
  })
  .catch(err => console.log(err));
}

// Routes
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const recordRoutes = require('./routes/records');
const appointmentRoutes = require('./routes/appointments');
const auditRoutes = require('./routes/audits');

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/audits', auditRoutes);

// Health check route - add before other fallbacks
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "Medi-Doc API",
    env: process.env.NODE_ENV || "development",
    time: new Date().toISOString(),
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(error.errors).map(err => err.message)
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate field value entered'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});

// Unhandled exceptions
process.on('uncaughtException', (err) => {
  console.log(`Error: ${err.message}`);
  process.exit(1);
});


app.get("/", (req, res) => {
  res.json({ message: "Medi-Doc API server is running" });
});

// Start server only when not in test environment
if (process.env.NODE_ENV !== "test") {
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
