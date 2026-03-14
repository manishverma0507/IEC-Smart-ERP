/**
 * MongoDB connection - MyIEC ERP
 * Clean architecture: config layer
 */
const mongoose = require('mongoose');

const { runSeed } = require('../seed/runSeed');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myiec_erp', {
      maxPoolSize: 10,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
    await runSeed().catch((err) => console.error('Seed error:', err.message));
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => console.log('MongoDB disconnected'));

module.exports = { connectDB };
