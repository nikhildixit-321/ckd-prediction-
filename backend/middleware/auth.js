const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Reusable middleware: checks JWT token before allowing API access
async function requireLogin(req, res, next) {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Please login first' });
    }
    try {
        const token = header.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) return res.status(401).json({ message: 'User not found' });
        next();
    } catch {
        res.status(401).json({ message: 'Session expired, please login again' });
    }
}

module.exports = requireLogin;
