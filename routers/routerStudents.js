const express = require('express');
const database = require("../database");
const jwt = require("jsonwebtoken");
require('dotenv').config();

const routerStudents = express.Router();

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
        process.env.SECRET,
        { expiresIn: '1h' });

    res.status(200).json({
        apiKey: apiKey,
        name: student[0].name,
        id: student[0].id,
        username: student[0].username
    });
});

routerStudents.get("/checkLogin", async (_req, res) => {
    return res.status(200).json({ message: "OK" });
});

routerStudents.get("/:studentId", async (req, res) => {

    let { studentId } = req.params;

    let result = null;

    database.connect();
    try {
        result = await database.query("SELECT * FROM students WHERE id = ?", [studentId]);
    } catch (e) {
        return res.status(500).json({ error: { type: "internalServerError", message: e } });
    } finally {
        database.disconnect();
    }

    if (result.length === 0) {
        return res.status(404).json({ error: "student.error.notExist" });
    }

    res.status(200).json(result[0]);
});

module.exports = routerStudents;