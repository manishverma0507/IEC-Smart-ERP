/**
 * Fee controller - MyIEC ERP
 * CRUD, risk prediction (overdue count)
 */
const { Fee, User } = require('../models');

const list = async (req, res) => {
  try {
    const { studentId, status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (req.user.role === 'student') {
      filter.student = req.user.id;
    } else if (studentId) {
      filter.student = studentId;
    }
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [fees, total] = await Promise.all([
      Fee.find(filter).populate('student', 'name rollNo').sort({ dueDate: 1 }).skip(skip).limit(Number(limit)),
      Fee.countDocuments(filter),
    ]);
    res.json({ success: true, data: fees, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id).populate('student', 'name rollNo enrollmentNo');
    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });
    const studentId = fee.student._id ? fee.student._id.toString() : fee.student.toString();
    if (req.user.role === 'student' && studentId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied to this fee record' });
    }
    res.json({ success: true, data: fee });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const fee = await Fee.create(req.body);
    res.status(201).json({ success: true, data: fee });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const fee = await Fee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });
    res.json({ success: true, data: fee });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const riskPrediction = async (req, res) => {
  try {
    const overdue = await Fee.countDocuments({ status: { $in: ['pending', 'overdue'] }, dueDate: { $lt: new Date() } });
    const pending = await Fee.countDocuments({ status: 'pending', dueDate: { $gte: new Date() } });
    const studentsWithOverdue = await Fee.distinct('student', { status: { $in: ['pending', 'overdue'] }, dueDate: { $lt: new Date() } });
    res.json({
      success: true,
      data: {
        overdueCount: overdue,
        pendingCount: pending,
        studentsAtRisk: studentsWithOverdue.length,
        riskLevel: overdue > 50 ? 'high' : overdue > 10 ? 'medium' : 'low',
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { list, getOne, create, update, riskPrediction };
