const { pool } = require('../config/db');
const { logActivity } = require('./activityLogController');

const getAllTechnicians = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM Technicians');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching technicians:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getTechnicianById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await pool.query('SELECT * FROM Technicians WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Technician not found' });
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching technician:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const createTechnician = async (req, res) => {
    const { FullName, Specialization, PhoneNumber, Address, HireDate } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO Technicians (FullName, Specialization, PhoneNumber, Address, HireDate) VALUES (?, ?, ?, ?, ?)',
            [FullName, Specialization, PhoneNumber, Address, HireDate]
        );
        if (req.user) await logActivity(req.user.id, 'CREATE', 'Technicians', result.insertId, `Created technician: ${FullName}`);
        res.status(201).json({ id: result.insertId, message: 'Technician created' });
    } catch (error) {
        console.error('Error creating technician:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateTechnician = async (req, res) => {
    const { id } = req.params;
    const { FullName, Specialization, PhoneNumber, Address, HireDate } = req.body;
    try {
        const [result] = await pool.query(
            'UPDATE Technicians SET FullName = ?, Specialization = ?, PhoneNumber = ?, Address = ?, HireDate = ?, UpdatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            [FullName, Specialization, PhoneNumber, Address, HireDate, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Technician not found' });
        if (req.user) await logActivity(req.user.id, 'UPDATE', 'Technicians', id, `Updated technician: ${FullName}`);
        res.json({ message: 'Technician updated' });
    } catch (error) {
        console.error('Error updating technician:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteTechnician = async (req, res) => {
    const { id } = req.params;
    try {
        // Set NULL cho các schedule liên quan
        await pool.query('UPDATE MaintenanceSchedules SET TechnicianID = NULL WHERE TechnicianID = ?', [id]);
        // Kiểm tra thiết bị còn gán technician không
        const [devices] = await pool.query('SELECT * FROM Devices WHERE assignedTechnician = ?', [id]);
        if (devices.length > 0) {
            return res.status(400).json({ message: 'Không thể xóa kỹ thuật viên vì vẫn còn thiết bị được gán cho họ.' });
        }
        // Xóa technician
        const [result] = await pool.query('DELETE FROM Technicians WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Technician not found' });
        if (req.user) await logActivity(req.user.id, 'DELETE', 'Technicians', id, `Deleted technician: ${id}`);
        res.json({ message: 'Technician deleted' });
    } catch (error) {
        console.error('Error deleting technician:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getAllTechnicians, getTechnicianById, createTechnician, updateTechnician, deleteTechnician };