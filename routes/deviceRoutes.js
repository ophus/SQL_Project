const express = require('express');
const router = express.Router();
const { getAllDevices, getDeviceById, createDevice, updateDevice, deleteDevice } = require('../controllers/deviceController');
const authenticateToken = require('../middleware/auth');

// Lấy danh sách thiết bị (GET)
router.get('/', authenticateToken, getAllDevices);

// Lấy chi tiết một thiết bị
router.get('/:id', authenticateToken, getDeviceById);

// Thêm thiết bị
router.post('/', authenticateToken, createDevice);

// Sửa thiết bị
router.put('/:id', authenticateToken, updateDevice);

// Xóa thiết bị
router.delete('/:id', authenticateToken, deleteDevice);

module.exports = router;