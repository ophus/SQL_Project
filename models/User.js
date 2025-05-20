const { connectDB } = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
    static async getAll() {
        const pool = await connectDB();
        const [rows] = await pool.query('SELECT id, username, fullName, email, role, isActive, createdAt FROM Users');
        console.log('Users data:', rows); // Thêm log
        return rows;
    }

    static async getById(id) {
        const pool = await connectDB();
        const [rows] = await pool.query('SELECT id, username, fullName, email, role, isActive, createdAt FROM Users WHERE id = ?', [id]);
        return rows[0] || null;
    }

    static async create({ username, fullName, email, password, role }) {
        const pool = await connectDB();
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            `
                INSERT INTO Users (username, fullName, email, password, role, isActive, createdAt)
                VALUES (?, ?, ?, ?, ?, 1, NOW())
            `,
            [username, fullName, email, hashedPassword, role || 'user']
        );
        const [newUser] = await pool.query('SELECT id, username, fullName, email, role, isActive, createdAt FROM Users WHERE id = ?', [result.insertId]);
        return newUser[0];
    }

    static async update(id, { username, fullName, email, role, isActive }) {
        const pool = await connectDB();
        const [result] = await pool.query(
            `
                UPDATE Users
                SET username = ?, fullName = ?, email = ?, role = ?, isActive = ?, updatedAt = NOW()
                WHERE id = ?
            `,
            [username, fullName, email, role, isActive, id]
        );
        if (result.affectedRows > 0) {
            const [updatedUser] = await pool.query('SELECT id, username, fullName, email, role, isActive, createdAt FROM Users WHERE id = ?', [id]);
            return updatedUser[0] || null;
        }
        return null;
    }

    static async delete(id) {
        const pool = await connectDB();
        const [result] = await pool.query('DELETE FROM Users WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async toggleStatus(id) {
        const pool = await connectDB();
        const [result] = await pool.query(
            `
                UPDATE Users
                SET isActive = CASE WHEN isActive = 1 THEN 0 ELSE 1 END,
                    updatedAt = NOW()
                WHERE id = ?
            `,
            [id]
        );
        if (result.affectedRows > 0) {
            const [updatedUser] = await pool.query('SELECT * FROM Users WHERE id = ?', [id]);
            return updatedUser[0] || null;
        }
        return null;
    }

    static async findByUsername(username) {
        const pool = await connectDB();
        const [rows] = await pool.query('SELECT id, username, password, role, fullName, email FROM Users WHERE username = ?', [username]);
        return rows[0] || null;
    }

    static async comparePassword(password, hashedPassword) {
        return await bcrypt.compare(password, hashedPassword);
    }
}

module.exports = User;