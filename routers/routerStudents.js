const express = require('express');
const database = require("../database");
const {
    generateTokens,
    authenticateToken,
    isStudent,
} = require('../auth');
require('dotenv').config();

const routerStudents = express.Router();

routerStudents.post("/login", async (req, res) => {

    console.log(`Received ${req.method} request from ${req.headers.origin} to ${req.originalUrl}`);
    res.on('finish', () => {
        console.log('Response Headers:', res.getHeaders());
    });

    let { username } = req.body;

    if (!username?.trim()) {
        return res.status(400).json({ error: { username: "login.error.username.empty" } });
    }

    database.connect();

    let response = null;
    try {
        response = await database.query('SELECT id, username, name FROM students WHERE username = ?', [username]);

        if (username.length <= 0) {
            return res.status(404).json({ error: { email: "login.error.username.notExist" } });
        }
    } catch (e) {
        return res.status(500).json({ error: { type: "internalServerError", message: e } });
    } finally {
        database.disconnect();
    }

    let user = {
        username: response[0].username,
        id: response[0].id,
        role: "student"
    };

    let tokens = generateTokens(user);
    database.connect();
    try {
        await database.query('INSERT INTO refreshTokens (refreshToken) VALUES (?)', [tokens.refreshToken]);
    } catch (e) {
        return res.status(500).json({ error: { type: "internalServerError", message: e } });
    } finally {
        database.disconnect();
    }

    res.status(200).json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        name: response[0].name
    });
});

routerStudents.get("/checkLogin", authenticateToken, isStudent, async (req, res) => {
    return res.status(200).json({ user: req.user });
});

module.exports = routerStudents;