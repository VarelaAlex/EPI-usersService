const express = require('express');
const database = require("../database");
const activeApiKeys = require("../activeApiKeys");
const jwt = require("jsonwebtoken");

const routerClassrooms = express.Router();

routerClassrooms.post("/", async (req, res) => {

    let { name, teacherId } = req.body;

    if (!name?.trim()) {
        return res.status(400).json({ error: { name: "classrooms.create.error.name" } });
    }

    if (!teacherId?.trim()) {
        return res.status(400).json({ error: { teacher: "classrooms.create.error.teacher" } });
    }

    database.connect();

    let classroom = null;
    try {
        let classroomName = await database.query('SELECT name FROM classrooms WHERE name = ?, teacherId = ?', [name, teacherId]);

        if (classroomName.length > 0) {
            return res.status(404).json({ error: { name: "classrooms.create.error.repeated" } });
        }

        classroom = await database.query('INSERT INTO classrooms (name, teacherId) VALUES (?,?)', [name, teacherId]);
    } catch (e) {
        return res.status(500).json({ error: { type: "internalServerError", message: e } });
    } finally {
        database.disconnect();
    }

    res.status(200).json({ inserted: classroom });
});

routerClassrooms.get("/list", async (req, res) => {

    let teacherId = req.infoApiKey.id;

    if (!teacherId) {
        return res.status(400).json({ error: { teacherId: "classrooms.list.error.teacher" } });
    }

    database.connect();

    let classrooms = null;
    try {
        classrooms = await database.query('SELECT c.id, c.name, COUNT(s.id) numberStudents FROM classrooms c LEFT JOIN students s ON s.classroomId=c.id WHERE teacherId=? GROUP BY c.name', [teacherId]);
    } catch (e) {
        return res.status(500).json({ error: { type: "internalServerError", message: e } });
    } finally {
        database.disconnect();
    }

    if (classrooms.length <= 0) {
        return res.status(404).json({ error: { email: "classrooms.list.error.notExist" } });
    }

    res.status(200).json(classrooms);
});

module.exports = routerClassrooms;