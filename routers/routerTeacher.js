const express = require('express');
const database = require("../database");
const activeApiKeys = require("../activeApiKeys");
const jwt = require("jsonwebtoken");

const routerTeachers = express.Router();

routerTeachers.post("/", async (req, res) => {

    let { name, email, password } = req.body;
    let errors = [];

    if (email === undefined || email.trim().length === 0) {
        errors.push("Email is required");
    }
    if (password === undefined || password.trim().length === 0) {
        errors.push("Password is required");
    }
    if (name === undefined || name.trim().length === 0) {
        errors.push("Name is required");
    }
    if (password?.length < 8) {
        errors.push("Password must have at least 8 characters");
    }
    if (errors.length > 0) {
        return res.status(400).json({ error: errors });
    }

    database.connect();

    let insertedTeacher = null;
    try {
        teacherWithSameEmail = await database.query('SELECT email FROM teachers WHERE email = ?', [email]);

        if (teacherWithSameEmail.length > 0) {
            database.disconnect();
            return res.status(400).json({ error: "There is already a teacher with this email" });
        }
        insertedTeacher = await database.query('INSERT INTO teacher (email,password,name) VALUES (?,?,?)', [email, password, name]);
        database.disconnect();
    } catch (e) {
        database.disconnect();
        return res.status(400).json({ error: "Internal server error" });
    }

    res.status(200).json({ inserted: insertedTeacher });
});

routerTeachers.post("/login", async (req, res) => {

    let email = req.body.email;
    let password = req.body.password;
    let errors = [];

    if (email === undefined) {
        errors.push("Email is required");
    }
    if (password === undefined) {
        errors.push("Password is required");
    }
    if (errors.length > 0) {
        return res.status(400).json({ error: errors });
    }

    database.connect();

    let selectedTeachers = null;
    try {
        selectedTeachers = await database.query('SELECT id, email FROM teachers WHERE email = ? AND password = ?', [email, password]);
        database.disconnect();
    } catch (e) {
        database.disconnect();
        return res.status(400).json({ error: "Internal server error" });
    }

    if (selectedTeachers.length === 0) {
        return res.status(401).json({ error: "Invalid email or password" });
    }

    let apiKey = jwt.sign(
        {
            email: selectedTeachers[0].email,
            id: selectedTeachers[0].id
        },
        "HYTEXJWTSecret");
    activeApiKeys.push(apiKey);


    res.json({
        apiKey: apiKey,
        id: selectedTeachers[0].id,
        email: selectedTeachers[0].email
    });
});

routerTeachers.get("/disconnect", async (req, res) => {

    let apiKeyIndex = activeApiKeys.indexOf(req.query.apiKey);
    if (apiKeyIndex > -1) {
        activeApiKeys.splice(apiKeyIndex, 1);
        res.status(200).json({ removed: true });
    } else {
        return res.status(400).json({ error: "Teacher not found" });
    }
});

routerTeachers.get("/checkLogin", async (_req, res) => {
    return res.status(200).json({ message: "OK" });
});

module.exports = routerTeachers;