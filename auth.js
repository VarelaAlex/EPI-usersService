const jwt = require('jsonwebtoken');
const fs = require('fs');

const ACCESS_TOKEN_SECRET = fs.readFileSync('/run/secrets/ACCESS_TOKEN_SECRET', 'utf8').trim();
const REFRESH_TOKEN_SECRET = fs.readFileSync('/run/secrets/REFRESH_TOKEN_SECRET', 'utf8').trim();

generateTokens = (user) => {
    let accessToken = jwt.sign({ id: user.id, role: user.role }, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    let refreshToken = jwt.sign({ id: user.id, role: user.role }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};

authenticateToken = (req, res, next) => {
    let authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Forbidden" });
        req.user = user;
        next();
    });
};

isTeacher = (req, res, next) => {
    if (req.user.role !== 'teacher') return res.status(403).json({ error: "Forbidden" });
    next();
};

isStudent = (req, res, next) => {
    if (req.user.role !== 'student') return res.status(403).json({ error: "Forbidden" });
    next();
};

module.exports = {
    generateTokens,
    authenticateToken,
    isTeacher,
    isStudent
};
