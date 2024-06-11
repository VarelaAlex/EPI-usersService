const express = require('express');
const jwt = require("jsonwebtoken");
let activeApiKeys = require("./activeApiKeys");
let cors = require('cors');
const routerTeachers = require('./routers/routerTeacher');
const routerStudents = require('./routers/routerStudents');
const routerClassrooms = require('./routers/routerClassrooms');

const port = 8081;
const app = express();

app.use(cors());

app.use(express.json());
/*
app.use(["/teachers/*"], (req, res, next) => {

    let apiKey = req.query.apiKey;
    if (apiKey === undefined) {
        return res.status(401).json({ error: "No apiKey" });
    }
    let infoApiKey = jwt.verify(apiKey, "HYTEXJWTSecret");
    if (infoApiKey === undefined || activeApiKeys.indexOf(apiKey) === -1 || infoApiKey.role !== "teacher") {
        return res.status(401).json({ error: "Invalid apiKey" });
    }
    req.infoApiKey = infoApiKey;
    next();
});

app.use(["/students/*"], (req, res, next) => {

    let apiKey = req.query.apiKey;
    if (apiKey === undefined) {
        return res.status(401).json({ error: "No apiKey" });
    }
    let infoApiKey = jwt.verify(apiKey, "HYTEXJWTSecret");
    if (infoApiKey === undefined || activeApiKeys.indexOf(apiKey) === -1 || infoApiKey.role !== "student") {
        return res.status(401).json({ error: "Invalid apiKey" });
    }
    req.infoApiKey = infoApiKey;
    next();
});
*/
app.use(["/teachers/checkLogin", "/students/checkLogin", "/classrooms"], (req, res, next) => {

    let apiKey = req.query.apiKey;
    if (apiKey === undefined) {
        return res.status(401).json({ error: "No apiKey" });
    }
    let infoApiKey = jwt.verify(apiKey, "HYTEXJWTSecret");
    if (infoApiKey === undefined || activeApiKeys.indexOf(apiKey) === -1) {
        return res.status(401).json({ error: "Invalid apiKey" });
    }
    req.infoApiKey = infoApiKey;
    next();
});

app.use("/teachers", routerTeachers);
app.use("/students", routerStudents);
app.use("/classrooms", routerClassrooms);

app.get("/checkApiKey", async (req, res) => {
    let apiKey = req.query.apiKey;
    if (apiKey === undefined) {
        return res.status(401).json({ error: "No apiKey" });
    }
    let infoApiKey = jwt.verify(apiKey, "HYTEXJWTSecret");
    if (infoApiKey === undefined || activeApiKeys.indexOf(apiKey) === -1) {
        return res.status(401).json({ error: "Invalid apiKey" });
    }
    return res.status(200).json({ infoApiKey });
});

app.listen(port, () => {
    console.log("Active server listening on port", port);
});