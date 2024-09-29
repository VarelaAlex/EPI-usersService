const jwt = require('jsonwebtoken');

generateTokens = (user) => {
    let accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    let refreshToken = jwt.sign({ id: user.id, role: user.role }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};

authenticateToken = (req, res, next) => {
    let authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

isTeacher = (req, res, next) => {
    if (req.user.role !== 'teacher') return res.sendStatus(403);
    next();
};

isStudent = (req, res, next) => {
    if (req.user.role !== 'student') return res.sendStatus(403);
    next();
};

module.exports = {
    generateTokens,
    authenticateToken,
    isTeacher,
    isStudent
};
