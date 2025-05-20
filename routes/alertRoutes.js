// routes/alertRoutes.js
const express = require('express');
const router = express.Router();
const { getAlerts, getAlertById, resolveAlert, createAlert, deleteAlert } = require('../controllers/alertController');
const authenticateToken = require('../middleware/auth');

console.log('Imported functions:', { getAlerts, getAlertById, resolveAlert, createAlert, deleteAlert }); // Debug

router.get('/', authenticateToken, getAlerts);
router.get('/:id', authenticateToken, getAlertById);
router.post('/', authenticateToken, createAlert);
router.put('/:id', authenticateToken, require('../controllers/alertController').updateAlert);
router.delete('/:id', authenticateToken, deleteAlert);

module.exports = router;