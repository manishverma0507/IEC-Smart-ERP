/**
 * Models barrel - MyIEC ERP
 */
const User = require('./User');
const Subject = require('./Subject');
const Attendance = require('./Attendance');
const Fee = require('./Fee');
const { Result, Exam } = require('./Exam');
const Timetable = require('./Timetable');
const Notice = require('./Notice');
const { LibraryBook, LibraryIssue } = require('./Library');
const AuditLog = require('./AuditLog');

module.exports = {
  User,
  Subject,
  Attendance,
  Fee,
  Result,
  Exam,
  Timetable,
  Notice,
  LibraryBook,
  LibraryIssue,
  AuditLog,
};
