const { connectDB } = require('../config/db');

class Alert {
    static async getAll(showResolved = false) {
        const pool = await connectDB();
        const query = showResolved ? 'SELECT * FROM Alerts' : 'SELECT * FROM Alerts WHERE IsResolved = 0';
        const [rows] = await pool.query(query);
        console.log('Alerts data:', rows); // Thêm log
        return rows;
    }

    static async getById(id) {
        const pool = await connectDB();
        const [rows] = await pool.query(
            'SELECT a.*, d.DeviceName, d.SerialNumber FROM Alerts a LEFT JOIN Devices d ON a.DeviceID = d.id WHERE a.id = ?',
            [id]
        );
        return rows[0] || null;
    }

    static async resolve(id, notes = '') {
        const pool = await connectDB();
        const [result] = await pool.query(
            `
                UPDATE Alerts
                SET IsResolved = 1, ResolutionNotes = ?, UpdatedAt = NOW()
                WHERE id = ?
            `,
            [notes, id]
        );
        if (result.affectedRows > 0) {
            const [updatedRow] = await pool.query('SELECT * FROM Alerts WHERE id = ?', [id]);
            return updatedRow[0] || null;
        }
        return null;
    }

    static async create({ DeviceID, Message, Severity }) {
        const pool = await connectDB();
        const [result] = await pool.query(
            `
                INSERT INTO Alerts (DeviceID, Message, Severity, AlertDate, IsResolved, CreatedAt)
                VALUES (?, ?, ?, NOW(), 0, NOW())
            `,
            [DeviceID, Message, Severity]
        );
        const [newAlert] = await pool.query('SELECT * FROM Alerts WHERE id = ?', [result.insertId]);
        return newAlert[0];
    }
}

module.exports = Alert;