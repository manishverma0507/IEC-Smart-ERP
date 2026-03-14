/**
 * MyIEC Smart ERP - Data isolation by role
 * Student: ONLY own data. Faculty: ONLY assigned subjects & students in those. Admin: all.
 */
function scopeAttendance(req, res, next) {
  if (req.user.role === 'student') {
    req.query.studentId = req.user.id;
  }
  if (req.user.role === 'faculty' && req.user.subjects?.length) {
    req._facultySubjectIds = req.user.subjects.map((s) => s.toString?.() || s);
  }
  next();
}

function scopeFees(req, res, next) {
  if (req.user.role === 'student') {
    req.query.studentId = req.user.id;
  }
  next();
}

function scopeResults(req, res, next) {
  if (req.user.role === 'student') {
    req.query.studentId = req.user.id;
  }
  next();
}

function scopeCgpa(req, res, next) {
  if (req.user.role === 'student') {
    req.query.studentId = req.user.id;
  }
  next();
}

module.exports = {
  scopeAttendance,
  scopeFees,
  scopeResults,
  scopeCgpa,
};
