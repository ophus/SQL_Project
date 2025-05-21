const { pool } = require('../config/db');
const { logActivity } = require('./activityLogController');

exports.getAllDevices = async (req, res) => {
    try {
        const [devices] = await pool.query(`
            SELECT 
                d.*,
                t.fullName AS technicianName,
                COALESCE(d.Status, 'unknown') as Status,
                COALESCE(d.Location, 'unspecified') as Location
            FROM Devices d
            LEFT JOIN Technicians t ON d.assignedTechnician = t.id
            ORDER BY d.id DESC
        `);
        res.json(devices);
    } catch (error) {
        console.error('Error fetching devices:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getDeviceById = async (req, res) => {
    try {
        const [devices] = await pool.query(`
            SELECT 
                d.*,
                t.fullName AS technicianName,
                COALESCE(d.Status, 'unknown') as Status,
                COALESCE(d.Location, 'unspecified') as Location
            FROM Devices d
            LEFT JOIN Technicians t ON d.assignedTechnician = t.id
            WHERE d.id = ?
        `, [req.params.id]);

        if (devices.length === 0) {
            return res.status(404).json({ message: 'Device not found' });
        }

        res.json(devices[0]);
    } catch (error) {
        console.error('Error fetching device:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.createDevice = async (req, res) => {
    try {
        const { DeviceName, SerialNumber, Model, Manufacturer, Status, Location, Notes, assignedTechnician } = req.body;

        // Validate required fields
        if (!DeviceName || !SerialNumber || !Model) {
            return res.status(400).json({
                message: 'Missing required fields',
                required: ['DeviceName', 'SerialNumber', 'Model']
            });
        }

        const [result] = await pool.query(
            'INSERT INTO Devices (DeviceName, SerialNumber, Model, Manufacturer, Status, Location, Notes, assignedTechnician) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [DeviceName, SerialNumber, Model, Manufacturer, Status || 'active', Location, Notes, assignedTechnician]
        );

        // Log activity
        await logActivity(
            req.user.id,
            'CREATE',
            'Devices',
            result.insertId,
            `Created device: ${DeviceName}`
        );

        // Fetch the created device
        const [newDevice] = await pool.query('SELECT * FROM Devices WHERE id = ?', [result.insertId]);

        res.status(201).json({
            message: 'Device created successfully',
            device: newDevice[0]
        });
    } catch (error) {
        console.error('Error creating device:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateDevice = async (req, res) => {
    try {
        const deviceId = req.params.id;
        const { DeviceName, SerialNumber, Model, Manufacturer, Status, Location, Notes, assignedTechnician } = req.body;

        // Check if device exists
        const [existingDevice] = await pool.query('SELECT * FROM Devices WHERE id = ?', [deviceId]);
        if (existingDevice.length === 0) {
            return res.status(404).json({ message: 'Device not found' });
        }

        const [result] = await pool.query(
            'UPDATE Devices SET DeviceName=?, SerialNumber=?, Model=?, Manufacturer=?, Status=?, Location=?, Notes=?, assignedTechnician=?, updatedAt=NOW() WHERE id=?',
            [
                DeviceName || existingDevice[0].DeviceName,
                SerialNumber || existingDevice[0].SerialNumber,
                Model || existingDevice[0].Model,
                Manufacturer || existingDevice[0].Manufacturer,
                Status || existingDevice[0].Status,
                Location || existingDevice[0].Location,
                Notes || existingDevice[0].Notes,
                assignedTechnician || existingDevice[0].assignedTechnician,
                deviceId
            ]
        );

        // Log activity
        await logActivity(
            req.user.id,
            'UPDATE',
            'Devices',
            deviceId,
            `Updated device: ${DeviceName || existingDevice[0].DeviceName}`
        );

        // Fetch updated device
        const [updatedDevice] = await pool.query('SELECT * FROM Devices WHERE id = ?', [deviceId]);

        res.json({
            message: 'Device updated successfully',
            device: updatedDevice[0]
        });
    } catch (error) {
        console.error('Error updating device:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.deleteDevice = async (req, res) => {
    try {
        const deviceId = req.params.id;

        // Kiểm tra device có tồn tại không
        const [device] = await pool.query('SELECT * FROM Devices WHERE id = ?', [deviceId]);
        if (device.length === 0) {
            return res.status(404).json({ message: 'Device not found' });
        }

        // Xóa các bản ghi liên quan trong Alerts và MaintenanceSchedules
        await pool.query('DELETE FROM Alerts WHERE DeviceID = ?', [deviceId]);
        await pool.query('DELETE FROM MaintenanceSchedules WHERE DeviceID = ?', [deviceId]);

        // Xóa device
        const [result] = await pool.query('DELETE FROM Devices WHERE id = ?', [deviceId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Failed to delete device' });
        }

        // Log activity
        await logActivity(
            req.user.id,
            'DELETE',
            'Devices',
            deviceId,
            `Deleted device: ${device[0].DeviceName}`
        );

        res.json({
            message: 'Device deleted successfully',
            deletedDevice: device[0]
        });
    } catch (error) {
        console.error('Error deleting device:', error);
        res.status(500).json({
            message: 'Server error',
            error: error.message
        });
    }
};