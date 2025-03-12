const express = require("express");
const jwt = require("jsonwebtoken");
let cors = require("cors");
const routerTeachers = require("./routers/routerTeacher");
const routerStudents = require("./routers/routerStudents");
const routerClassrooms = require("./routers/routerClassrooms");
const routerSurveys = require("./routers/routerSurveys");
const database = require("./database");
require("dotenv").config();

const port = process.env.PORT;
const app = express();

app.use(cors({
	             origin: "*", methods: "GET, POST, PUT, DELETE, OPTIONS", allowedHeaders: "Origin, X-Requested-With, Content-Type, Accept, Authorization", credentials: true
             }));

app.options("*", (req, res) => {
	res.status(204).send(); // Handles preflight requests
});

app.use(express.json());

app.use("/teachers", routerTeachers);
app.use("/students", routerStudents);
app.use("/classrooms", routerClassrooms);
app.use("/surveys", routerSurveys);

let findRefreshToken = async (refreshToken) => {
	try {
		let refreshTokenResponse = await database.query("SELECT refreshToken FROM refreshTokens WHERE refreshToken = ?", [refreshToken]);
		if ( refreshTokenResponse.length <= 0 ) {
			return false;
		}
		return true;
	}
	catch {
		return false;
	}
};

app.post("/token", async (req, res) => {
	let refreshToken = req.body.refreshToken;
	if ( !refreshToken ) {
		console.log("No refreshToken provided " + Date.now());
		return res.status(401).json({ error: "Unauthorized" });
	}
	if ( !await findRefreshToken(refreshToken) ) {
		console.log("There is no refreshToken in the DB " + Date.now());
		try {
			await database.query("DELETE FROM refreshTokens WHERE refreshToken = ?", [refreshToken]);
		}
		catch {
			return false;
		}
		return res.status(403).json({ error: "Forbidden" });
	}

	jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, user) => {
		if ( err ) {
			console.log("The refreshToken is not valid " + Date.now());
			try {
				await database.query("DELETE FROM refreshTokens WHERE refreshToken = ?", [refreshToken]);
			}
			catch {
				return false;
			}
			return res.status(403).json({ error: "Forbidden" });
		}

		const accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "0.3h" });
		res.status(200).json(accessToken);
	});
});

app.post("/logout", async (req, res) => {
	let refreshToken = req.body.token;
	try {
		await database.query("DELETE FROM refreshTokens WHERE refreshToken = ?", [refreshToken]);
	}
	catch {
		return false;
	}
	res.status(204).json({ message: "No content" });
});

const server = app.listen(port, () => {
	console.log("Active server listening on port", port);
});

module.exports = { app, findRefreshToken, server };