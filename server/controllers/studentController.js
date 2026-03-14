/**
 * Student controller - MyIEC ERP
 * Provides student-specific data endpoints
 */
const { User, Attendance, Fee, Result, Exam, Timetable, Notice, Subject } = require('../models');

/**
 * GET /student/me
 * Get current student's profile with extended information
 */
const getProfile = async (req, res) => {
  try {
    const student = await User.findById(req.user._id)
      .select('-password')
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Fetch additional student stats
    const attendanceCount = await Attendance.countDocuments({ student: student._id });
    const feeCount = await Fee.countDocuments({ student: student._id });
    const marksCount = await Result.countDocuments({ student: student._id });

    // Calculate attendance percentage
    const attendanceStats = await Attendance.aggregate([
      { $match: { student: student._id } },
      {
        $group: {
          _id: null,
          attended: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          total: { $sum: 1 },
        },
      },
    ]);

    const attendancePercentage =
      attendanceStats.length > 0
        ? Math.round((attendanceStats[0].attended / attendanceStats[0].total) * 100)
        : 0;

    return res.json({
      success: true,
      data: {
        ...student,
        attendancePercentage,
        totalAttendanceRecords: attendanceCount,
        totalFeesRecords: feeCount,
        totalMarksRecords: marksCount,
      },
    });
  } catch (err) {
    console.error('GET /student/me ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * GET /student/attendance
 * Get student's attendance records
 */
const getAttendance = async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const attendance = await Attendance.find({ student: req.user._id })
      .select('subject date status createdAt')
      .populate('subject', 'code name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Attendance.countDocuments({ student: req.user._id });

    // Calculate percentage by subject
    const subjectStats = await Attendance.aggregate([
      { $match: { student: req.user._id } },
      {
        $group: {
          _id: '$subject',
          attended: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          total: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const subjects = await Subject.find().select('_id code name').lean();
    const subjectMap = {};
    subjects.forEach((s) => {
      subjectMap[s._id.toString()] = s;
    });

    const subjectList = subjectStats.map((stat) => {
      const sub = subjectMap[stat._id?.toString()] || { code: 'N/A', name: 'Unknown' };
      return {
        name: sub.name,
        attended: stat.attended,
        total: stat.total,
        percentage: stat.total ? Math.round((stat.attended / stat.total) * 100) : 0,
      };
    });

    // Overall percentage
    const overallStats = await Attendance.aggregate([
      { $match: { student: req.user._id } },
      {
        $group: {
          _id: null,
          attended: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
          total: { $sum: 1 },
        },
      },
    ]);

    const percentage =
      overallStats.length > 0 && overallStats[0].total > 0
        ? Math.round((overallStats[0].attended / overallStats[0].total) * 100)
        : 0;

    return res.json({
      success: true,
      data: {
        records: attendance,
        subjects: subjectList,
        percentage,
        total,
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (err) {
    console.error('GET /student/attendance ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * GET /student/notices
 * Get notices visible to students
 */
const getNotices = async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const noticeFilter = {
      $or: [
        { targetRoles: { $exists: false } },
        { targetRoles: { $size: 0 } },
        { targetRoles: 'student' },
      ],
    };
    const notices = await Notice.find(noticeFilter)
      .select('title body summary category publishedAt createdBy')
      .populate('createdBy', 'name role')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Notice.countDocuments(noticeFilter);

    return res.json({
      success: true,
      data: notices,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    console.error('GET /student/notices ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * GET /student/marks
 * Get student's exam results and marks
 */
const getMarks = async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const marks = await Result.find({ student: req.user._id })
      .select('examType examSession marksObtained maxMarks grade subject createdAt')
      .populate('subject', 'code name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Result.countDocuments({ student: req.user._id });

    // Calculate CGPA from grade points and credits
    let cgpa = 0;
    if (marks.length > 0) {
      const withCredits = await Result.find({ student: req.user._id })
        .select('gradePoint')
        .populate('subject', 'credits')
        .lean();
      const totalCredits = withCredits.reduce((s, r) => s + (r.subject?.credits || 0), 0);
      const weighted = withCredits.reduce((s, r) => s + (r.gradePoint || 0) * (r.subject?.credits || 0), 0);
      cgpa = totalCredits ? weighted / totalCredits : 0;
    }

    // Shape for frontend: records with exam, course, marks, result (dashboard) and raw for marks page
    const records = marks.map((r) => ({
      id: r._id,
      exam: r.examType || r.examSession || 'Internal',
      course: r.subject?.name || r.subject?.code || '—',
      marks: `${r.marksObtained}/${r.maxMarks}`,
      result: (r.grade === 'F' || r.grade === 'E') ? 'Fail' : 'Pass',
      examSession: r.examSession,
      subject: r.subject,
      examType: r.examType,
      marksObtained: r.marksObtained,
      maxMarks: r.maxMarks,
      grade: r.grade,
    }));

    return res.json({
      success: true,
      data: {
        records,
        results: marks,
        cgpa: cgpa.toFixed(2),
        total,
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (err) {
    console.error('GET /student/marks ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * GET /student/fees
 * Get student's fee information and payment history
 */
const getFees = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const fees = await Fee.find({ student: req.user._id })
      .select('amount status dueDate paidDate semester')
      .sort({ dueDate: -1 })
      .limit(Number(limit))
      .lean();

    // Calculate total due, paid, overdue
    const feeStats = await Fee.aggregate([
      { $match: { student: req.user._id } },
      {
        $group: {
          _id: null,
          totalDue: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] },
          },
          totalPaid: {
            $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] },
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', 'pending'] },
                    { $lt: ['$dueDate', new Date()] },
                  ],
                },
                '$amount',
                0,
              ],
            },
          },
        },
      },
    ]);

    const stats =
      feeStats.length > 0
        ? feeStats[0]
        : { totalDue: 0, totalPaid: 0, overdue: 0 };

    // Get last payment
    const lastPayment = await Fee.findOne({
      student: req.user._id,
      status: 'paid',
    })
      .select('paidDate amount')
      .sort({ paidDate: -1 })
      .lean();

    const totalDue = stats.totalDue || 0;
    const lastPaid = lastPayment?.paidDate
      ? new Date(lastPayment.paidDate).toLocaleDateString('en-IN')
      : null;

    return res.json({
      success: true,
      data: {
        fees,
        summary: {
          totalDue: stats.totalDue || 0,
          totalPaid: stats.totalPaid || 0,
          overdue: stats.overdue || 0,
          lastPaymentDate: lastPayment?.paidDate || null,
          lastPaymentAmount: lastPayment?.amount || null,
        },
        due: totalDue ? `₹${totalDue.toLocaleString('en-IN')}` : '—',
        lastPaid: lastPaid || '—',
      },
    });
  } catch (err) {
    console.error('GET /student/fees ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * GET /student/courses
 * Get student's enrolled courses/subjects (shape: code, name, teacher)
 */
const getCourses = async (req, res) => {
  try {
    const student = await User.findById(req.user._id)
      .select('branch department semester')
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    const branch = student.branch || student.department;
    const courses = await Subject.find({
      $or: [{ branch }, { branch: { $exists: false } }],
      $and: [
        { $or: [{ semester: student.semester }, { semester: { $exists: false } }] },
      ],
    })
      .select('code name credits')
      .lean();

    const { Timetable } = require('../models');
    const ttFilter = {};
    if (branch) ttFilter.branch = branch;
    if (student.semester != null) ttFilter.semester = student.semester;
    const timetables = await Timetable.find(ttFilter)
      .select('slots')
      .populate('slots.subject', 'code name')
      .populate('slots.faculty', 'name')
      .lean();
    const facultyBySubject = {};
    timetables.forEach((tt) => {
      (tt.slots || []).forEach((s) => {
        if (s.subject) {
          const subId = (s.subject._id || s.subject).toString();
          if (!facultyBySubject[subId]) facultyBySubject[subId] = (s.faculty && s.faculty.name) ? s.faculty.name : '—';
        }
      });
    });

    const courseList = courses.map((c) => ({
      code: c.code,
      name: c.name,
      teacher: facultyBySubject[c._id.toString()] || '—',
    }));

    return res.json({
      success: true,
      data: courseList,
    });
  } catch (err) {
    console.error('GET /student/courses ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * GET /student/assignments
 * Get assignments for student's courses
 * NOTE: Requires Assignment model to be created
 */
const getAssignments = async (req, res) => {
  try {
    // This endpoint requires an Assignment model that may not exist yet
    // Returning sample data structure for now
    return res.json({
      success: true,
      data: [],
      message: 'Assignment module not yet implemented',
    });
  } catch (err) {
    console.error('GET /student/assignments ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * GET /student/timetable
 * Get timetable for student's courses
 */
const getTimetable = async (req, res) => {
  try {
    const student = await User.findById(req.user._id)
      .select('branch semester')
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Get timetables for student's branch and semester
    const timetables = await Timetable.find({
      branch: student.branch,
      semester: student.semester,
    })
      .populate('subject', 'code name')
      .populate('faculty', 'name')
      .lean();

    return res.json({
      success: true,
      data: timetables,
    });
  } catch (err) {
    console.error('GET /student/timetable ERROR:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

module.exports = {
  getProfile,
  getAttendance,
  getNotices,
  getMarks,
  getFees,
  getCourses,
  getAssignments,
  getTimetable,
};
