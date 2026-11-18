// Express application initialization, global middleware registration, and API route routing
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorMiddleware = require('./middleware/error.middleware');

const app = express();

// Global middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'CampusIQ Backend API', timestamp: new Date() });
});

// Modular Domain Route Mounting
app.use('/api/v1/auth', require('./modules/auth/auth.routes'));
app.use('/api/v1/users', require('./modules/users/users.routes'));
app.use('/api/v1/students', require('./modules/students/students.routes'));
app.use('/api/v1/teachers', require('./modules/teachers/teachers.routes'));
app.use('/api/v1/departments', require('./modules/departments/departments.routes'));
app.use('/api/v1/courses', require('./modules/courses/courses.routes'));
app.use('/api/v1/enrollments', require('./modules/enrollments/enrollments.routes'));
app.use('/api/v1/attendance', require('./modules/attendance/attendance.routes'));
app.use('/api/v1/marks', require('./modules/marks/marks.routes'));
app.use('/api/v1/materials', require('./modules/materials/materials.routes'));
app.use('/api/v1/assignments', require('./modules/assignments/assignments.routes'));
app.use('/api/v1/notifications', require('./modules/notifications/notifications.routes'));
app.use('/api/v1/announcements', require('./modules/announcements/announcements.routes'));
app.use('/api/v1/admin', require('./modules/admin/admin.routes'));
app.use('/api/v1/analytics', require('./modules/analytics/analytics.routes'));
app.use('/api/v1/ai', require('./modules/ai/ai.routes'));

// Global error handling middleware (must be registered last)
app.use(errorMiddleware);

module.exports = app;
