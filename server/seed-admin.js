#!/usr/bin/env node
/**
 * Quick seed script to ensure admin user exists
 * Run with: node seed-admin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('./config/env');

const User = require('./models/User');

async function seedAdmin() {
  try {
    console.log('[SEED] Connecting to MongoDB...');
    await mongoose.connect(config.MONGODB_URI);
    console.log('[SEED] Connected successfully');

    // Check if admin exists
    const adminExists = await User.findOne({ role: 'admin', email: 'admin@iec.ac.in' });

    if (adminExists) {
      console.log('[SEED] ✅ Admin user already exists');
      console.log(`     Email: ${adminExists.email}`);
      console.log(`     Name: ${adminExists.name}`);
      console.log('[SEED] To reset password, delete the admin record and re-run this script');
    } else {
      console.log('[SEED] Creating admin user...');

      const admin = await User.create({
        email: 'admin@iec.ac.in',
        password: 'Admin@123',
        name: 'IEC Administrator',
        role: 'admin',
        isActive: true,
      });

      console.log('[SEED] ✅ Admin user created successfully');
      console.log(`     ID: ${admin._id}`);
      console.log(`     Email: ${admin.email}`);
      console.log(`     Name: ${admin.name}`);
      console.log(`     Role: ${admin.role}`);
    }

    // Check if test student exists
    let student = await User.findOne({ role: 'student', email: 'student@iec.ac.in' });

    if (!student) {
      console.log('[SEED] Creating test student...');
      student = await User.create({
        email: 'student@iec.ac.in',
        password: 'Student@123',
        name: 'Test Student',
        role: 'student',
        rollNo: 'CS202101001',
        enrollmentNo: 'IEC2021CS001',
        department: 'CSE',
        branch: 'CSE',
        semester: 3,
        batch: '2021',
        isActive: true,
      });
      console.log('[SEED] ✅ Test student created');
      console.log(`     Email: ${student.email}`);
    } else {
      console.log('[SEED] ✅ Test student already exists');
    }

    // Check if test faculty exists
    let faculty = await User.findOne({ role: 'faculty', email: 'faculty@iec.ac.in' });

    if (!faculty) {
      console.log('[SEED] Creating test faculty...');
      faculty = await User.create({
        email: 'faculty@iec.ac.in',
        password: 'Faculty@123',
        name: 'Dr. Test Faculty',
        role: 'faculty',
        department: 'CSE',
        designation: 'Assistant Professor',
        employeeId: 'EMP001',
        rollNo: 'EMP001',
        isActive: true,
      });
      console.log('[SEED] ✅ Test faculty created');
      console.log(`     Email: ${faculty.email}`);
    } else {
      console.log('[SEED] ✅ Test faculty already exists');
    }

    console.log('\n[SEED] 📋 Test Credentials:');
    console.log('─────────────────────────────────────────');
    console.log('  ADMIN:');
    console.log('    Email: admin@iec.ac.in');
    console.log('    Password: Admin@123');
    console.log('');
    console.log('  STUDENT:');
    console.log('    Email: student@iec.ac.in');
    console.log('    Password: Student@123');
    console.log('');
    console.log('  FACULTY:');
    console.log('    Email: faculty@iec.ac.in');
    console.log('    Password: Faculty@123');
    console.log('─────────────────────────────────────────');

    await mongoose.connection.close();
    console.log('\n[SEED] ✅ Seed completed successfully\n');
    process.exit(0);
  } catch (err) {
    console.error('[SEED] ❌ Error:', err.message);
    process.exit(1);
  }
}

seedAdmin();
