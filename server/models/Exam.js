/**
 * Exam & Result model - MyIEC ERP
 * CGPA/SGPA analysis support
 */
const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    examType: { type: String, enum: ['mid', 'end', 'internal', 'practical'], required: true },
    examSession: { type: String }, // e.g. "2024-25 Odd"
    marksObtained: { type: Number, required: true },
    maxMarks: { type: Number, required: true },
    grade: { type: String },
    gradePoint: { type: Number },
  },
  { timestamps: true }
);

resultSchema.index({ student: 1, examSession: 1, subject: 1 }, { unique: true });

const examSchema = new mongoose.Schema(
  {
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    examType: { type: String, enum: ['mid', 'end', 'internal', 'practical'], required: true },
    examDate: { type: Date, required: true },
    examSession: { type: String },
    maxMarks: { type: Number, required: true },
    room: { type: String },
    invigilator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = {
  Result: mongoose.model('Result', resultSchema),
  Exam: mongoose.model('Exam', examSchema),
};
