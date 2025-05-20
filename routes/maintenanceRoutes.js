// routes/maintenanceRoutes.js
const express = require('express');
const router = express.Router();
const { getAllSchedules, getScheduleById, createSchedule, updateSchedule, deleteSchedule } = require('../controllers/maintenanceController');
const authenticateToken = require('../middleware/auth');

console.log('Imported functions:', { getAllSchedules, getScheduleById, createSchedule, updateSchedule, deleteSchedule }); // Debug

router.get('/', authenticateToken, getAllSchedules);
router.get('/:id', authenticateToken, getScheduleById);
router.post('/', authenticateToken, createSchedule);
router.put('/:id', authenticateToken, updateSchedule);
router.delete('/:id', authenticateToken, deleteSchedule);

module.exports = router;