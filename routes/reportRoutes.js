const express = require('express');
const router = express.Router();
const { deviceReport, maintenanceReport, alertReport } = require('../controllers/reportController');
const authenticateToken = require('../middleware/auth');

router.get('/devices', authenticateToken, deviceReport);
router.get('/maintenance', authenticateToken, maintenanceReport);
router.get('/alerts', authenticateToken, alertReport);

module.exports = router; 