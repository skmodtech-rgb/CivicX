require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./routes/auth');
const complaintRoutes = require('./routes/complaints');
const adminRoutes = require('./routes/admin');
const rewardRoutes = require('./routes/rewards');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security ────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));

// ─── Rate Limiting: 200 requests / 15 mins ──────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'Too many requests. Please try again later.' }
});
app.use('/api/', limiter);

// ─── Body Parsing ────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── API Routes ──────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/rewards', rewardRoutes);

// ─── Health Check ────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'operational',
    service: 'CivicX AI Backend',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// ─── Admin Seeding ───────────────────────────────────────
async function seedAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.log('⚠️  ADMIN_EMAIL or ADMIN_PASSWORD not set. Skipping admin seed.');
      return;
    }

    let admin = await User.findOne({ email: adminEmail.toLowerCase() });

    if (!admin) {
      admin = new User({
        name: 'CivicX Admin',
        email: adminEmail.toLowerCase(),
        password: adminPassword,
        role: 'admin',
        reputationScore: 100
      });
      await admin.save();
      console.log('✅ Admin account created:', adminEmail);
    } else if (admin.role !== 'admin') {
      admin.role = 'admin';
      await admin.save();
      console.log('✅ Existing user promoted to admin:', adminEmail);
    } else {
      console.log('✅ Admin account verified:', adminEmail);
    }
  } catch (error) {
    console.error('❌ Admin seeding error:', error.message);
  }
}

// ─── MongoDB Connection & Server Start ───────────────────
async function startServer() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri || mongoUri === 'your_mongodb_uri') {
      console.log('⚠️  MONGODB_URI not configured. Running in demo mode.');
      console.log('   Set MONGODB_URI in server/.env to connect to MongoDB.');

      app.listen(PORT, () => {
        console.log(`\n🏛️  CivicX AI Backend (Demo Mode)`);
        console.log(`   Port: ${PORT}`);
        console.log(`   Status: http://localhost:${PORT}/api/health\n`);
      });
      return;
    }

    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected');

    await seedAdmin();

    app.listen(PORT, () => {
      console.log(`\n🏛️  CivicX AI Backend v2.0`);
      console.log(`   Port: ${PORT}`);
      console.log(`   Database: Connected`);
      console.log(`   AI Engine: Gemini 2.5 Flash`);
      console.log(`   Status: http://localhost:${PORT}/api/health\n`);
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error.message);
    process.exit(1);
  }
}

startServer();
