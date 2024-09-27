const express = require('express');
const database = require("../database");

const routerClassrooms = express.Router();

routerClassrooms.post("/", async (req, res) => {

    let { name } = req.body;
    let teacherId = req.infoApiKey.id;

    if (!name?.trim()) {
        return res.status(400).json({ error: { name: "classrooms.create.error.name" } });
    }

    if (!teacherId) {
        return res.status(400).json({ error: { teacher: "classrooms.create.error.teacher" } });
    }

    database.connect();

    let classroom = null;
    try {
        let classroomName = await database.query('SELECT name FROM classrooms WHERE name = ? AND teacherId = ?', [name, teacherId]);

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

routerClassrooms.delete("/:classroomId", async (req, res) => {

    let { classroomId } = req.params;

    if (!classroomId) {
        return res.status(400).json({ error: { id: "classrooms.delete.error.id" } });
    }

    let result = null;

    database.connect();
    try {
        result = await database.query("DELETE FROM classrooms WHERE id = ?", [classroomId]);
    } catch (e) {
        return res.status(500).json({ error: { type: "internalServerError", message: e } });
    } finally {
        database.disconnect();
    }

    if (result.affectedRows === 0) {
        return res.status(404).json({ error: { classroom: "classrooms.delete.error.notExist" } });
    }

    res.status(200).json({ deleted: true });
});

module.exports = routerClassrooms;