#!/usr/bin/env node
/**
 * Fresh seed script - Clear all data and reseed with test users
 * Run: node server/seed-fresh.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const config = require('./config/env');
const { User, Subject, Attendance, Fee, Result, Exam, Timetable, Notice, LibraryBook, LibraryIssue } = require('./models');

async function freshSeed() {
  try {
    console.log('[SEED] Connecting to MongoDB...');
    await mongoose.connect(config.MONGODB_URI);
    console.log('[SEED] Connected successfully');

    // Clear all collections
    console.log('[SEED] Clearing all data...');
    await Promise.all([
      User.deleteMany({}),
      Subject.deleteMany({}),
      Attendance.deleteMany({}),
      Fee.deleteMany({}),
      Result.deleteMany({}),
      Exam.deleteMany({}),
      Timetable.deleteMany({}),
      Notice.deleteMany({}),
      LibraryBook.deleteMany({}),
      LibraryIssue.deleteMany({}),
    ]);
    console.log('[SEED] ✅ All data cleared');

    // Create admin
    console.log('[SEED] Creating admin user...');
    const admin = await User.create({
      email: 'admin@iec.ac.in',
      password: 'Admin@123',
      role: 'admin',
      name: 'IEC Administrator',
      isActive: true,
    });
    console.log('[SEED] ✅ Admin created: admin@iec.ac.in / Admin@123');

    // Create 10 faculty
    console.log('[SEED] Creating 10 faculty members...');
    const facultyList = [];
    for (let i = 1; i <= 10; i++) {
      const faculty = await User.create({
        email: `faculty${i}@iec.ac.in`,
        password: 'Faculty@123',
        role: 'faculty',
        name: `Prof. Faculty ${i}`,
        department: i <= 6 ? 'CSE' : 'ECE',
        designation: i % 2 ? 'Associate Professor' : 'Assistant Professor',
        employeeId: `EMP${String(i).padStart(3, '0')}`,
        isActive: true,
      });
      facultyList.push(faculty);
    }
    console.log('[SEED] ✅ Faculty created (faculty1-10@iec.ac.in / Faculty@123)');

    // Create 10 students
    console.log('[SEED] Creating 10 students...');
    const studentList = [];
    const branches = ['CSE', 'CSE', 'CSE', 'ECE', 'ECE', 'CSE', 'CSE', 'ECE', 'CSE', 'ECE'];
    for (let i = 1; i <= 10; i++) {
      const student = await User.create({
        email: `student${i}@iec.ac.in`,
        password: 'Student@123',
        role: 'student',
        name: `Student ${i}`,
        rollNo: `${branches[i - 1].slice(0, 2)}2021${String(i).padStart(3, '0')}`,
        enrollmentNo: `IEC2021${branches[i - 1].slice(0, 2)}${String(i).padStart(3, '0')}`,
        branch: branches[i - 1],
        semester: 3,
        batch: '2021',
        isActive: true,
      });
      studentList.push(student);
    }
    console.log('[SEED] ✅ Students created (student1-10@iec.ac.in / Student@123)');

    // Create subjects
    console.log('[SEED] Creating subjects...');
    const subjects = await Subject.insertMany([
      { code: 'CS301', name: 'Data Structures', credits: 4, branch: 'CSE', semester: 3 },
      { code: 'CS302', name: 'Database Systems', credits: 4, branch: 'CSE', semester: 3 },
      { code: 'CS303', name: 'Operating Systems', credits: 3, branch: 'CSE', semester: 3 },
      { code: 'CS304', name: 'Computer Networks', credits: 4, branch: 'CSE', semester: 3 },
      { code: 'EC301', name: 'Signals & Systems', credits: 4, branch: 'ECE', semester: 3 },
      { code: 'EC302', name: 'Digital Electronics', credits: 4, branch: 'ECE', semester: 3 },
    ]);
    console.log('[SEED] ✅ Subjects created');

    // Assign subjects to faculty
    console.log('[SEED] Assigning subjects to faculty...');
    const cseSubjects = subjects.filter((s) => s.branch === 'CSE').map((s) => s._id);
    const eceSubjects = subjects.filter((s) => s.branch === 'ECE').map((s) => s._id);
    for (let i = 0; i < facultyList.length; i++) {
      const subIds = i < 6 ? cseSubjects : eceSubjects;
      await User.findByIdAndUpdate(facultyList[i]._id, { subjects: subIds });
    }
    console.log('[SEED] ✅ Subjects assigned');

    // Create sample attendance records
    console.log('[SEED] Creating attendance records...');
    const today = new Date();
    const attRecords = [];
    for (let d = -45; d <= 5; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() + d);
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      for (let i = 0; i < studentList.length; i++) {
        const s = studentList[i];
        const studentBranch = branches[i];
        const subs = studentBranch === 'CSE' ? cseSubjects : eceSubjects;
        const cseFacultyCount = 6;
        const facultyIndex = studentBranch === 'CSE' 
          ? (Math.abs(d) % cseFacultyCount)
          : cseFacultyCount + (Math.abs(d) % (facultyList.length - cseFacultyCount));
        subs.forEach((subId) => {
          attRecords.push({
            student: s._id,
            subject: subId,
            date,
            status: Math.random() > 0.2 ? 'present' : 'absent',
            markedBy: facultyList[facultyIndex]._id,
          });
        });
      }
    }
    if (attRecords.length > 0) {
      await Attendance.insertMany(attRecords);
    }
    console.log('[SEED] ✅ Attendance records created');

    // Create sample fee records
    console.log('[SEED] Creating fee records...');
    const feeRecords = [];
    studentList.forEach((s, i) => {
      feeRecords.push({
        student: s._id,
        type: 'tuition',
        amount: 45000,
        dueDate: new Date('2025-01-15'),
        status: i < 7 ? 'paid' : 'pending',
        paidAmount: i < 7 ? 45000 : 0,
        paidDate: i < 7 ? new Date() : null,
      });
      feeRecords.push({
        student: s._id,
        type: 'exam',
        amount: 1500,
        dueDate: new Date('2025-02-01'),
        status: 'pending',
        paidAmount: 0,
      });
    });
    await Fee.insertMany(feeRecords);
    console.log('[SEED] ✅ Fee records created');

    console.log('\n' + '='.repeat(50));
    console.log('[SEED] 📋 DATABASE SEEDING COMPLETE!');
    console.log('='.repeat(50));
    console.log('\n🔐 TEST LOGIN CREDENTIALS:\n');
    console.log('👨‍💼 ADMIN:');
    console.log('   Email: admin@iec.ac.in');
    console.log('   Password: Admin@123\n');
    console.log('👨‍🏫 FACULTY (examples):');
    console.log('   Email: faculty1@iec.ac.in');
    console.log('   Password: Faculty@123\n');
    console.log('👨‍🎓 STUDENT (examples):');
    console.log('   Email: student1@iec.ac.in');
    console.log('   Password: Student@123\n');
    console.log('📌 Use these credentials to login in your application!');
    console.log('='.repeat(50) + '\n');

    process.exit(0);
  } catch (err) {
    console.error('[SEED] ❌ Error:', err.message);
    process.exit(1);
  }
}

freshSeed();
