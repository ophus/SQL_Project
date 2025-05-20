const { connectDB } = require('../config/db');

class Device {
    static async getAll() {
        try {
            const pool = await connectDB();
            const [rows] = await pool.query(`
                SELECT 
                    d.id AS DeviceID,
                    d.DeviceName,
                    d.SerialNumber,
                    d.Model,
                    d.Manufacturer,
                    d.PurchaseDate,
                    d.WarrantyExpiry,
                    d.Status,
                    d.Location,
                    d.LastMaintenanceDate,
                    d.NextMaintenanceDate,
                    d.Notes,
                    t.FullName AS TechnicianName
                FROM Devices d
                LEFT JOIN Technicians t ON d.assignedTechnician = t.id
            `);
            console.log('Devices from DB:', rows); // Thêm log để debug
            return rows;
        } catch (err) {
            console.error('Error fetching devices from DB:', err);
            throw err;
        }
    }

    static async getById(id) {
        const pool = await connectDB();
        const [rows] = await pool.query(
            `
                SELECT d.*, t.FullName AS TechnicianName
                FROM Devices d
                LEFT JOIN Technicians t ON d.assignedTechnician = t.id
                WHERE d.id = ?
            `,
            [id]
        );
        return rows[0] || null;
    }

    static async create({ DeviceName, SerialNumber, Model, Manufacturer, PurchaseDate, WarrantyExpiry, Status, Location, Notes, assignedTechnician }) {
        const pool = await connectDB();
        const [result] = await pool.query(
            `
                INSERT INTO Devices (DeviceName, SerialNumber, Model, Manufacturer, PurchaseDate, WarrantyExpiry, Status, Location, Notes, assignedTechnician, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `,
            [DeviceName, SerialNumber, Model, Manufacturer, PurchaseDate, WarrantyExpiry, Status || 'active', Location, Notes, assignedTechnician || null]
        );
        const [newDevice] = await pool.query('SELECT * FROM Devices WHERE id = ?', [result.insertId]);
        return newDevice[0];
    }

    static async update(id, { DeviceName, SerialNumber, Model, Manufacturer, PurchaseDate, WarrantyExpiry, Status, Location, Notes, assignedTechnician }) {
        const pool = await connectDB();
        const [result] = await pool.query(
            `
                UPDATE Devices
                SET DeviceName = ?, SerialNumber = ?, Model = ?, Manufacturer = ?, PurchaseDate = ?, WarrantyExpiry = ?, Status = ?, Location = ?, Notes = ?, assignedTechnician = ?, updatedAt = NOW()
                WHERE id = ?
            `,
            [DeviceName, SerialNumber, Model, Manufacturer, PurchaseDate, WarrantyExpiry, Status, Location, Notes, assignedTechnician || null, id]
        );
        if (result.affectedRows > 0) {
            const [updatedDevice] = await pool.query('SELECT * FROM Devices WHERE id = ?', [id]);
            return updatedDevice[0] || null;
        }
        return null;
    }

    static async delete(id) {
        const pool = await connectDB();
        const [result] = await pool.query('DELETE FROM Devices WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = Device;