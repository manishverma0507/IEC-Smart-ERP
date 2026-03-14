/**
 * Analytics dashboard - MyIEC ERP
 * Role-based aggregates
 */
const { User, Attendance, Fee, Result, Notice } = require('../models');
const mongoose = require('mongoose');

async function dashboard(req, res) {
  try {
    const role = req.user.role;
    const userId = req.user.id;
    const out = { role };

    if (role === 'student') {
      const [attAgg, feePending, resultCount, noticeCount] = await Promise.all([
        Attendance.aggregate([
          { $match: { student: new mongoose.Types.ObjectId(userId) } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        Fee.countDocuments({ student: userId, status: { $in: ['pending', 'overdue'] } }),
        Result.distinct('examSession', { student: userId }),
        Notice.countDocuments({ $or: [{ targetRoles: role }, { targetRoles: [] }], publishedAt: { $lte: new Date() } }),
      ]);
      const totalAtt = attAgg.reduce((s, x) => s + x.count, 0);
      const present = attAgg.find((x) => x._id === 'present')?.count || 0;
      out.attendancePercent = totalAtt ? ((present / totalAtt) * 100).toFixed(1) : 0;
      out.pendingFeesCount = feePending;
      out.examSessionsCount = resultCount.length;
      out.noticesCount = noticeCount;
    }

    if (role === 'faculty') {
      const [subjectsCount, defaultersHint, noticesCount] = await Promise.all([
        User.findById(userId).select('subjects').then((u) => u?.subjects?.length || 0),
        Attendance.distinct('student').then((students) => students.length),
        Notice.countDocuments({ $or: [{ targetRoles: role }, { targetRoles: [] }] }),
      ]);
      out.subjectsCount = subjectsCount;
      out.studentsMarkedCount = defaultersHint;
      out.noticesCount = noticesCount;
    }

    if (role === 'admin') {
      const [usersCount, studentsCount, facultyCount, feeOverdue, attDefaultersApprox, noticesCount] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'student' }),
        User.countDocuments({ role: 'faculty' }),
        Fee.countDocuments({ status: { $in: ['pending', 'overdue'] }, dueDate: { $lt: new Date() } }),
        Attendance.aggregate([
          { $match: { status: 'present' } },
          { $group: { _id: '$student', present: { $sum: 1 } } },
        ]).then((presentCount) =>
          Attendance.aggregate([{ $group: { _id: '$student', total: { $sum: 1 } } }]).then((totalCount) => {
            const totalMap = Object.fromEntries(totalCount.map((t) => [t._id.toString(), t.total]));
            return presentCount.filter((p) => {
              const total = totalMap[p._id.toString()] || 0;
              return total > 0 && (p.present / total) * 100 < 75;
            }).length;
          })
        ),
        Notice.countDocuments(),
      ]);
      out.usersCount = usersCount;
      out.studentsCount = studentsCount;
      out.facultyCount = facultyCount;
      out.feeOverdueCount = feeOverdue;
      out.attendanceDefaultersCount = attDefaultersApprox;
      out.noticesCount = noticesCount;
    }

    res.json({ success: true, data: out });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { dashboard };
