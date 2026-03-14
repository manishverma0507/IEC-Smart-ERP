/**
 * Exam & Result controller - MyIEC ERP
 * CGPA/SGPA analysis
 */
const { Result, Exam, Subject, User } = require('../models');
const mongoose = require('mongoose');

const listResults = async (req, res) => {
  try {
    const { studentId, examSession, subjectId, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (req.user.role === 'student') {
      filter.student = req.user._id;
    } else if (studentId) {
      filter.student = studentId;
    }
    if (examSession) filter.examSession = examSession;
    if (subjectId) filter.subject = subjectId;
    const skip = (Number(page) - 1) * Number(limit);
    const [results, total] = await Promise.all([
      Result.find(filter).populate('subject', 'code name credits').sort({ examSession: -1 }).skip(skip).limit(Number(limit)),
      Result.countDocuments(filter),
    ]);
    res.json({ success: true, data: results, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createResult = async (req, res) => {
  try {
    if (req.user.role === 'faculty') {
      const subjectId = (req.body.subject || '').toString();
      const facultySubjects = (req.user.subjects || []).map((s) => (s._id || s).toString());
      if (!facultySubjects.length || !facultySubjects.includes(subjectId)) {
        return res.status(403).json({ success: false, message: 'You can upload marks only for your assigned subjects' });
      }
    }
    const result = await Result.create(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const cgpaAnalysis = async (req, res) => {
  try {
    let { studentId, examSession } = req.query;
    if (req.user.role === 'student') studentId = req.user._id.toString();
    if (!studentId) return res.status(400).json({ success: false, message: 'studentId required for CGPA analysis' });
    const match = { student: new mongoose.Types.ObjectId(studentId) };
    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({ success: false, message: 'You can view only your own CGPA' });
    }
    if (examSession) match.examSession = examSession;
    const agg = await Result.aggregate([
      { $match: match },
      { $lookup: { from: 'subjects', localField: 'subject', foreignField: '_id', as: 'subj' } },
      { $unwind: '$subj' },
      {
        $group: {
          _id: '$examSession',
          totalCredits: { $sum: '$subj.credits' },
          weightedSum: { $sum: { $multiply: ['$gradePoint', '$subj.credits'] } },
          subjects: { $push: { code: '$subj.code', gradePoint: '$gradePoint', credits: '$subj.credits' } },
        },
      },
    ]);
    const analysis = agg.map((a) => ({
      session: a._id,
      sgpa: a.totalCredits ? (a.weightedSum / a.totalCredits).toFixed(2) : 0,
      totalCredits: a.totalCredits,
      subjects: a.subjects,
    }));
    const allPoints = agg.map((a) => (a.totalCredits ? a.weightedSum / a.totalCredits : 0));
    const cgpa = allPoints.length ? (allPoints.reduce((s, p) => s + p, 0) / allPoints.length).toFixed(2) : 0;
    res.json({ success: true, data: { bySession: analysis, cgpa: parseFloat(cgpa) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const listExams = async (req, res) => {
  try {
    const { subjectId, examSession, from, to } = req.query;
    const filter = {};
    if (subjectId) filter.subject = subjectId;
    if (examSession) filter.examSession = examSession;
    if (from || to) {
      filter.examDate = {};
      if (from) filter.examDate.$gte = new Date(from);
      if (to) filter.examDate.$lte = new Date(to);
    }
    const exams = await Exam.find(filter).populate('subject', 'code name').populate('invigilator', 'name').sort({ examDate: 1 });
    res.json({ success: true, data: exams });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createExam = async (req, res) => {
  try {
    const exam = await Exam.create(req.body);
    res.status(201).json({ success: true, data: exam });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = { listResults, createResult, cgpaAnalysis, listExams, createExam };
