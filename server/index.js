/**

MyIEC ERP - IEC College of Engineering & Technology

Entry point - Express server with security & routes
*/

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const config = require('./config/env');
const { connectDB } = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const userManagementRoutes = require('./routes/userManagementRoutes');
const studentRoutes = require('./routes/studentRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const feeRoutes = require('./routes/feeRoutes');
const examRoutes = require('./routes/examRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const noticeRoutes = require('./routes/noticeRoutes');
const libraryRoutes = require('./routes/libraryRoutes');
const aiAssistantRoutes = require('./routes/aiAssistantRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();

/* ===============================
DATABASE
=============================== */
connectDB();

/* ===============================
SECURITY & MIDDLEWARE
=============================== */
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: config.CORS_ORIGIN || '', credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(morgan(config.NODE_ENV === 'development' ? 'dev' : 'combined'));

/* ===============================
RATE LIMIT
=============================== */
const limiter = rateLimit({
windowMs: config.RATE_LIMIT_WINDOW_MS,
max: config.RATE_LIMIT_MAX,
message: { success: false, message: 'Too many requests' },
});

app.use('/api', limiter);

/* ===============================
STATIC FRONTEND
=============================== */
app.use(express.static(path.join(__dirname, '../public')));

/* ===============================
API ROUTES
=============================== */
app.use('/api/auth', authRoutes);
app.use('/api/users', userManagementRoutes);
app.use('/api/user', userRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/ai', aiAssistantRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);

/* ===============================
HEALTH CHECK
=============================== */
app.get('/api/health', (req, res) => {
res.json({
success: true,
service: 'MyIEC ERP',
env: config.NODE_ENV
});
});

/* ===============================
ROOT ROUTE
=============================== */
app.get('/', (req, res) => {
res.sendFile(path.join(__dirname, '../public/index.html'));
});

/* ===============================
404 HANDLER
=============================== */
app.use((req, res) => {
res.status(404).json({
success: false,
message: 'Not found'
});
});

/* ===============================
ERROR HANDLER
=============================== */
app.use((err, req, res, next) => {
console.error(err);

res.status(err.status || 500).json({
success: false,
message: err.message || 'Server error'
});
});

/* ===============================
SERVER START
=============================== */
app.listen(config.PORT, () => {
console.log(`MyIEC ERP running on port ${config.PORT} (${config.NODE_ENV})`);
});

module.exports = app;