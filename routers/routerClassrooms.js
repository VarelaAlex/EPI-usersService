const express = require('express');
const database = require("../database");
let { authenticateToken, isTeacher } = require('../auth');

const routerClassrooms = express.Router();

routerClassrooms.post("/", authenticateToken, isTeacher, async (req, res) => {

    let { name, level } = req.body;
    let teacherId = req.user?.id;

    if (!name?.trim()) {
        return res.status(400).json({ error: { name: "classrooms.create.error.name" } });
    }

    if (!teacherId) {
        return res.status(400).json({ error: { teacher: "classrooms.create.error.teacher" } });
    }



    let classroom = null;
    try {
        let classroomName = await database.query('SELECT name FROM classrooms WHERE name = ? AND teacherId = ?', [name, teacherId]);

        if (classroomName.length > 0) {
            return res.status(404).json({ error: { name: "classrooms.create.error.repeated" } });
        }

        classroom = await database.query('INSERT INTO classrooms (name,level, teacherId) VALUES (?,?,?)', [name, level, teacherId]);
    } catch (e) {
        return res.status(500).json({ error: { type: "internalServerError", message: e } });
    } finally {
        
    }

    res.status(200).json({ inserted: classroom });
});

routerClassrooms.put("/:classroomName", authenticateToken, isTeacher, async (req, res) => {

    let { classroomName } = req.params;
    let { name, level } = req.body;
    let teacherId = req.user?.id;

    if (!classroomName?.trim()) {
        return res.status(400).json({ error: { classroomName: "classrooms.create.error.classroomName" } });
    }

    if (!name?.trim()) {
        return res.status(400).json({ error: { newClassroomName: "classrooms.create.error.newClassroomName" } });
    }

    if (!teacherId) {
        return res.status(400).json({ error: { teacher: "classrooms.create.error.teacher" } });
    }

    

    let classroom = null;
    try {
        let classroomNameFound = await database.query('SELECT name FROM classrooms WHERE name = ? AND teacherId = ?', [name, teacherId]);

        if (classroomNameFound.length) {
            return res.status(404).json({ error: { repeatedName: "classrooms.create.error.repeated" } });
        }

        classroom = await database.query('UPDATE classrooms SET name = ? WHERE name = ? AND teacherId = ?', [name, classroomName, teacherId]);
    } catch (e) {
        return res.status(500).json({ error: { type: "internalServerError", message: e } });
    } finally {
        
    }

    res.status(200).json({ updated: classroom });
});

routerClassrooms.get("/:classroomName", authenticateToken, isTeacher, async (req, res) => {

    let { classroomName } = req.params;

    if (!classroomName) {
        return res.status(400).json({ error: { classroomName: "classrooms.detail.error.classroomName" } });
    }



    let classroom = null;
    try {
        classroom = await database.query('SELECT c.name, c.level FROM classrooms c WHERE name = ?', [classroomName]);
    } catch (e) {
        return res.status(500).json({ error: { type: "internalServerError", message: e } });
    } finally {

    }

    if (classroom) {
        return res.status(404).json({ error: { email: "classrooms.detail.error.notExist" } });
    }

    res.status(200).json(classroom);
});

routerClassrooms.get("/list", authenticateToken, isTeacher, async (req, res) => {

    let teacherId = req.user?.id;

    if (!teacherId) {
        return res.status(400).json({ error: { teacherId: "classrooms.list.error.teacher" } });
    }

    

    let classrooms = null;
    try {
        classrooms = await database.query('SELECT c.id, c.name, COUNT(s.id) numberStudents FROM classrooms c LEFT JOIN students s ON s.classroomId=c.id WHERE teacherId=? GROUP BY c.name', [teacherId]);
    } catch (e) {
        return res.status(500).json({ error: { type: "internalServerError", message: e } });
    } finally {
        
    }

    if (classrooms.length <= 0) {
        return res.status(404).json({ error: { email: "classrooms.list.error.notExist" } });
    }

    res.status(200).json(classrooms);
});

routerClassrooms.delete("/:classroomName", authenticateToken, isTeacher, async (req, res) => {

    let { classroomName } = req.params;
    let teacherId = req.user?.id;

    if (!teacherId) {
        return res.status(400).json({ error: { teacherId: "classrooms.delete.error.teacher" } });
    }

    if (!classroomName?.trim()) {
        return res.status(400).json({ error: { id: "classrooms.delete.error.name" } });
    }

    let result = null;

    try {
        result = await database.query("DELETE FROM classrooms WHERE name = ? AND teacherId = ?", [classroomName, teacherId]);
    } catch (e) {
        return res.status(500).json({ error: { type: "internalServerError", message: e } });
    } finally {
        
    }

    if (result?.affectedRows === 0) {
        return res.status(404).json({ error: { classroom: "classrooms.delete.error.notExist" } });
    }

    res.status(200).json({ deleted: true });
});

module.exports = routerClassrooms;