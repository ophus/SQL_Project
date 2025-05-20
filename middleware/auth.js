// middleware/Auth.js
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // Kiểm tra token từ header Authorization
    let token = req.headers.authorization?.replace('Bearer ', '');

    // Nếu không có trong header, kiểm tra cookie
    if (!token) {
        token = req.cookies.authToken;
    }

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Lưu thông tin decoded (bao gồm id, role, v.v.)
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};