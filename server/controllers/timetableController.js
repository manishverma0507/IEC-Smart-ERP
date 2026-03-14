/**
 * Timetable controller - MyIEC ERP
 */
const { Timetable } = require('../models');

const list = async (req, res) => {
  try {
    const { session, branch, semester, isActive } = req.query;
    const filter = {};
    if (req.user.role === 'faculty' && req.user.id) {
      filter['slots.faculty'] = req.user.id;
    }
    if (req.user.role === 'student' && (req.user.branch || req.user.semester)) {
      if (req.user.branch) filter.branch = req.user.branch;
      if (req.user.semester != null) filter.semester = Number(req.user.semester);
    }
    if (session) filter.session = session;
    if (branch && req.user.role !== 'student') filter.branch = branch;
    if (semester != null && req.user.role !== 'student') filter.semester = Number(semester);
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const timetables = await Timetable.find(filter).sort({ session: -1 });
    res.json({ success: true, data: timetables });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const tt = await Timetable.findById(req.params.id)
      .populate('slots.subject', 'code name')
      .populate('slots.faculty', 'name employeeId');
    if (!tt) return res.status(404).json({ success: false, message: 'Timetable not found' });
    res.json({ success: true, data: tt });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const tt = await Timetable.create(req.body);
    res.status(201).json({ success: true, data: tt });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const tt = await Timetable.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!tt) return res.status(404).json({ success: false, message: 'Timetable not found' });
    res.json({ success: true, data: tt });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = { list, getOne, create, update };
