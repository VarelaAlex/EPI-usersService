const express = require('express');
const database = require("../database");
const {
    generateTokens,
    authenticateToken,
    isTeacher,
} = require('../auth');
require('dotenv').config();

const routerTeachers = express.Router();

routerTeachers.post("/", async (req, res) => {

    let { name, lastName, email, password } = req.body;

    if (!name?.trim()) {
        return res.status(400).json({ error: { name: "signup.error.name" } });
    }

    if (!lastName?.trim()) {
        return res.status(400).json({ error: { lastName: "signup.error.lastName" } });
    }

    if (!email?.trim()) {
        return res.status(400).json({ error: { email: "signup.error.email" } });
    }

    if (!password?.trim()) {
        return res.status(400).json({ error: { password: "signup.error.password.empty" } });
    }

    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
        return res.status(400).json({ error: { email: "signup.error.email.format" } });
    }

    database.connect();

    let teacher = null;
    try {
        let teacherEmail = await database.query('SELECT email FROM teachers WHERE email = ?', [email]);

        if (teacherEmail.length > 0) {
            return res.status(404).json({ error: { email: "signup.error.email.repeated" } });
        }
        teacher = await database.query('INSERT INTO teachers (name,lastName,email,password) VALUES (?,?,?,?)', [name, lastName, email, password]);
    } catch (e) {
        return res.status(500).json({ error: { type: "internalServerError", message: e } });
    } finally {
        database.disconnect();
    }

    res.status(200).json({ inserted: teacher });
});

routerTeachers.post("/login", async (req, res) => {

    let { email, password } = req.body;

    if (!email?.trim()) {
        return res.status(400).json({ error: { email: "login.error.email.empty" } });
    }

    if (!password?.trim()) {
        return res.status(400).json({ error: { password: "login.error.password.empty" } });
    }

    database.connect();

    let teacher = null;
    try {
        let teacherEmail = await database.query('SELECT email FROM teachers WHERE email = ?', [email]);

        if (teacherEmail.length <= 0) {
            return res.status(404).json({ error: { email: "login.error.email.notExist" } });
        }

        teacher = await database.query('SELECT id, email, name FROM teachers WHERE email = ? AND password = ?', [email, password]);

        if (teacher.length === 0) {
            return res.status(400).json({ error: { password: "login.error.password.incorrect" } });
        }
    } catch (e) {
        return res.status(500).json({ error: { type: "internalServerError", message: e } });
    } finally {
        database.disconnect();
    }

    let user = {
        username: teacher[0].username,
        id: teacher[0].id,
        role: "teacher"
    };

    let tokens = generateTokens(user);
    database.connect();
    try {
        await database.query('INSERT INTO refreshTokens (refreshToken) VALUES (?)', [tokens.refreshToken]);
    } catch(e) {
        return res.status(500).json({ error: { type: "internalServerError", message: e } });
    } finally {
        database.disconnect();
    }

    res.status(200).json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        name: teacher[0].name
    });
});

routerTeachers.get("/checkLogin", authenticateToken, isTeacher, async (_req, res) => {
    return res.status(200).json({ message: "OK" });
});

module.exports = routerTeachers;