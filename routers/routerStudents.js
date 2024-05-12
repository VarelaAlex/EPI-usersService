const express = require('express');
const database = require("../database");
const activeApiKeys = require("../activeApiKeys");
const jwt = require("jsonwebtoken");

const routerStudents = express.Router();

routerStudents.post("/", async (req, res) => {

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

routerStudents.post("/login", async (req, res) => {

    let { username } = req.body;

    if (!username?.trim()) {
        return res.status(400).json({ error: { username: "login.error.username.empty" } });
    }

    database.connect();

    let student = null;
    try {
        student = await database.query('SELECT id, username, name FROM students WHERE username = ?', [username]);

        if (username.length <= 0) {
            return res.status(404).json({ error: { email: "login.error.username.notExist" } });
        }
    } catch (e) {
        return res.status(500).json({ error: { type: "internalServerError", message: e } });
    } finally {
        database.disconnect();
    }

    let apiKey = jwt.sign(
        {
            username: student[0].username,
            id: student[0].id,
            role: "student"
        },
        "HYTEXJWTSecret");
    activeApiKeys.push(apiKey);

    res.status(200).json({
        apiKey: apiKey,
        name: student[0].name,
        id: student[0].id,
        username: student[0].username
    });
});

routerStudents.get("/disconnect", async (req, res) => {

    let apiKeyIndex = activeApiKeys.indexOf(req.query.apiKey);
    if (apiKeyIndex > -1) {
        activeApiKeys.splice(apiKeyIndex, 1);
        res.status(200).json({ removed: true });
    } else {
        return res.status(404).json({ error: "Student not found" });
    }
});

routerStudents.get("/checkLogin", async (_req, res) => {
    return res.status(200).json({ message: "OK" });
});

module.exports = routerStudents;