/**
 * User management controller - MyIEC ERP
 * CRUD with role-based visibility
 */
const { User } = require('../models');

const list = async (req, res) => {
  try {
    const { role, branch, semester, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (branch) filter.branch = branch;
    if (semester) filter.semester = Number(semester);
    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, data: users, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getOne = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const create = async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email or unique field already exists' });
    }
    res.status(400).json({ success: false, message: err.message });
  }
};

const update = async (req, res) => {
  try {
    if (req.body.password) delete req.body.password;
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const assignSubjects = async (req, res) => {
  try {
    const { subjectIds } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role !== 'faculty') {
      return res.status(400).json({ success: false, message: 'Subject assignment is only for faculty users' });
    }
    const ids = Array.isArray(subjectIds) ? subjectIds : [];
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { subjects: ids },
      { new: true, runValidators: true }
    ).select('-password');
    res.json({ success: true, data: updated, message: 'Subjects assigned' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/**
 * Get current user's profile (accessible by any authenticated user)
 */
const getMe = async (req, res) => {
  try {
    // req.user is set by the protect middleware
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Fetch role-specific profile data
    let profileData = null;

    if (user.role === 'student') {
      // Import Student model from backend/models
      const Student = require('../../backend/models/Student');
      profileData = await Student.findOne({ userId: user._id });
    } else if (user.role === 'faculty') {
      // Import Faculty model from backend/models
      const Faculty = require('../../backend/models/Faculty');
      profileData = await Faculty.findOne({ userId: user._id });
    }

    // Combine user and profile data
    const responseData = {
      ...user.toObject(),
      profile: profileData,
      // Add commonly used fields at top level for easier access
      rollNo: profileData?.rollNo,
      roll: profileData?.rollNo,
      semester: profileData?.semester,
      year: profileData?.year,
      branch: profileData?.branch,
      facultyId: profileData?.facultyId,
      department: profileData?.department,
      designation: profileData?.designation
    };

    res.json({ success: true, data: responseData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { list, getOne, create, update, remove, assignSubjects, getMe };
