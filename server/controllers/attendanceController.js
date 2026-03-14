/**
 * Attendance controller - MyIEC ERP
 * Mark, list, defaulter stats
 */
const { Attendance, User, Subject } = require('../models');
const mongoose = require('mongoose');

const mark = async (req, res) => {
  try {
    const { studentId, subjectId, date, status } = req.body;
    if (req.user.role === 'faculty' && req.user.subjects?.length) {
      const sid = (subjectId || '').toString();
      if (!req.user.subjects.some((s) => (s._id || s).toString() === sid)) {
        return res.status(403).json({ success: false, message: 'You can mark attendance only for your assigned subjects' });
      }
    }
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    const record = await Attendance.findOneAndUpdate(
      { student: studentId, subject: subjectId, date: dateOnly },
      { status: status || 'present', markedBy: req.user._id },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const bulkMark = async (req, res) => {
  try {
    const { subjectId, date, entries } = req.body;
    if (req.user.role === 'faculty' && req.user.subjects?.length) {
      const sid = (subjectId || '').toString();
      if (!req.user.subjects.some((s) => (s._id || s).toString() === sid)) {
        return res.status(403).json({ success: false, message: 'You can mark attendance only for your assigned subjects' });
      }
    }
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    const ops = entries.map((e) => ({
      updateOne: {
        filter: { student: e.studentId, subject: subjectId, date: dateOnly },
        update: { status: e.status || 'present', markedBy: req.user._id },
        upsert: true,
      },
    }));
    await Attendance.bulkWrite(ops);
    res.json({ success: true, message: 'Bulk attendance updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const list = async (req, res) => {
  try {
    const { studentId, subjectId, from, to, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (req.user.role === 'student') filter.student = req.user._id;
    else if (studentId) filter.student = studentId;
    if (subjectId) filter.subject = subjectId;
    if (req.user.role === 'faculty' && req.user.subjects?.length) {
      filter.subject = { $in: req.user.subjects };
    }
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [records, total] = await Promise.all([
      Attendance.find(filter).populate('subject', 'code name').sort({ date: -1 }).skip(skip).limit(Number(limit)),
      Attendance.countDocuments(filter),
    ]);
    res.json({ success: true, data: records, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const stats = async (req, res) => {
  try {
    let { studentId, subjectId, from, to } = req.query;
    if (req.user.role === 'student') studentId = req.user._id.toString();
    const match = {};
    if (studentId) match.student = new mongoose.Types.ObjectId(studentId);
    if (subjectId) match.subject = new mongoose.Types.ObjectId(subjectId);
    if (req.user.role === 'faculty' && req.user.subjects?.length) match.subject = { $in: req.user.subjects };
    if (from || to) {
      match.date = {};
      if (from) match.date.$gte = new Date(from);
      if (to) match.date.$lte = new Date(to);
    }
    const agg = await Attendance.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const total = agg.reduce((s, x) => s + x.count, 0);
    const present = agg.find((x) => x._id === 'present')?.count || 0;
    const percentage = total ? ((present / total) * 100).toFixed(2) : 0;
    res.json({
      success: true,
      data: { byStatus: agg, total, present, percentage: parseFloat(percentage) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const defaulters = async (req, res) => {
  try {
    let { subjectId, threshold = 75, from, to } = req.query;
    if (req.user.role === 'faculty' && req.user.subjects?.length) {
      if (subjectId && !req.user.subjects.some((s) => (s._id || s).toString() === subjectId)) {
        return res.status(403).json({ success: false, message: 'Access denied for this subject' });
      }
      if (!subjectId && req.user.subjects.length) subjectId = req.user.subjects[0]._id?.toString() || req.user.subjects[0];
    }
    const match = { status: 'present' };
    const dateMatch = {};
    if (from) dateMatch.$gte = new Date(from);
    if (to) dateMatch.$lte = new Date(to);
    if (Object.keys(dateMatch).length) match.date = dateMatch;
    if (subjectId) match.subject = new mongoose.Types.ObjectId(subjectId);

    const presentCount = await Attendance.aggregate([
      { $match: match },
      { $group: { _id: '$student', present: { $sum: 1 } } },
    ]);
    const totalCount = await Attendance.aggregate([
      { $match: subjectId ? { ...match, subject: new mongoose.Types.ObjectId(subjectId) } : { date: dateMatch } },
      { $group: { _id: '$student', total: { $sum: 1 } } },
    ]);
    const totalMap = Object.fromEntries(totalCount.map((t) => [t._id.toString(), t.total]));
    const defaulterIds = presentCount
      .filter((p) => {
        const total = totalMap[p._id.toString()] || 0;
        const pct = total ? (p.present / total) * 100 : 0;
        return pct < Number(threshold);
      })
      .map((p) => p._id);
    const users = await User.find({ _id: { $in: defaulterIds } }).select('name rollNo enrollmentNo branch semester');
    res.json({ success: true, data: users, threshold: Number(threshold) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { mark, bulkMark, list, stats, defaulters };
