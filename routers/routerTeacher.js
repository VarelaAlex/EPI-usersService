const express = require('express');
const database = require("../database");
const activeApiKeys = require("../activeApiKeys");
const jwt = require("jsonwebtoken");

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

    let email = req.body.email;
    let password = req.body.password;

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

        teacher = await database.query('SELECT id, email FROM teachers WHERE email = ? AND password = ?', [email, password]);

        if (teacher.length === 0) {
            return res.status(400).json({ error: { password: "login.error.password.incorrect" } });
        }
    } catch (e) {
        return res.status(500).json({ error: { type: "internalServerError", message: e } });
    } finally {
        database.disconnect();
    }

    let apiKey = jwt.sign(
        {
            email: teacher[0].email,
            id: teacher[0].id
        },
        "HYTEXJWTSecret");
    activeApiKeys.push(apiKey);

    res.status(200).json({
        apiKey: apiKey,
        id: teacher[0].id,
        email: teacher[0].email
    });
});

routerTeachers.get("/disconnect", async (req, res) => {

    let apiKeyIndex = activeApiKeys.indexOf(req.query.apiKey);
    if (apiKeyIndex > -1) {
        activeApiKeys.splice(apiKeyIndex, 1);
        res.status(200).json({ removed: true });
    } else {
        return res.status(404).json({ error: "Teacher not found" });
    }
});

routerTeachers.get("/checkLogin", async (_req, res) => {
    return res.status(200).json({ message: "OK" });
});

module.exports = routerTeachers;