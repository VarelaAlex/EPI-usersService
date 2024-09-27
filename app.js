const express = require('express');
const jwt = require("jsonwebtoken");
let cors = require('cors');
const routerTeachers = require('./routers/routerTeacher');
const routerStudents = require('./routers/routerStudents');
const routerClassrooms = require('./routers/routerClassrooms');
const https = require('https');
const fs = require('fs');
require('dotenv').config();

const options = {
    key: fs.readFileSync('key.key'),
    cert: fs.readFileSync('cert.cert'),
    passphrase: process.env.PASSPHRASE
};

const port = process.env.PORT;
const app = express();

app.use(cors());

app.use(express.json());

app.use(["/teachers/checkLogin", "/students/checkLogin", "/classrooms"], (req, res, next) => {

    let apiKey = req.query.apiKey;
    if (apiKey === undefined) {
        return res.status(401).json({ error: "No apiKey" });
    }
    let infoApiKey = jwt.verify(apiKey, process.env.SECRET);
    if (infoApiKey === undefined) {
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
    let infoApiKey = jwt.verify(apiKey, process.env.SECRET);
    if (infoApiKey === undefined) {
        return res.status(401).json({ error: "Invalid apiKey" });
    }
    return res.status(200).json({ infoApiKey });
});

https.createServer(options, app).listen(port, () => {
    console.log("Active server listening on port", port);
});
/* 
app.listen(port, () => {
    console.log("Active server listening on port", port);
});
*/