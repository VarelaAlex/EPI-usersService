const express = require('express');
const database = require("../database");
const {
    generateTokens,
    authenticateToken,
    isStudent,
    isTeacher,
} = require('../auth');
require('dotenv').config();

let generateUsername = (name, lastName) => {
    let cleanName = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
    let cleanLastName = lastName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
    let username = cleanName.charAt(0) + cleanLastName;
    let randomNumber = Math.floor(Math.random() * 900) + 100;
    return username + randomNumber;
};

const routerStudents = express.Router();

routerStudents.post("/login", async (req, res) => {

    let { username } = req.body;

    if (!username?.trim()) {
        return res.status(400).json({ error: { username: "login.error.username.empty" } });
    }

    let response = null;
    try {
        response = await database.query('SELECT id, username, name FROM students WHERE username = ?', [username]);

        if (!response[0] || !response[0].username || response[0].username.length <= 0) {
            return res.status(404).json({ error: { email: "login.error.username.notExist" } });
        }
    } catch (e) {
        return res.status(500).json({ error: { type: "internalServerError", message: e } });
    } finally {

    }

    let user = {
        username: response[0].username,
        id: response[0].id,
        role: "student"
    };

    let tokens = generateTokens(user);

    try {
        await database.query('INSERT INTO refreshTokens (refreshToken) VALUES (?)', [tokens.refreshToken]);
    } catch (e) {
        return res.status(500).json({ error: { type: "internalServerError", message: e } });
    } finally {

    }

    res.status(200).json({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        name: response[0].name
    });
});

routerStudents.post("/", authenticateToken, isTeacher, async (req, res) => {

    let { name, lastName, age, classroomName } = req.body;
    let teacherId = req.user?.id;

    if (!name?.trim()) {
        return res.status(400).json({ error: { name: "classrooms.detail.create.error.name.empty" } });
    }

    if (!lastName?.trim()) {
        return res.status(400).json({ error: { lastName: "classrooms.detail.create.error.lastName.empty" } });
    }

    if (!age) {
        return res.status(400).json({ error: { age: "classrooms.detail.create.error.age.empty" } });
    }

    if (age < 0) {
        return res.status(400).json({ error: { age: "classrooms.detail.create.error.age.negative" } });
    }

    if (!classroomName?.trim()) {
        return res.status(400).json({ error: { classroomName: "classrooms.detail.create.error.classroom.empty" } });
    }

    let username = generateUsername(name, lastName);



    let response = null;
    try {
        let classroomId = await database.query("SELECT id FROM classrooms WHERE name = ? AND teacherId = ?", [classroomName, teacherId]);
        response = await database.query('INSERT INTO students (username, name, lastName, age, classroomId) VALUES (?,?,?,?,?)', [username, name, lastName, age, classroomId[0].id]);
    } catch (e) {
        return res.status(500).json({ error: { type: "internalServerError", message: e } });
    } finally {

    }

    res.status(200).json({ inserted: response });
});

routerStudents.put("/:studentId", authenticateToken, isTeacher, async (req, res) => {

    let { studentId } = req.params;
    let { name, lastName, age, classroomId } = req.body;

    if (!studentId?.trim()) {
        return res.status(400).json({ error: { id: "classrooms.detail.update.error.id" } });
    }

	if (!name?.trim()) {
		return res.status(400).json({ error: { name: "classrooms.detail.update.error.name.empty" } });
	}

	if (!lastName?.trim()) {
		return res.status(400).json({ error: { lastName: "classrooms.detail.update.error.lastName.empty" } });
	}

	if (!age) {
		return res.status(400).json({ error: { age: "classrooms.detail.update.error.age.empty" } });
	}

	if (age < 0) {
		return res.status(400).json({ error: { age: "classrooms.detail.update.error.age.negative" } });
	}

	if (!classroomId) {
		return res.status(400).json({ error: { classroomName: "classrooms.detail.update.error.classroom.empty" } });
	}

    let response = null;
    try {
        response = await database.query(
            'UPDATE students \
            SET \
                name = IFNULL(?, name), \
                lastName = IFNULL(?, lastName), \
                age = IFNULL(?, age), \
                classroomId = IFNULL(?, classroomId) \
            WHERE id = ?', [name, lastName, age, classroomId, studentId]);
    } catch (e) {
        return res.status(500).json({ error: { type: "internalServerError", message: e } });
    } finally {

    }

    res.status(200).json({ student: response });
});

routerStudents.delete("/:studentId", authenticateToken, isTeacher, async (req, res) => {

    let { studentId } = req.params;

    if (!studentId) {
        return res.status(400).json({ error: { id: "classrooms.detail.delete.error.id" } });
    }

    let result = null;


    try {
        result = await database.query("DELETE FROM students WHERE id = ?", [studentId]);
    } catch (e) {
        return res.status(500).json({ error: { type: "internalServerError", message: e } });
    } finally {

    }

    if (result.affectedRows === 0) {
        return res.status(404).json({ error: { classroom: "classrooms.detail.delete.error.notExist" } });
    }

    res.status(200).json({ deleted: true });
});

routerStudents.get("/checkLogin", authenticateToken, isStudent, async (req, res) => {
    return res.status(200).json({ user: req.user });
});

routerStudents.get("/currentStudent", authenticateToken, isStudent, async (req, res) => {

    let studentId = req.user.id;


    try {
        result = await database.query("SELECT s.* FROM students s where s.id = ?", [studentId]);
    } catch (e) {
        return res.status(500).json({ error: { type: "internalServerError", message: e } });
    } finally {

    }

    if (result.length <= 0) {
        return res.status(500).json({ error: { type: "internalServerError"} });
    }

    res.status(200).json(result[0]);
});

routerStudents.get("/:studentId", authenticateToken, isTeacher, async (req, res) => {

    let { studentId } = req.params;
    let teacherId = req.user.id;

    if (!teacherId) {
        return res.status(400).json({ error: { teacher: "classrooms.detail.error.teacher" } });
    }

    if (!studentId) {
        return res.status(400).json({ error: { id: "classrooms.detail.error.student" } });
    }

    let result = null;



    try {
        result = await database.query("SELECT s.* FROM students s JOIN classrooms c ON c.id = s.classroomId JOIN teachers t ON t.id = c.teacherId WHERE s.id = ? AND t.id = ?", [studentId, teacherId]);
    } catch (e) {
        return res.status(500).json({ error: { type: "internalServerError", message: e } });
    } finally {

    }

    if (result.length <= 0) {
        return res.status(404).json({ error: { classroom: "classrooms.detail.error.notExist" } });
    }

    res.status(200).json(result[0]);
});

routerStudents.get("/list/:classroomName", authenticateToken, isTeacher, async (req, res) => {

    let { classroomName } = req.params;
    let teacherId = req.user.id;

    if (!teacherId) {
        return res.status(400).json({ error: { teacher: "classrooms.detail.error.teacher" } });
    }

    if (!classroomName) {
        return res.status(400).json({ error: { id: "classrooms.detail.error.classroom" } });
    }

    let result = null;



    try {
        result = await database.query("SELECT s.username, s.id, s.name, s.lastName, s.age FROM students s JOIN classrooms c ON c.teacherId = ? WHERE c.name = ? AND s.classroomId = c.id", [teacherId, classroomName]);
    } catch (e) {
        return res.status(500).json({ error: { type: "internalServerError", message: e } });
    } finally {

    }

    if (result.length <= 0) {
        return res.status(404).json({ error: { classroom: "classrooms.detail.error.notExist" } });
    }

    res.status(200).json(result);
});

module.exports = routerStudents;