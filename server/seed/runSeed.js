/**
 * MyIEC Smart ERP - Seed (single MongoDB, interconnected data)
 * At least 10 Students, 10 Faculty, Subjects, Attendance, Marks, Fees, Timetable, Notices
 * Faculty have assigned subjects; data flows to student dashboards
 */
const mongoose = require('mongoose');
const { User, Subject, Attendance, Fee, Result, Exam, Timetable, Notice, LibraryBook, LibraryIssue } = require('../models');

const SETTINGS_COLLECTION = 'settings';

async function ensureSettings(conn) {
  const col = conn.collection(SETTINGS_COLLECTION);
  if ((await col.countDocuments()) > 0) return;
  await col.insertMany([
    { _id: 'attendance', minAttendancePercent: 75, updatedAt: new Date() },
    { _id: 'fee', lateFeePercent: 5, updatedAt: new Date() },
  ]);
}

async function runSeed() {
  const conn = mongoose.connection;
  const userCount = await User.countDocuments();

  if (userCount > 0 && process.env.NODE_ENV === 'production') {
    console.log('MyIEC Smart ERP: Seed skipped (production, users exist).');
    return;
  }

  if (userCount > 0 && process.env.SEED_FORCE !== 'true') {
    console.log('MyIEC Smart ERP: Seed skipped (users exist). Set SEED_FORCE=true to reseed.');
    return;
  }

  if (userCount > 0) {
    await Promise.all([
      Attendance.deleteMany({}),
      Fee.deleteMany({}),
      Result.deleteMany({}),
      Exam.deleteMany({}),
      Timetable.deleteMany({}),
      Notice.deleteMany({}),
      LibraryIssue.deleteMany({}),
      LibraryBook.deleteMany({}),
      Subject.deleteMany({}),
      User.deleteMany({}),
    ]);
  }

  console.log('MyIEC Smart ERP: Seeding...');

  const admin = await User.create({
    email: 'admin@iec.ac.in',
    password: 'Admin@123',
    role: 'admin',
    name: 'IEC Admin',
    isActive: true,
  });

  const facultyList = [];
  for (let i = 1; i <= 10; i++) {
    const f = await User.create({
      email: `faculty${i}@iec.ac.in`,
      password: 'Faculty@123',
      role: 'faculty',
      name: `Prof. Faculty ${i}`,
      department: i <= 6 ? 'CSE' : 'ECE',
      designation: i % 2 ? 'Associate Professor' : 'Assistant Professor',
      employeeId: `EMP${String(i).padStart(3, '0')}`,
      isActive: true,
    });
    facultyList.push(f);
  }

  const studentList = [];
  const branches = ['CSE', 'CSE', 'CSE', 'ECE', 'ECE', 'CSE', 'CSE', 'ECE', 'CSE', 'ECE'];
  for (let i = 1; i <= 10; i++) {
    const s = await User.create({
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
    studentList.push(s);
  }

  const subjects = await Subject.insertMany([
    { code: 'CS301', name: 'Data Structures', credits: 4, branch: 'CSE', semester: 3 },
    { code: 'CS302', name: 'Database Systems', credits: 4, branch: 'CSE', semester: 3 },
    { code: 'CS303', name: 'Operating Systems', credits: 3, branch: 'CSE', semester: 3 },
    { code: 'CS304', name: 'Computer Networks', credits: 4, branch: 'CSE', semester: 3 },
    { code: 'EC301', name: 'Signals & Systems', credits: 4, branch: 'ECE', semester: 3 },
    { code: 'EC302', name: 'Digital Electronics', credits: 4, branch: 'ECE', semester: 3 },
  ]);

  const cseSubjects = subjects.filter((s) => s.branch === 'CSE').map((s) => s._id);
  const eceSubjects = subjects.filter((s) => s.branch === 'ECE').map((s) => s._id);
  for (let i = 0; i < facultyList.length; i++) {
    const subIds = i < 6 ? cseSubjects : eceSubjects;
    await User.findByIdAndUpdate(facultyList[i]._id, { subjects: subIds });
    facultyList[i].subjects = subIds;
  }

  const session = '2024-25 Odd';
  const today = new Date();
  const attRecords = [];
  for (let d = -45; d <= 5; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() + d);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    studentList.forEach((s) => {
      const subs = s.branch === 'CSE' ? cseSubjects : eceSubjects;
      const facultyIndex = s.branch === 'CSE' ? (d % 3) : 6 + (d % 2);
      subs.forEach((subId) => {
        attRecords.push({
          student: s._id,
          subject: subId,
          date,
          status: Math.random() > 0.2 ? 'present' : 'absent',
          markedBy: facultyList[facultyIndex]._id,
        });
      });
    });
  }
  await Attendance.insertMany(attRecords);

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
  feeRecords.push({
    student: studentList[1]._id,
    type: 'library',
    amount: 500,
    dueDate: new Date('2024-12-01'),
    status: 'overdue',
    paidAmount: 0,
  });
  await Fee.insertMany(feeRecords);

  const gradePoints = { A: 10, B: 8, C: 6, D: 4, F: 0 };
  const resultRecords = [];
  studentList.forEach((s) => {
    const subs = s.branch === 'CSE' ? cseSubjects : eceSubjects;
    subs.forEach((subId) => {
      const grade = ['A', 'B', 'B', 'C', 'C'][Math.floor(Math.random() * 5)];
      resultRecords.push({
        student: s._id,
        subject: subId,
        examType: 'internal',
        examSession: session,
        marksObtained: grade === 'A' ? 88 : grade === 'B' ? 75 : 62,
        maxMarks: 100,
        grade,
        gradePoint: gradePoints[grade],
      });
    });
  });
  await Result.insertMany(resultRecords);

  await Notice.insertMany([
    { title: 'Mid-Term Exam Schedule Released', body: 'Exams start December 15, 2025.', category: 'exam', targetRoles: ['student', 'faculty'], publishedAt: new Date() },
    { title: 'Fee Payment Deadline Extended', body: 'Semester fee deadline extended to December 31, 2025.', category: 'fee', targetRoles: ['student'], publishedAt: new Date() },
    { title: 'Winter Break Notice', body: 'College closed Dec 24 to Jan 5.', category: 'general', targetRoles: ['student', 'faculty'], publishedAt: new Date() },
    { title: 'Result Declaration', body: 'Internal results published. Check portal.', category: 'exam', targetRoles: ['student'], publishedAt: new Date() },
  ]);

  await Timetable.create({
    name: 'CSE Sem 3',
    session,
    branch: 'CSE',
    semester: 3,
    slots: [
      { day: 'Mon', startTime: '09:00', endTime: '10:00', subject: subjects[0]._id, faculty: facultyList[0]._id, room: 'R101' },
      { day: 'Mon', startTime: '10:00', endTime: '11:00', subject: subjects[1]._id, faculty: facultyList[1]._id, room: 'R102' },
      { day: 'Tue', startTime: '09:00', endTime: '10:00', subject: subjects[2]._id, faculty: facultyList[2]._id, room: 'R101' },
    ],
    isActive: true,
  });

  await Timetable.create({
    name: 'ECE Sem 3',
    session,
    branch: 'ECE',
    semester: 3,
    slots: [
      { day: 'Mon', startTime: '11:00', endTime: '12:00', subject: subjects[4]._id, faculty: facultyList[6]._id, room: 'R201' },
      { day: 'Wed', startTime: '09:00', endTime: '10:00', subject: subjects[5]._id, faculty: facultyList[7]._id, room: 'R201' },
    ],
    isActive: true,
  });

  const books = await LibraryBook.insertMany([
    { title: 'Introduction to Algorithms', author: 'Cormen', category: 'CSE', totalCopies: 5, availableCopies: 3 },
    { title: 'Database System Concepts', author: 'Silberschatz', category: 'CSE', totalCopies: 4, availableCopies: 4 },
  ]);
  await LibraryIssue.create({
    book: books[0]._id,
    student: studentList[0]._id,
    dueDate: new Date(Date.now() + 14 * 86400000),
    status: 'issued',
  });

  await ensureSettings(conn);
  console.log('MyIEC Smart ERP: Seed done. 1 Admin, 10 Faculty, 10 Students, subjects assigned. Login: admin@iec.ac.in / Admin@123');
}

module.exports = { runSeed };
