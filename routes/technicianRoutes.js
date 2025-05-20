const express = require('express');
const router = express.Router();
const { getAllTechnicians, getTechnicianById, createTechnician, updateTechnician, deleteTechnician } = require('../controllers/technicianController');
const authenticateToken = require('../middleware/auth');

router.get('/', authenticateToken, getAllTechnicians);
router.get('/:id', authenticateToken, getTechnicianById);
router.post('/', authenticateToken, createTechnician);
router.put('/:id', authenticateToken, updateTechnician);
router.delete('/:id', authenticateToken, deleteTechnician);

module.exports = router;