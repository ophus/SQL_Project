const { pool } = require('../config/db');
const ExcelJS = require('exceljs');
const { Parser } = require('json2csv');
const { logActivity } = require('./activityLogController');

function sendExcel(res, rows, sheetName) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);
    if (rows.length > 0) {
        worksheet.columns = Object.keys(rows[0]).map(key => ({ header: key, key }));
        worksheet.addRows(rows);
    }
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${sheetName}.xlsx`);
    return workbook.xlsx.write(res).then(() => res.end());
}

function sendCSV(res, rows, fileName) {
    const parser = new Parser();
    const csv = parser.parse(rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}.csv`);
    res.send(csv);
}

exports.deviceReport = async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM Devices');
    if (req.user) await logActivity(req.user.id, 'EXPORT', 'Devices', 0, `Exported device report as ${req.query.format === 'csv' ? 'CSV' : 'Excel'}`);
    if (req.query.format === 'csv') return sendCSV(res, rows, 'devices');
    return sendExcel(res, rows, 'Devices');
};

exports.maintenanceReport = async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM MaintenanceSchedules');
    if (req.user) await logActivity(req.user.id, 'EXPORT', 'MaintenanceSchedules', 0, `Exported maintenance report as ${req.query.format === 'csv' ? 'CSV' : 'Excel'}`);
    if (req.query.format === 'csv') return sendCSV(res, rows, 'maintenance');
    return sendExcel(res, rows, 'Maintenance');
};

exports.alertReport = async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM Alerts');
    if (req.user) await logActivity(req.user.id, 'EXPORT', 'Alerts', 0, `Exported alert report as ${req.query.format === 'csv' ? 'CSV' : 'Excel'}`);
    if (req.query.format === 'csv') return sendCSV(res, rows, 'alerts');
    return sendExcel(res, rows, 'Alerts');
}; 