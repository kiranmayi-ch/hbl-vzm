require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const { createTables } = require('./db/schema');
const { seed } = require('./db/seed');
const { getConnection, DB_PATH } = require('./db/connection');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const sectionRoutes = require('./routes/sections');
const monthRoutes = require('./routes/months');
const reportRoutes = require('./routes/reports');
const moduleRoutes = require('./routes/modules');
const dashboardRoutes = require('./routes/dashboard');
const trendRoutes = require('./routes/trends');
const whatsappRoutes = require('./routes/whatsapp');
const uploadRoutes = require('./routes/uploads');
const logRoutes = require('./routes/logs');

const app = express();
const PORT = process.env.PORT || 3001;

// Create uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
// Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://hbl-vzm.vercel.app'
  ],
  credentials: true
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/months', monthRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/trends', trendRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/logs', logRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

process.on('uncaughtException', err => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', err => {
  console.error('UNHANDLED REJECTION:', err);
});

// Initialize database and start server
function initialize() {
  try {
    // Check if DB exists, if not seed it
    const dbExists = fs.existsSync(DB_PATH);

    createTables();

    if (!dbExists) {
      console.log('📦 First run detected. Seeding database...');
      seed();
    } else {
      // Check if sections exist
      const db = getConnection();
      const sectionCount = db.prepare('SELECT COUNT(*) as cnt FROM sections').get();
      if (sectionCount.cnt === 0) {
        console.log('📦 Empty database detected. Seeding...');
        seed();
      }
    }

    app.listen(PORT, () => {
      console.log(`\n🚀 MEC Dashboard API Server running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💾 Database: ${DB_PATH}\n`);
    });
  } catch (error) {
    console.error('❌ Failed to initialize server:', error);
    process.exit(1);
  }
}

initialize();
