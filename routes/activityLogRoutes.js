const express = require('express');
const router = express.Router();
const { getActivityLogs } = require('../controllers/activityLogController');
const authenticateToken = require('../middleware/auth');

// Get activity logs (admin only)
router.get('/', authenticateToken, getActivityLogs);

module.exports = router; 