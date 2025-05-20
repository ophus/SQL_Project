const express = require('express');
const router = express.Router();
const { getAllUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const authenticateToken = require('../middleware/auth');
// const checkAdmin = require('../middleware/checkAdmin');

// Get all users
router.get('/', authenticateToken, getAllUsers);

// Create new user
router.post('/', authenticateToken, createUser);

// Update user
router.put('/:id', authenticateToken, updateUser);

// Delete user
router.delete('/:id', authenticateToken, deleteUser);

module.exports = router;