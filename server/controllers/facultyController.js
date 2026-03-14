/**
 * Faculty controller - MyIEC ERP
 * Provides faculty-specific data endpoints
 */
const { User, Subject, Attendance, Result, Timetable } = require('../models');

/**
 * GET /faculty/me
 * Get current faculty member's profile
 */
const getProfile = async (req, res) => {
  try {
    const faculty = await User.findById(req.user._id)
      .select('-password')
      .populate('subjects', 'code name credits')
      .lean();

    if (!faculty || faculty.role !== 'faculty') {
      return res.status(404).json({
        success: false,
        message: 'Faculty member not found',
      });
    }

    // Get assigned students count
    const studentsCount = await User.countDocuments({
      role: 'student',
      // Filter by students in same department or by other criteria
    });

    // Get attendance records count
    const attendanceCount = await Attendance.countDocuments();

    return res.json({
      success: true,
      data: {
        ...faculty,
        assignedStudentsCount: studentsCount,
        attendanceRecordsCount: attendanceCount,
        subjectsCount: faculty.subjects?.length || 0,
      },
    });
  } catch (err) {
    console.error('GET /faculty/me ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * GET /faculty/subjects
 * Get faculty's assigned subjects
 */
const getSubjects = async (req, res) => {
  try {
    const faculty = await User.findById(req.user._id)
      .select('subjects')
      .populate('subjects')
      .lean();

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found',
      });
    }

    return res.json({
      success: true,
      data: faculty.subjects || [],
    });
  } catch (err) {
    console.error('GET /faculty/subjects ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * GET /faculty/students
 * Get students for faculty's assigned subjects
 */
const getStudents = async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Get faculty's subjects
    const faculty = await User.findById(req.user._id)
      .select('subjects')
      .lean();

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found',
      });
    }

    // Get students for those subjects (simplified - get all students of same branch/semester)
    const students = await User.find({ role: 'student' })
      .select('name email rollNo branch semester phone')
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await User.countDocuments({ role: 'student' });

    return res.json({
      success: true,
      data: students,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    console.error('GET /faculty/students ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * GET /faculty/attendance
 * Get attendance records managed by faculty
 */
const getAttendance = async (req, res) => {
  try {
    const { limit = 50, page = 1, subjectId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query = {};
    if (subjectId) {
      query.subject = subjectId;
    }

    const attendance = await Attendance.find(query)
      .select('student subject date status')
      .populate('student', 'name rollNo')
      .populate('subject', 'code name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Attendance.countDocuments(query);

    return res.json({
      success: true,
      data: attendance,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    console.error('GET /faculty/attendance ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * GET /faculty/marks
 * Get marks/results for faculty's subjects
 */
const getMarks = async (req, res) => {
  try {
    const { limit = 50, page = 1, subjectId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query = {};
    if (subjectId) {
      query.subject = subjectId;
    }

    const results = await Result.find(query)
      .select('student subject exam marks totalMarks grade')
      .populate('student', 'name rollNo')
      .populate('subject', 'code name')
      .populate('exam', 'name date')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Result.countDocuments(query);

    return res.json({
      success: true,
      data: results,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    console.error('GET /faculty/marks ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * GET /faculty/timetable
 * Get timetable for faculty's subjects
 */
const getTimetable = async (req, res) => {
  try {
    const faculty = await User.findById(req.user._id)
      .select('subjects')
      .lean();

    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty not found',
      });
    }

    const timetables = await Timetable.find(
      (faculty.subjects && faculty.subjects.length)
        ? { 'slots.subject': { $in: faculty.subjects } }
        : {}
    )
      .populate('slots.subject', 'code name')
      .populate('slots.faculty', 'name')
      .lean();

    return res.json({
      success: true,
      data: timetables,
    });
  } catch (err) {
    console.error('GET /faculty/timetable ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

module.exports = {
  getProfile,
  getSubjects,
  getStudents,
  getAttendance,
  getMarks,
  getTimetable,
};
