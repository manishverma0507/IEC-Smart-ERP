/**
 * Notice controller - MyIEC ERP
 * AI summary stored in summary field
 */
const { Notice } = require('../models');

const list = async (req, res) => {
  try {
    const { category, role, branch, semester, page = 1, limit = 20 } = req.query;
    const notExpired = { $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }] };
    const filter = { $and: [notExpired] };
    if (req.user.role === 'student') {
      filter.$and.push({ $or: [{ targetRoles: { $size: 0 } }, { targetRoles: { $exists: false } }, { targetRoles: 'student' }] });
      if (req.user.branch) filter.$and.push({ $or: [{ targetBranches: { $size: 0 } }, { targetBranches: { $exists: false } }, { targetBranches: req.user.branch }] });
      if (req.user.semester != null) filter.$and.push({ $or: [{ targetSemesters: { $size: 0 } }, { targetSemesters: { $exists: false } }, { targetSemesters: Number(req.user.semester) }] });
    } else if (req.user.role === 'faculty') {
      filter.$and.push({ $or: [{ targetRoles: { $size: 0 } }, { targetRoles: { $exists: false } }, { targetRoles: 'faculty' }] });
    }
    if (category) filter.category = category;
    if (role && req.user.role === 'admin') filter.targetRoles = role;
    if (branch && req.user.role === 'admin') filter.targetBranches = branch;
    if (semester != null && req.user.role === 'admin') filter.targetSemesters = Number(semester);
    const skip = (Number(page) - 1) * Number(limit);
    const [notices, total] = await Promise.all([
      Notice.find(filter).sort({ publishedAt: -1 }).skip(skip).limit(Number(limit)),
      Notice.countDocuments(filter),
    ]);
    res.json({ success: true, data: notices, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
    res.json({ success: true, data: notice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    req.body.createdBy = req.user._id;
    const notice = await Notice.create(req.body);
    res.status(201).json({ success: true, data: notice });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    const notice = await Notice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
    res.json({ success: true, data: notice });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = { list, getOne, create, update };
