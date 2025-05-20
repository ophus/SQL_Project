const { connectDB } = require('../config/db');

class Technician {
    static async getAll() {
        const pool = await connectDB();
        const [rows] = await pool.query('SELECT * FROM Technicians');
        return rows;
    }

    static async getById(id) {
        const pool = await connectDB();
        const [rows] = await pool.query('SELECT * FROM Technicians WHERE id = ?', [id]);
        return rows[0] || null;
    }

    static async create({ FullName, Specialization, PhoneNumber, Address, HireDate }) {
        const pool = await connectDB();
        const [result] = await pool.query(
            `
                INSERT INTO Technicians (FullName, Specialization, PhoneNumber, Address, HireDate, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())
            `,
            [FullName, Specialization, PhoneNumber, Address, HireDate]
        );
        const [newTechnician] = await pool.query('SELECT * FROM Technicians WHERE id = ?', [result.insertId]);
        return newTechnician[0];
    }

    static async update(id, { FullName, Specialization, PhoneNumber, Address, HireDate }) {
        const pool = await connectDB();
        const [result] = await pool.query(
            `
                UPDATE Technicians
                SET FullName = ?, Specialization = ?, PhoneNumber = ?, Address = ?, HireDate = ?, updatedAt = NOW()
                WHERE id = ?
            `,
            [FullName, Specialization, PhoneNumber, Address, HireDate, id]
        );
        if (result.affectedRows > 0) {
            const [updatedTechnician] = await pool.query('SELECT * FROM Technicians WHERE id = ?', [id]);
            return updatedTechnician[0] || null;
        }
        return null;
    }

    static async delete(id) {
        const pool = await connectDB();
        const [result] = await pool.query('DELETE FROM Technicians WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = Technician;