/**
 * Seed script - creates default admin user for MyIEC ERP
 * Run: node server/seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/myiec_erp';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    const existing = await User.findOne({ email: 'admin@iec.ac.in' });
    if (existing) {
      console.log('Admin user already exists: admin@iec.ac.in');
      process.exit(0);
      return;
    }
    await User.create({
      email: 'admin@iec.ac.in',
      password: 'Admin@123',
      role: 'admin',
      name: 'IEC Admin',
    });
    console.log('Admin user created: admin@iec.ac.in / Admin@123');
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
