const { pool } = require('../config/db');

exports.logActivity = async (userId, action, tableName, recordId, details) => {
    if (!userId) return; // Không ghi log nếu không có user
    try {
        await pool.query(
            'INSERT INTO ActivityLog (userId, action, tableName, recordId, details) VALUES (?, ?, ?, ?, ?)',
            [userId, action, tableName, recordId !== undefined ? recordId : null, details]
        );
    } catch (error) {
        console.error('Error logging activity:', error);
    }
};

exports.getActivityLogs = async (req, res) => {
    try {
        const [logs] = await pool.query(`
            SELECT al.id, u.username, al.action, al.tableName, al.recordId, al.details, al.timestamp
            FROM ActivityLog al
            LEFT JOIN Users u ON al.userId = u.id
            ORDER BY al.timestamp DESC
        `);
        res.json(logs);
    } catch (error) {
        console.error('Error fetching activity logs:', error);
        res.status(500).json({ message: 'Server error' });
    }
}; 