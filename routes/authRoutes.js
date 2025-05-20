const express = require('express');
const router = express.Router();
const { login, logout, verifyToken } = require('../controllers/authController');

router.post('/login', login);
router.post('/logout', logout);
router.get('/verify-token', verifyToken);

module.exports = router;