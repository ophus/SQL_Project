const { connectDB } = require('../config/db');

exports.getAllSchedules = async (req, res) => {
    try {
        const pool = await connectDB();
        const [rows] = await pool.query(`
            SELECT ms.*, d.DeviceName, d.SerialNumber, t.FullName AS TechnicianName
            FROM MaintenanceSchedules ms
            LEFT JOIN Devices d ON ms.DeviceID = d.id
            LEFT JOIN Technicians t ON ms.TechnicianID = t.id
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getScheduleById = async (req, res) => {
    try {
        const pool = await connectDB();
        const [rows] = await pool.query(
            `
                SELECT ms.*, d.DeviceName, d.SerialNumber, t.FullName AS TechnicianName
                FROM MaintenanceSchedules ms
                LEFT JOIN Devices d ON ms.DeviceID = d.id
                LEFT JOIN Technicians t ON ms.TechnicianID = t.id
                WHERE ms.id = ?
            `,
            [req.params.id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Schedule not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createSchedule = async (req, res) => {
    try {
        const { DeviceID, TechnicianID, MaintenanceType, ScheduledDate, Status, Description, Notes } = req.body;
        const pool = await connectDB();
        const [result] = await pool.query(
            `
                INSERT INTO MaintenanceSchedules (DeviceID, TechnicianID, MaintenanceType, ScheduledDate, Status, Description, Notes, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `,
            [DeviceID, TechnicianID || null, MaintenanceType, ScheduledDate, Status || 'pending', Description, Notes]
        );
        const [newSchedule] = await pool.query('SELECT * FROM MaintenanceSchedules WHERE id = ?', [result.insertId]);
        res.status(201).json(newSchedule[0]);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateSchedule = async (req, res) => {
    try {
        const { DeviceID, TechnicianID, MaintenanceType, ScheduledDate, Status, Description, Notes } = req.body;
        const pool = await connectDB();
        const [result] = await pool.query(
            `
                UPDATE MaintenanceSchedules
                SET DeviceID = ?, TechnicianID = ?, MaintenanceType = ?, ScheduledDate = ?, Status = ?, Description = ?, Notes = ?, updatedAt = NOW()
                WHERE id = ?
            `,
            [DeviceID, TechnicianID || null, MaintenanceType, ScheduledDate, Status, Description, Notes, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Schedule not found' });
        }
        const [updatedSchedule] = await pool.query('SELECT * FROM MaintenanceSchedules WHERE id = ?', [req.params.id]);
        res.json(updatedSchedule[0]);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteSchedule = async (req, res) => {
    try {
        const pool = await connectDB();
        const [result] = await pool.query('DELETE FROM MaintenanceSchedules WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Schedule not found' });
        }
        res.json({ message: 'Schedule deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};