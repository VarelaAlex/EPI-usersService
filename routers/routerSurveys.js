const express = require("express");
const database = require("../database");
const { authenticateToken, isTeacher } = require("../auth");
require("dotenv").config();

const routerSurveys = express.Router();

routerSurveys.post("/:surveyCode", authenticateToken, isTeacher, async (req, res) => {

	let { studentId, score } = req.body;
	let teacherId = req.user.id;

	if ( !studentId ) {
		return res.status(400).json({ error: { studentId: "survey.error.studentId.required" } });
	}
	if ( !teacherId ) {
		return res.status(400).json({ error: { teacherId: "survey.error.teacherId.required" } });
	}
	if ( score!== 0 && !score ) {
		return res.status(400).json({ error: { score: "survey.error.score.required" } });
	}
	if ( score < 0 ) {
		return res.status(400).json({ error: { score: "survey.error.score.invalid" } });
	}

	let datetime = new Date().toISOString().slice(0, 19).replace("T", " ");

	let response = null;
	try {
		response = await database.query("INSERT INTO surveys (studentId, teacherId, score, date, surveyCode) VALUES (?,?,?,?,?)", [parseInt(studentId), teacherId, score, datetime, req.params.surveyCode]);
	}
	catch ( e ) {
		return res.status(500).json({ error: { type: "internalServerError", message: e } });
	}
	finally {

	}

	res.status(200).json({ message: "survey.success" });
});

routerSurveys.get("/:studentId", authenticateToken, isTeacher, async (req, res) => {
	let result = null;
	try {
		result = await database.query(" SELECT s.* FROM surveys s where s.studentId = ? AND surveyCode = 'A' ORDER BY date DESC LIMIT 1", [req.params.studentId]);
	}
	catch ( e ) {
		return res.status(500).json({ error: { type: "internalServerError", message: e } });
	}
	finally {

	}

	if (result && result.length <= 0 ) {
		return res.status(500).json({ error: { type: "internalServerError" } });
	}

	res.status(200).json(result[0]);
})

module.exports = routerSurveys;