const express = require('express');
const jwt = require("jsonwebtoken");
const activeApiKeys = require("./activeApiKeys");

const port = 8081;
const app = express();

var cors = require('cors');
const routerTeachers = require('./routers/routerTeacher');
app.use(cors());

app.use(express.json());

app.use(["/teachers/checkLogin"], (req, res, next) => {

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

app.listen(port, () => {
    console.log("Active server listening on port", port);
});