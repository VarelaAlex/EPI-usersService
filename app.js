const express = require('express');
const jwt = require("jsonwebtoken");
let cors = require('cors');
const routerTeachers = require('./routers/routerTeacher');
const routerStudents = require('./routers/routerStudents');
const routerClassrooms = require('./routers/routerClassrooms');
const database = require('./database');
require('dotenv').config();

const port = process.env.PORT;
const app = express();

app.use(cors({
    origin: 'https://hytex-front-production.up.railway.app',
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://hytex-front-production.up.railway.app');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());

app.use("/teachers", routerTeachers);
app.use("/students", routerStudents);
app.use("/classrooms", routerClassrooms);

let findRefreshToken = async (refreshToken) => {

    database.connect();
    try {
        let refreshTokenResponse = await database.query('SELECT refreshToken FROM refreshTokens WHERE refreshToken = ?', [refreshToken]);
        if (refreshTokenResponse.length <= 0) return false;
        return true;
    } catch {
        return false;
    } finally {
        database.disconnect();
    }
};

app.post('/token', (req, res) => {
    const refreshToken = req.body.token;
    if (!refreshToken) return res.status(401).json({ error: "Unauthorized" });
    if (!findRefreshToken(refreshToken)) return res.status(403).json({ error: "Forbidden" });

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Forbidden" });

        const accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
        res.status(200).json(accessToken);
    });
});

app.post('/logout', async (req, res) => {
    const refreshToken = req.body.token;
    database.connect();
    try {
        await database.query('DELETE FROM refreshTokens WHERE refreshToken = ?', [refreshToken]);
    } catch {
        return false;
    } finally {
        database.disconnect();
    }
    res.status(204).json({ message: "No content" });
});

app.listen(port, () => {
    console.log("Active server listening on port", port);
});
